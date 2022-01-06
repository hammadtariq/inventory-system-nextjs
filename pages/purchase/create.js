import { useState } from "react";
import { Select, Form, Alert } from "antd";

import Title from "@/components/title";
import SelectInventory from "@/components/selectInventory";
import { useCompanyAttributes } from "@/hooks/company";

const { Option } = Select;

const CreatePurchase = () => {
  const [companyId, setCompanyId] = useState(null);
  const [selectedItem, setSelectedItem] = useState([]);
  const { company, isLoading, error } = useCompanyAttributes(["companyName", "id"]);

  const handleSelectCompany = (value) => {
    setCompanyId(value);
  };

  const handleItemSelect = (value) => {
    console.log(`selected`, value);
    setSelectedItem(value);
  };

  if (error) return <Alert message={error} type="error" />;

  return (
    <div>
      <div>
        <Title level={2}>Create Purchase Order</Title>
      </div>
      <Form>
        <Form.Item label="Select Company">
          <Select
            loading={isLoading}
            disabled={selectedItem.length > 0}
            showSearch
            style={{ width: 400 }}
            placeholder="Search to Select Company"
            allowClear
            onChange={handleSelectCompany}
          >
            {company &&
              company.map((obj) => (
                <Option key={obj.id} value={obj.id}>
                  {obj.companyName}
                </Option>
              ))}
          </Select>
        </Form.Item>
        {companyId && (
          <Form.Item label="Select Inventory">
            <SelectInventory companyId={companyId} handleItemSelect={handleItemSelect} />
          </Form.Item>
        )}
      </Form>
    </div>
  );
};
export default CreatePurchase;
