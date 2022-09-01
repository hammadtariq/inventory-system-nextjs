import { memo } from "react";
import { Select, Alert } from "antd";

import { useCompanyAttributes } from "@/hooks/company";
import { selectSearchFilter } from "@/utils/filter.util";

const { Option } = Select;

export default memo(function SelectCompany({ selectCompanyOnChange, ...props }) {
  const { company, isLoading, error } = useCompanyAttributes(["companyName", "id"]);
  if (error) return <Alert message={error} type="error" />;

  const onSearch = (value, option) => {
    console.log(value, option);
    console.log(option.children.toLowerCase().includes(value.toLowerCase()));
  };

  return (
    <Select
      {...props}
      loading={isLoading}
      filterOption={selectSearchFilter}
      optionFilterProp="children"
      showSearch
      placeholder="Search to Select Company"
      allowClear
      onChange={selectCompanyOnChange}
    >
      {company &&
        company.map((obj) => (
          <Option key={obj.id} value={obj.id}>
            {obj.companyName}
          </Option>
        ))}
    </Select>
  );
});
