import { memo } from "react";

import { Alert, Select } from "antd";

import { useCustomerAttributes } from "@/hooks/customers";
import { selectSearchFilter } from "@/utils/filter.util";

const { Option } = Select;

export default memo(function SelectCustomer({ selectCustomerOnChange, type, ...props }) {
  const { customers, isLoading, error } = useCustomerAttributes(["firstName", "lastName", "id"], type);
  if (error) return <Alert message={error} type="error" />;

  const handleChange = (value, option) => {
    props.onChange?.(value, option);
    selectCustomerOnChange?.(value, option);
  };

  return (
    <Select
      {...props}
      loading={isLoading}
      showSearch
      filterOption={selectSearchFilter}
      optionFilterProp="children"
      placeholder="Search to Select Customer"
      allowClear
      onChange={handleChange}
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
