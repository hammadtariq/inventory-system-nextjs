import moment from "moment";
import { useCallback, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { Form, DatePicker, Button, Row, Col, Input, Select, Alert } from "antd";

import AppTitle from "@/components/title";
import AppBackButton from "@/components/backButton";
import SelectCustomer from "@/components/selectCustomer";
import UpdateSalesItems from "@/components/updateSaleItems";

import { useInventory } from "@/hooks/inventory";
import { DATE_FORMAT, VALIDATE_MESSAGE, DATE_PICKER_CONFIG, sumItemsPrice } from "@/utils/ui.util";
import { createSale } from "@/hooks/sales";

const { Option } = Select;

const CreateSale = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const { inventory, error, isLoading } = useInventory();

  const selectCustomerOnChange = useCallback((id) => setCustomerId(id), [customerId]);
  const totalAmount = useMemo(() => sumItemsPrice(selectedProducts), [selectedProducts]);

  const selectProductsOnChange = useCallback(
    (selectedId) => {
      const selectedItem = inventory.rows.filter((item) => selectedId.includes(item.id));
      setSelectedProducts(selectedItem);
    },
    [inventory]
  );

  const onFinish = async (value) => {
    setLoading(false);
    const orderData = { ...value };
    orderData.soldDate = orderData.soldDate.toISOString();
    orderData.customerId = customerId;
    orderData.soldProducts = selectedProducts.map((product) => {
      const { itemName, noOfBales, ratePerBale, baleWeightLbs, baleWeightKgs, ratePerLbs, ratePerKgs } = product;
      return {
        itemName,
        noOfBales,
        ...(ratePerBale && { ratePerBale }),
        ...(baleWeightLbs && { baleWeightLbs }),
        ...(baleWeightKgs && { baleWeightKgs }),
        ...(ratePerLbs && { ratePerLbs }),
        ...(ratePerKgs && { ratePerKgs }),
      };
    });
    try {
      await createSale(orderData);
      router.push("/sales");
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  if (error) return <Alert message={error} type="error" />;

  return (
    <div>
      <AppTitle level={2}>Create Sale</AppTitle>
      <Form layout="vertical" name="nest-messages" onFinish={onFinish} validateMessages={VALIDATE_MESSAGE}>
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item label="Select Customer">
              <SelectCustomer selectCustomerOnChange={selectCustomerOnChange} />
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
            <Form.Item label="Select Sales Date" name="soldDate" {...DATE_PICKER_CONFIG}>
              <DatePicker
                style={{ width: "100%" }}
                disabledDate={(current) => current && current.valueOf() > Date.now()}
                format={DATE_FORMAT}
                defaultValue={moment(new Date())}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Select Products">
              <Select
                mode="multiple"
                loading={isLoading}
                showSearch
                placeholder="Search to Select Products"
                allowClear
                onChange={selectProductsOnChange}
                filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
              >
                {inventory &&
                  inventory.rows.map((obj) => (
                    <Option key={obj.id} value={obj.id}>
                      {`${obj.itemName} (${obj.company.companyName})`}
                    </Option>
                  ))}
              </Select>
            </Form.Item>
          </Col>
          {customerId && !!selectedProducts.length && (
            <Col span={24}>
              <UpdateSalesItems setSelectedProducts={setSelectedProducts} data={selectedProducts} />
            </Col>
          )}
          <Col span={24}>
            <Form.Item>
              <AppBackButton />
              <Button loading={loading} type="primary" htmlType="submit">
                Create Sale
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default CreateSale;
