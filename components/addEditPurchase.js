import { useCallback, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { Form, DatePicker, Button, Row, Col, Input } from "antd";
import moment from "moment";

import SelectCompany from "@/components/selectCompany";
import SelectItemList from "@/components/selectItemList";
import AddItemsInPo from "@/components/addItemsInPo";

import { createPurchaseOrder, updatePurchaseOrder } from "@/hooks/purchase";
import { DATE_FORMAT, VALIDATE_MESSAGE, DATE_PICKER_CONFIG, sumItems } from "@/utils/ui.util";
import AppBackButton from "@/components/backButton";

const AddEditPurchase = ({ purchase }) => {
  const router = useRouter();
  const [companyId, setCompanyId] = useState(null);
  const [selectedListType, setSelectedListType] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (purchase) {
      const {
        company,
        baleType,
        invoiceNumber = "",
        purchaseDate = "",
        purchasedProducts = [],
        surCharge = "",
        totalAmount = "",
      } = purchase;
      const { id, companyName } = company;
      form.setFieldsValue({
        companyName,
        companyId: id,
        invoiceNumber,
        surCharge,
        totalAmount,
        purchaseDate: moment(purchaseDate),
      });
      setData(purchasedProducts);
      setCompanyId(id);
      setSelectedListType(baleType);
    }
  }, [purchase]);

  const selectCompanyOnChange = useCallback((id) => setCompanyId(id), [companyId]);
  const selectItemListOnChange = useCallback((type) => setSelectedListType(type), [selectedListType]);

  const onFinish = async (value) => {
    setLoading(true);
    const orderData = { ...value };
    orderData.purchaseDate = orderData.purchaseDate.toISOString();
    orderData.companyId = companyId;
    orderData.baleType = selectedListType;
    orderData.purchasedProducts = data.map((product) => {
      const { itemName, noOfBales, ratePerBale, baleWeightLbs, baleWeightKgs, ratePerLbs, ratePerKgs } = product;
      return {
        itemName,
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

  const totalAmount = useMemo(() => sumItems(data), [data]);

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
              // name="totalAmount"
              label="Total Amount (RS)"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Input type="number" defaultValue={totalAmount} value={totalAmount} readOnly />
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
            <Form.Item label="Select PO Date" name="purchaseDate" {...DATE_PICKER_CONFIG}>
              <DatePicker
                style={{ width: "100%" }}
                disabledDate={(current) => current && current.valueOf() > Date.now()}
                format={DATE_FORMAT}
                defaultOpen={new Date()}
              />
            </Form.Item>
          </Col>
        </Row>

        {companyId && selectedListType && (
          <>
            <AddItemsInPo companyId={companyId} type={selectedListType} setData={setData} data={data} />
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
