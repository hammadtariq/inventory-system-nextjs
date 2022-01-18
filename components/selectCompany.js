import { Select, Alert } from "antd";

import { useCompanyAttributes } from "@/hooks/company";

const { Option } = Select;

export default function SelectCompany({ setCompanyId, ...props }) {
  const { company, isLoading, error } = useCompanyAttributes(["companyName", "id"]);

  if (error) return <Alert message={error} type="error" />;

  return (
    <Select
      {...props}
      loading={isLoading}
      showSearch
      placeholder="Search to Select Company"
      allowClear
      onChange={setCompanyId}
    >
      {company &&
        company.map((obj) => (
          <Option key={obj.id} value={obj.id}>
            {obj.companyName}
          </Option>
        ))}
    </Select>
  );
}
