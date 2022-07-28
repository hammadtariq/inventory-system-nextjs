import { memo } from "react";

import { Alert, Select } from "antd";

import { useCustomerAttributes } from "@/hooks/customers";

const { Option } = Select;

export default memo(function SelectCustomer({ selectCustomerOnChange, ...props }) {
  const { customers, isLoading, error } = useCustomerAttributes(["firstName", "lastName", "id"]);
  if (error) return <Alert message={error} type="error" />;

  return (
    <Select
      {...props}
      loading={isLoading}
      showSearch
      placeholder="Search to Select Customer"
      allowClear
      onChange={selectCustomerOnChange}
    >
      {customers &&
        customers.map((obj) => (
          <Option key={obj.id} value={obj.id}>
            {`${obj.firstName} ${obj.lastName}`}
          </Option>
        ))}
    </Select>
  );
});
