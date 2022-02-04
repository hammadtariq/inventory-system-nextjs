import { useCallback, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { Form, Button, Row, Col, Input } from "antd";
import dayjs from "dayjs";
import _isEmpty from "lodash/isEmpty";

import SelectCompany from "@/components/selectCompany";
import SelectItemList from "@/components/selectItemList";
import AddItemsInPo from "@/components/addItemsInPo";

import { createPurchaseOrder, updatePurchaseOrder } from "@/hooks/purchase";
import { DATE_FORMAT, VALIDATE_MESSAGE, sumItemsPrice } from "@/utils/ui.util";
import AppBackButton from "@/components/backButton";
import DatePicker from "@/components/datePicker";

const AddEditPurchase = ({ purchase }) => {
  const router = useRouter();
  const [companyId, setCompanyId] = useState(null);
  const [selectedListType, setSelectedListType] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const selectCompanyOnChange = useCallback((id) => setCompanyId(id), [companyId]);
  const setDataHandler = useCallback((data) => setData(data), [data]);
  const selectItemListOnChange = useCallback((type) => setSelectedListType(type), [selectedListType]);

  const totalAmount = useMemo(() => sumItemsPrice(data), [data]);

  useEffect(() => {
    if (purchase) {
      const {
        company,
        baleType,
        invoiceNumber = "",
        purchaseDate = "",
        purchasedProducts = [],
        surCharge = "",
        totalAmount = 0,
      } = purchase;
      const { id, companyName } = company;
      form.setFieldsValue({
        companyName,
        companyId: id,
        invoiceNumber,
        surCharge,
        totalAmount,
        purchaseDate: dayjs(purchaseDate),
      });

      setData(purchasedProducts);
      setCompanyId(id);
      setSelectedListType(baleType);
    }
  }, [purchase]);

  // update total amount value useing form field
  useEffect(() => {
    form.setFieldsValue({
      totalAmount,
    });
  }, [totalAmount]);

  // to set default and previous date in form
  useEffect(() => {
    form.setFieldsValue({
      purchaseDate: purchase?.purchaseDate ? dayjs(purchase?.purchaseDate) : dayjs(),
    });
  }, []);

  const onFinish = async (value) => {
    setLoading(true);
    const orderData = { ...value };

    orderData.purchaseDate = orderData.purchaseDate ? dayjs(orderData.purchaseDate) : dayjs();
    orderData.companyId = companyId;
    orderData.baleType = selectedListType;
    orderData.purchasedProducts = data.map((product) => {
      const { itemName, noOfBales, ratePerBale, baleWeightLbs, baleWeightKgs, ratePerLbs, ratePerKgs, id } = product;
      return {
        itemName,
        id,
        noOfBales,
        ratePerBale,
        ...(baleWeightLbs && { baleWeightLbs }),
        ...(baleWeightKgs && { baleWeightKgs }),
        ...(ratePerLbs && { ratePerLbs }),
        ...(ratePerKgs && { ratePerKgs }),
      };
    });
    try {
      if (purchase) {
        await updatePurchaseOrder(purchase.id, orderData);
      } else {
        await createPurchaseOrder(orderData);
      }
      router.push("/purchase");
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };
  return (
    <div>
      <Form form={form} layout="vertical" name="nest-messages" onFinish={onFinish} validateMessages={VALIDATE_MESSAGE}>
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item label="Select Company">
              <SelectCompany
                disabled={purchase && true}
                defaultValue={purchase && purchase.company.id}
                selectCompanyOnChange={selectCompanyOnChange}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Select List Type">
              <SelectItemList
                disabled={purchase && true}
                defaultValue={purchase && purchase.baleType}
                selectItemListOnChange={selectItemListOnChange}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="totalAmount"
              label="Total Amount (RS)"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Input type="number" readOnly />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="invoiceNumber" label="Invoice No">
              <Input type="text" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="surCharge" label="Sur Charge (RS)">
              <Input type="number" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Select PO Date" name="purchaseDate">
              <DatePicker
                style={{ width: "100%" }}
                disabledDate={(current) => current && current.valueOf() > Date.now()}
                format={DATE_FORMAT}
                // defaultValue={dayjs()}
              />
            </Form.Item>
          </Col>
        </Row>

        {companyId && selectedListType && (
          <>
            <AddItemsInPo
              isEdit={!_isEmpty(purchase)}
              companyId={companyId}
              type={selectedListType}
              setData={setDataHandler}
              data={data}
            />
            <Form.Item>
              <Button loading={loading} type="primary" htmlType="submit">
                {purchase ? "Update" : " Create"} Purchase
              </Button>
            </Form.Item>
          </>
        )}
        <AppBackButton />
      </Form>
    </div>
  );
};
export default AddEditPurchase;
