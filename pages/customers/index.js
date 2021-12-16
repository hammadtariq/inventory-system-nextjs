import router from "next/router";
import React from "react";
import axios from "axios";
import { Alert, Table, Space, Popconfirm, Button, Row, Col } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useGetCustomers, deleteCustomer } from "../../hooks/customers";

export default function Home() {
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
      render: (text, record) => (
        <Space size="large">
          <Button
            onClick={() => router.push(`/customers/${text.id}`)}
            style={{ marginLeft: 5, marginTop: 5 }}
            icon={<EditOutlined />}
          ></Button>
          <Popconfirm
            title="Are you sure?"
            onConfirm={async () => {
              await deleteCustomer(text.id);
              mutate(null);
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />}></Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  const { customers, error, isLoading, mutate } = useGetCustomers();

  // const { customers, error, isLoading, setId } = useDeleteCustomer();
  if (error) return <Alert message={error.message} type="error" />;
  return (
    <div>
      <Button type="primary" onClick={() => router.push("/customers/create")}>
        Add Customer
      </Button>

      <Table columns={columns} loading={isLoading} dataSource={customers ? customers.data : []} />
    </div>
  );
}
