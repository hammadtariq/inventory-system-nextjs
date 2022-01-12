import { useState } from "react";
import { useRouter } from "next/router";
import { Select, Form, Alert, DatePicker, Button, Row, Col, Input } from "antd";

import Title from "@/components/title";
import AddItemsInPo from "@/components/addItemsInPo";
import { useCompanyAttributes } from "@/hooks/company";
import { createPurchaseOrder } from "@/hooks/purchase";
import { ITEMS_LIST, DATE_FORMAT, VALIDATE_MESSAGE, DATE_PICKER_CONFIG } from "@/utils/ui";

const { Option } = Select;

const CreatePurchase = () => {
  const router = useRouter();
  const [companyId, setCompanyId] = useState(null);
  const [selectedListType, setSelectedListType] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const { company, isLoading, error } = useCompanyAttributes(["companyName", "id"]);

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

  if (error) return <Alert message={error} type="error" />;

  return (
    <div>
      <div>
        <Title level={2}>Create Purchase Order</Title>
      </div>
      <Form layout="vertical" name="nest-messages" onFinish={onFinish} validateMessages={VALIDATE_MESSAGE}>
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item label="Select Company">
              <Select
                loading={isLoading}
                showSearch
                placeholder="Search to Select Company"
                allowClear
                onChange={setCompanyId}
              >
                {company &&
                  company.map((obj) => (
                    <Option key={obj.id} value={obj.id}>
                      {obj.companyName}
                    </Option>
                  ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Select List Type">
              <Select loading={isLoading} onChange={setSelectedListType}>
                {ITEMS_LIST.map((val) => (
                  <Option key={val} value={val}>
                    {val}
                  </Option>
                ))}
              </Select>
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
      </Form>
    </div>
  );
};
export default CreatePurchase;
