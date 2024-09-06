import { useCallback, useEffect, useMemo, useState } from "react";

import { Alert, Button, Col, Form, Input, Row, Select } from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/router";

import AppBackButton from "@/components/backButton";
import DatePicker from "@/components/datePicker";
import SelectCustomer from "@/components/selectCustomer";
import UpdateSalesItems from "@/components/updateSaleItems";
import { useInventoryAttributes } from "@/hooks/inventory";
import { createSale, updateSale } from "@/hooks/sales";
import { EDITABLE_STATUS } from "@/utils/api.util";
import { DATE_FORMAT, sumItemsPrice, VALIDATE_MESSAGE } from "@/utils/ui.util";
import { EditOutlined } from "@ant-design/icons";

const { Option } = Select;

const AddEditSale = ({ sale, type = null }) => {
  const router = useRouter();
  const isView = type === "view";
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [editAll, setEditAll] = useState(false);
  const [_laborCharge, setLaborCharge] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [updatedProducts, setUpdatedProducts] = useState([]);
  const { inventory, error, isLoading } = useInventoryAttributes(["itemName", "id", "onHand", "companyId"], type);
  const [form] = Form.useForm();

  useEffect(() => {
    if (type === "view") {
      setUpdatedProducts(sale.soldProducts);
      console.log(sale.soldProducts);
    } else {
      setUpdatedProducts(inventory);
    }
  }, [inventory, sale]);

  const selectCustomerOnChange = useCallback((id) => setCustomerId(id), [customerId]);

  const selectProductsOnChange = useCallback(
    (selectedId) => {
      const selectedItem = updatedProducts.filter((item) => selectedId.includes(item.id));
      setSelectedProducts(selectedItem);
    },
    [updatedProducts]
  );
  const totalAmount = useMemo(() => sumItemsPrice(selectedProducts), [selectedProducts]);

  const onRemove = (id) => {
    const index = updatedProducts.findIndex((item) => id === item.id);
    const item = updatedProducts[index];
    delete item.noOfBales;
    delete item.ratePerKgs;
    delete item.baleWeightKgs;
    delete item.baleWeightLbs;
    delete item.ratePerLbs;
    delete item.ratePerBale;
    const newData = [...updatedProducts];
    newData.splice(index, 1, { ...item });
    setUpdatedProducts(newData);
  };

  useEffect(() => {
    if (sale && inventory) {
      const { customer, soldDate, soldProducts, totalAmount, laborCharge } = sale;
      const { id } = customer;
      form.setFieldsValue({
        soldDate: dayjs(soldDate),
        totalAmount,
        laborCharge,
        selectedProduct: soldProducts.map((product) => product.id),
      });
      const _soldProducts = soldProducts.reduce((acc, product) => {
        acc[product.id] = product;
        return acc;
      }, {});
      const updatedItems = soldProducts.map((item) => {
        if (_soldProducts[item.id]) return { ..._soldProducts[item.id], company: item.company };
        return item;
      });
      // Create a map for quick lookups
      const inventoryMap = inventory.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});
      // Update soldProducts with onHand value from inventory
      const updatedSoldProducts = soldProducts.map((product) => {
        const inventoryItem = inventoryMap[product.id];
        return {
          ...product,
          onHand: inventoryItem ? inventoryItem.onHand : null, // Add onHand value
          company: product.company, // Ensure company details are included
        };
      });
      setLaborCharge(laborCharge);
      setCustomerId(id);
      setSelectedProducts(updatedSoldProducts);
      setUpdatedProducts(inventory);
    }
  }, [sale, inventory]);

  useEffect(() => {
    const total = totalAmount + _laborCharge;
    form.setFieldsValue({ totalAmount: total });
  }, [totalAmount, _laborCharge]);

  useEffect(() => {
    form.setFieldsValue({ soldDate: sale?.soldDate ? dayjs(sale.soldDate) : dayjs() });
  }, []);

  const onFinish = async (value) => {
    setLoading(false);
    const orderData = { ...value };
    delete orderData.selectedProduct;
    orderData.soldDate = orderData.soldDate.toISOString();
    orderData.customerId = customerId;
    orderData.laborCharge = _laborCharge || 0;
    orderData.soldProducts = selectedProducts.map((product) => {
      const { itemName, noOfBales, baleWeightLbs, baleWeightKgs, ratePerLbs, ratePerKgs, id, companyId, ratePerBale } =
        product;
      return {
        itemName,
        noOfBales,
        id,
        companyId,
        ...(baleWeightLbs && { baleWeightLbs }),
        ...(baleWeightKgs && { baleWeightKgs }),
        ...(ratePerLbs && { ratePerLbs }),
        ...(ratePerKgs && { ratePerKgs }),
        ...(ratePerBale && { ratePerBale }),
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
                defaultValue={sale && type === "view" ? sale?.customer?.firstName : sale?.customer?.id}
                selectCustomerOnChange={selectCustomerOnChange}
                type={type}
                disabled={isView}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="laborCharge" label="Labor Charge (RS)">
              <Input
                type="number"
                min="0"
                defaultValue={_laborCharge}
                value={_laborCharge}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  !isNaN(value) ? setLaborCharge(value) : setLaborCharge(0);
                }}
                disabled={isView}
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
              <Input type="number" defaultValue={totalAmount} value={totalAmount} readOnly disabled={isView} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Sales Date" name="soldDate">
              <DatePicker
                style={{ width: "100%" }}
                disabledDate={(current) => current && current.valueOf() > Date.now()}
                format={DATE_FORMAT}
                disabled={isView}
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
                onDeselect={onRemove}
                filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                disabled={isView}
              >
                {updatedProducts &&
                  updatedProducts.map((obj) => (
                    <Option key={obj.id} value={obj.id}>
                      {`${obj.itemName} (${obj?.company?.companyName})`}
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
                editAll={editAll}
                setEditAll={setEditAll}
                updatedProducts={updatedProducts}
                setUpdatedProducts={setUpdatedProducts}
                viewOnly={isView}
              />
            </Col>
          )}
          <Col span={24}>
            <Form.Item className="action-btn">
              <AppBackButton />
              {!isView ? (
                <Button loading={loading} type="primary" htmlType="submit" disabled={editAll}>
                  {sale ? "Update" : "Create"} Sale
                </Button>
              ) : null}
              {EDITABLE_STATUS.includes(sale?.status) && isView ? (
                <Button icon={<EditOutlined />} type="primary" onClick={() => router.push(`/sales/${sale.id}`)}>
                  Edit
                </Button>
              ) : null}
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default AddEditSale;
