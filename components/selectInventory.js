import { Select, Alert } from "antd";

import { useInventoryByCompanyId } from "@/hooks/inventory";

const { Option } = Select;

export default function SelectInventory({ companyId, handleItemSelect }) {
  const { inventory, error, isLoading } = useInventoryByCompanyId(companyId);

  if (error) return <Alert message={error} type="error" />;

  return (
    <Select
      loading={isLoading}
      mode="tags"
      style={{ width: 400 }}
      placeholder="Select Inventory items"
      onChange={handleItemSelect}
    >
      {inventory &&
        inventory.map((item) => (
          <Option key={item.id} value={item.itemName}>
            {item.itemName}
          </Option>
        ))}
    </Select>
  );
}
