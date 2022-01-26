import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { Form, DatePicker, Button, Row, Col, Input } from "antd";

import SelectCompany from "@/components/selectCompany";
import SelectItemList from "@/components/selectItemList";
import AddItemsInPo from "@/components/addItemsInPo";
import { createPurchaseOrder } from "@/hooks/purchase";
import { DATE_FORMAT, VALIDATE_MESSAGE, DATE_PICKER_CONFIG } from "@/utils/ui.util";
import AppBackButton from "@/components/backButton";

const AddEditPurchase = ({ purchase }) => {
  const router = useRouter();
  const [companyId, setCompanyId] = useState(null);
  const [selectedListType, setSelectedListType] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectCompanyOnChange = useCallback((id) => setCompanyId(id), [companyId]);
  const selectItemListOnChange = useCallback((type) => setSelectedListType(type), [selectedListType]);

  const onFinish = async (value) => {
    setLoading(true);
    const orderData = { ...value };
    orderData.purchaseDate = orderData.purchaseDate.toISOString();
    orderData.companyId = companyId;
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
      await createPurchaseOrder(orderData);
      router.push("/purchase");
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  return (
    <div>
      <Form layout="vertical" name="nest-messages" onFinish={onFinish} validateMessages={VALIDATE_MESSAGE}>
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item label="Select Company">
              <SelectCompany selectCompanyOnChange={selectCompanyOnChange} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Select List Type">
              <SelectItemList selectItemListOnChange={selectItemListOnChange} />
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
              <Input type="number" />
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
              />
            </Form.Item>
          </Col>
        </Row>

        {companyId && selectedListType && (
          <>
            <AddItemsInPo companyId={companyId} type={selectedListType} setData={setData} data={data} />
            <Form.Item>
              <Button loading={loading} type="primary" htmlType="submit">
                Create Purchase
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
