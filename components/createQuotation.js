import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Col, Form, Input, Row, Select } from "antd";
import { DownloadOutlined, SaveOutlined } from "@ant-design/icons";

import AppBackButton from "@/components/backButton";
import SelectCustomer from "@/components/selectCustomer";
import UpdateSalesItems from "@/components/updateSaleItems";
import { useCustomerAttributes } from "@/hooks/customers";
import { useInventoryAttributes } from "@/hooks/inventory";
import { exportQuotationToPDF } from "@/lib/export-utils";
import { sumItemsPrice, VALIDATE_MESSAGE } from "@/utils/ui.util";

const { Option } = Select;

const CreateQuotation = () => {
  const [customerId, setCustomerId] = useState(null);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [updatedProducts, setUpdatedProducts] = useState([]);
  const [editAll, setEditAll] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [form] = Form.useForm();

  const {
    inventory,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useInventoryAttributes(["itemName", "id", "onHand", "companyId"], true);
  const { customers } = useCustomerAttributes(["firstName", "lastName", "id"], true);

  useEffect(() => {
    if (inventory) {
      setUpdatedProducts(inventory);
    }
  }, [inventory]);

  const selectedCustomer = useMemo(() => customers?.find((c) => c.id === customerId) || null, [customers, customerId]);

  const totalAmount = useMemo(() => sumItemsPrice(selectedProducts), [selectedProducts]);

  useEffect(() => {
    form.setFieldsValue({ totalAmount });
  }, [totalAmount, form]);

  const selectCustomerOnChange = useCallback((id) => {
    setCustomerId(id);
    setIsSaved(false);
  }, []);

  const onProductSelect = useCallback(
    (ids) => {
      setIsSaved(false);
      setSelectedProductIds(ids);
      const selectedItems = updatedProducts
        .filter((item) => ids.includes(item.id))
        .map((item) => {
          const existing = selectedProducts.find((p) => p.id === item.id);
          if (existing) return existing;
          return { ...item, noOfBales: item.onHand ?? 0 };
        });
      setSelectedProducts(selectedItems);
    },
    [updatedProducts, selectedProducts]
  );

  const onDeselect = useCallback((id) => {
    setIsSaved(false);
    setSelectedProductIds((prev) => prev.filter((pid) => pid !== id));
    setUpdatedProducts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleSave = () => {
    setIsSaved(true);
  };

  const handleDownloadPDF = () => {
    exportQuotationToPDF(selectedProducts, { customer: selectedCustomer });
  };

  if (inventoryError) return <Alert message={inventoryError} type="error" />;

  return (
    <div>
      <Form form={form} layout="vertical" validateMessages={VALIDATE_MESSAGE}>
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item label="Customer">
              <SelectCustomer selectCustomerOnChange={selectCustomerOnChange} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="totalAmount" label="Total Amount (RS)">
              <Input type="number" value={totalAmount} readOnly />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Products">
              <Select
                mode="multiple"
                loading={inventoryLoading}
                showSearch
                placeholder="Search to Select Products"
                allowClear
                value={selectedProductIds}
                onChange={onProductSelect}
                onDeselect={onDeselect}
                filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
              >
                {(updatedProducts || []).map((obj) => (
                  <Option key={obj.id} value={obj.id}>
                    {`${obj.itemName}${obj.company?.companyName ? ` (${obj.company.companyName})` : ""}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {selectedProducts.length > 0 && (
            <Col span={24}>
              <UpdateSalesItems
                setSelectedProducts={(products) => {
                  setSelectedProducts(products);
                  setIsSaved(false);
                }}
                data={selectedProducts}
                editAll={editAll}
                setEditAll={setEditAll}
                updatedProducts={updatedProducts}
                setUpdatedProducts={setUpdatedProducts}
              />
              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} disabled={editAll}>
                  Save Quotation
                </Button>
                {isSaved && (
                  <Button icon={<DownloadOutlined />} onClick={handleDownloadPDF}>
                    Download PDF
                  </Button>
                )}
              </div>
            </Col>
          )}

          <Col span={24}>
            <Form.Item className="action-btn" style={{ marginTop: 16 }}>
              <AppBackButton />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default CreateQuotation;
