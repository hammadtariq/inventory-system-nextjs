import { Alert, Table } from "antd";
import { useCompanies } from "../../hooks/company";
import { useState } from "react";

const columns = [
  {
    title: "Company Name",
    dataIndex: "companyName",
  },
  {
    title: "Email",
    dataIndex: "email",
  },
  {
    title: "Address",
    dataIndex: "address",
  },
  {
    title: "Phone",
    dataIndex: "phone",
  },
  {
    title: "Created At",
    dataIndex: "createdAt",
    sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  },
];

const Company = () => {
  const [loading, setLoading] = useState(true);
  const { data, error } = useCompanies();
  if (error) return <Alert message={error.message} type="error" />;
  if (data && loading) {
    setLoading(false);
  }
  return <Table loading={loading} columns={columns} dataSource={data ? data.data.rows : []} />;
};

export default Company;
