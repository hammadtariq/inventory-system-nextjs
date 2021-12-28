import { useRouter } from "next/router";
import { Alert, Button, Popconfirm, Table } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

import { useCompanies, deleteCompany } from "@/hooks/company";
import styles from "@/styles/Company.module.css";
import permissionsUtil from "@/utils/permission.util";

const Company = () => {
  const { companies, error, isLoading, mutate } = useCompanies();
  const router = useRouter();
  const renderActions = (text) => (
    <>
      <Popconfirm
        title="Are you sure?"
        onConfirm={async () => {
          await deleteCompany(text.id);
          mutate(null);
        }}
        okText="Yes"
        cancelText="No"
        disabled={
          !permissionsUtil.checkAuth({
            category: "company",
            action: "delete",
          })
        }
      >
        <Button
          className={styles.deleteBtn}
          icon={<DeleteOutlined />}
          danger
          disabled={
            !permissionsUtil.checkAuth({
              category: "company",
              action: "delete",
            })
          }
        >
          Delete
        </Button>
      </Popconfirm>
      <Button
        onClick={() => router.push(`/company/${text.id}`)}
        className={styles.editBtn}
        icon={<EditOutlined />}
        disabled={
          !permissionsUtil.checkAuth({
            category: "company",
            action: "edit",
          })
        }
      >
        Edit
      </Button>
    </>
  );

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
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: "Action",
      key: "action",
      render: renderActions,
    },
  ];

  if (error) return <Alert message={error} type="error" />;
  return <Table loading={isLoading} columns={columns} dataSource={companies ? companies.rows : []} />;
};

export default Company;
