import { useCallback, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import { Form, Button, Row, Col, Input, Select, Alert } from "antd";
import dayjs from "dayjs";

import AppBackButton from "@/components/backButton";
import SelectCustomer from "@/components/selectCustomer";
import UpdateSalesItems from "@/components/updateSaleItems";
import DatePicker from "@/components/datePicker";

import { useInventoryAttributes } from "@/hooks/inventory";
import { DATE_FORMAT, VALIDATE_MESSAGE, sumItemsPrice } from "@/utils/ui.util";
import { createSale, updateSale } from "@/hooks/sales";
import { EditOutlined } from "@ant-design/icons";

const { Option } = Select;

const AddEditSale = ({ sale, type = null }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const { inventory, error, isLoading } = useInventoryAttributes(["itemName", "id", "onHand", "companyId"]);
  const [form] = Form.useForm();

  const selectCustomerOnChange = useCallback((id) => setCustomerId(id), [customerId]);

  const selectProductsOnChange = useCallback(
    (selectedId) => {
      const selectedItem = inventory.filter((item) => selectedId.includes(item.id));
      setSelectedProducts(selectedItem);
    },
    [inventory]
  );
  const totalAmount = useMemo(() => sumItemsPrice(selectedProducts), [selectedProducts]);

  useEffect(() => {
    if (sale) {
      const { customer, soldDate, soldProducts, totalAmount } = sale;
      const { id } = customer;
      form.setFieldsValue({
        soldDate: dayjs(soldDate),
        totalAmount,
        selectedProduct: soldProducts.map((product) => product.id),
      });
      setCustomerId(id);
      setSelectedProducts(soldProducts);
    }
  }, [sale]);

  useEffect(() => {
    form.setFieldsValue({ totalAmount });
  }, [totalAmount]);

  useEffect(() => {
    form.setFieldsValue({ soldDate: sale?.soldDate ? dayjs(sale.soldDate) : dayjs() });
  }, []);

  const onFinish = async (value) => {
    setLoading(false);
    const orderData = { ...value };
    delete orderData.selectedProduct;
    orderData.soldDate = orderData.soldDate.toISOString();
    orderData.customerId = customerId;
    orderData.soldProducts = selectedProducts.map((product) => {
      const { itemName, noOfBales, baleWeightLbs, baleWeightKgs, ratePerLbs, ratePerKgs, id, companyId } = product;
      return {
        itemName,
        noOfBales,
        id,
        companyId,
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
            <Form.Item label="Customer">
              <SelectCustomer
                defaultValue={sale && sale.customer.id}
                selectCustomerOnChange={selectCustomerOnChange}
                disabled={type === "view"}
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
              <Input type="number" defaultValue={totalAmount} value={totalAmount} readOnly disabled={type === "view"} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Sales Date" name="soldDate" {...DATE_PICKER_CONFIG}>
              <DatePicker
                style={{ width: "100%" }}
                disabledDate={(current) => current && current.valueOf() > Date.now()}
                format={DATE_FORMAT}
                disabled={type === "view"}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Products" name="selectedProduct">
              <Select
                mode="multiple"
                loading={isLoading}
                showSearch
                placeholder="Search to Select Products"
                allowClear
                onChange={selectProductsOnChange}
                filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                disabled={type === "view"}
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
              <UpdateSalesItems
                setSelectedProducts={setSelectedProducts}
                data={selectedProducts}
                viewOnly={type === "view"}
              />
            </Col>
          )}
          <Col span={24}>
            <Form.Item>
              <AppBackButton />
              {type !== "view" ? (
                <Button loading={loading} type="primary" htmlType="submit">
                  {sale ? "Update" : "Create"} Sale
                </Button>
              ) : null}
              {type === "view" && (
                <Button icon={<EditOutlined />} type="primary" onClick={() => router.push(`/sales/${sale.id}`)}>
                  Edit
                </Button>
              )}
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default AddEditSale;
