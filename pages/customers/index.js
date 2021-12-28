import router from "next/router";
import React from "react";
import { Alert, Table, Popconfirm, Button } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useCustomers, deleteCustomer } from "../../hooks/customers";
import permissionsUtil from "@/utils/permission.util";
import styles from "@/styles/Customer.module.css";

export default function Customers() {
  const renderActions = (text) => (
    <>
      <Popconfirm
        title="Are you sure?"
        onConfirm={async () => {
          await deleteCustomer(text.id);
          mutate(null);
        }}
        okText="Yes"
        cancelText="No"
        disabled={
          !permissionsUtil.checkAuth({
            category: "customer",
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
              category: "customer",
              action: "delete",
            })
          }
        >
          Delete
        </Button>
      </Popconfirm>
      <Button
        onClick={() => router.push(`/customers/${text.id}`)}
        className={styles.editBtn}
        icon={<EditOutlined />}
        disabled={
          !permissionsUtil.checkAuth({
            category: "customer",
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
      title: "First Name",
      dataIndex: "firstName",
      key: "firstName",
    },
    {
      title: "Last Name",
      dataIndex: "lastName",
      key: "lastName",
    },
    {
      title: "Email Address",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Action",
      key: "action",
      render: renderActions,
    },
  ];
  const { customers, error, isLoading, mutate } = useCustomers();
  // const { customers, error, isLoading, setId } = useDeleteCustomer();
  if (error) return <Alert message={error.message} type="error" />;
  return <Table columns={columns} loading={isLoading} dataSource={customers ? customers.data : []} />;
}
