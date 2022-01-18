import { memo } from "react";
import { Select, Alert } from "antd";

import { useCompanyAttributes } from "@/hooks/company";

const { Option } = Select;

export default memo(function SelectCompany({ selectCompanyOnChange, ...props }) {
  const { company, isLoading, error } = useCompanyAttributes(["companyName", "id"]);
  if (error) return <Alert message={error} type="error" />;

  return (
    <Select
      {...props}
      loading={isLoading}
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
