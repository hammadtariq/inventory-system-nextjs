import moment from "moment";
import { useCallback, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import { Form, DatePicker, Button, Row, Col, Input, Select, Alert } from "antd";

import AppBackButton from "@/components/backButton";
import SelectCustomer from "@/components/selectCustomer";
import UpdateSalesItems from "@/components/updateSaleItems";

import { useInventoryAttributes } from "@/hooks/inventory";
import { DATE_FORMAT, VALIDATE_MESSAGE, DATE_PICKER_CONFIG, sumItemsPrice } from "@/utils/ui.util";
import { createSale, updateSale } from "@/hooks/sales";

const { Option } = Select;

const AddEditSale = ({ sale }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const { inventory, error, isLoading } = useInventoryAttributes(["itemName", "id", "onHand"]);
  const [form] = Form.useForm();

  const selectCustomerOnChange = useCallback((id) => setCustomerId(id), [customerId]);
  const totalAmount = useMemo(() => sumItemsPrice(selectedProducts), [selectedProducts]);

  const selectProductsOnChange = useCallback(
    (selectedId) => {
      const selectedItem = inventory.filter((item) => selectedId.includes(item.id));
      setSelectedProducts(selectedItem);
    },
    [inventory]
  );

  useEffect(() => {
    if (sale) {
      const { customer, soldDate, soldProducts, totalAmount } = sale;
      const { id } = customer;
      form.setFieldsValue({
        soldDate: moment(soldDate),
        totalAmount,
        selectedProduct: soldProducts.map((product) => product.itemName),
      });
      setCustomerId(id);
      setSelectedProducts(soldProducts);
    }
  }, [sale]);

  useEffect(() => {
    form.setFieldsValue({ totalAmount });
  }, [totalAmount]);

  useEffect(() => {
    form.setFieldsValue({ soldDate: sale?.soldDate ? moment(sale.soldDate) : moment() });
  }, []);

  const onFinish = async (value) => {
    setLoading(false);
    const orderData = { ...value };
    delete orderData.selectedProduct;
    orderData.soldDate = orderData.soldDate.toISOString();
    orderData.customerId = customerId;
    orderData.soldProducts = selectedProducts.map((product) => {
      const { itemName, noOfBales, baleWeightLbs, baleWeightKgs, ratePerLbs, ratePerKgs } = product;
      return {
        itemName,
        noOfBales,
        companyId: product.company.id,
        ...(baleWeightLbs && { baleWeightLbs }),
        ...(baleWeightKgs && { baleWeightKgs }),
        ...(ratePerLbs && { ratePerLbs }),
        ...(ratePerKgs && { ratePerKgs }),
      };
    });
    try {
      if (sale) {
        await updateSale(sale.id, orderData);
      } else {
        await createSale(orderData);
      }
      router.push("/sales");
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  if (error) return <Alert message={error} type="error" />;
  return (
    <div>
      <Form form={form} layout="vertical" name="nest-messages" onFinish={onFinish} validateMessages={VALIDATE_MESSAGE}>
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item label="Select Customer">
              <SelectCustomer defaultValue={sale && sale.customer.id} selectCustomerOnChange={selectCustomerOnChange} />
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
              <Input type="number" defaultValue={totalAmount} value={totalAmount} readOnly />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Select Sales Date" name="soldDate" {...DATE_PICKER_CONFIG}>
              <DatePicker
                style={{ width: "100%" }}
                disabledDate={(current) => current && current.valueOf() > Date.now()}
                format={DATE_FORMAT}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Select Products" name="selectedProduct">
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
                  inventory.map((obj) => (
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
                {sale ? "Update" : "Create"} Sale
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default AddEditSale;
