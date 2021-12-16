import { useRouter } from "next/router";
import { Alert, Button, Popconfirm, Table } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

import { useCompanies, deleteCompany } from "../../hooks/company";

const Company = () => {
  const { companies, error, isLoading, mutate } = useCompanies();
  const router = useRouter();
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
    {
      title: "Action",
      key: "action",
      render: (text) => (
        <>
          <Popconfirm
            title="Are you sure?"
            onConfirm={async () => {
              await deleteCompany(text.id);
              mutate(null);
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button style={{ marginLeft: 5 }} icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
          <Button
            onClick={() => router.push(`/company/${text.id}`)}
            style={{ marginLeft: 5, marginTop: 5 }}
            icon={<EditOutlined />}
          >
            Edit
          </Button>
        </>
      ),
    },
  ];

  if (error) return <Alert message={error.message} type="error" />;
  return <Table loading={isLoading} columns={columns} dataSource={companies ? companies.rows : []} />;
};

export default Company;
