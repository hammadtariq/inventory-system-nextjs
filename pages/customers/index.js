import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { Alert, Table, Popconfirm, Button } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

import Title from "@/components/title";
import { useCustomers, deleteCustomer } from "@/hooks/customers";
import permissionsUtil from "@/utils/permission.util";
import styles from "@/styles/Customer.module.css";
import { getColumnSearchProps } from "@/utils/filter.util";

export default function Customers() {
  const { customers, error, isLoading, mutate } = useCustomers();
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  const canDelete = permissionsUtil.checkAuth({
    category: "customer",
    action: "delete",
  });

  const canEdit = permissionsUtil.checkAuth({
    category: "customer",
    action: "edit",
  });

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
        disabled={!canDelete}
      >
        <Button className={styles.deleteBtn} icon={<DeleteOutlined />} danger disabled={!canDelete}>
          Delete
        </Button>
      </Popconfirm>
      <Button
        onClick={() => router.push(`/customers/${text.id}`)}
        className={styles.editBtn}
        icon={<EditOutlined />}
        disabled={!canEdit}
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
      ...getColumnSearchProps({
        dataIndex: "firstName",
        searchInput,
        searchText,
        searchedColumn,
        setSearchText,
        setSearchedColumn,
        dataIndexName: "first name",
      }),
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
      ...getColumnSearchProps({
        dataIndex: "email",
        searchInput,
        searchText,
        searchedColumn,
        setSearchText,
        setSearchedColumn,
      }),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      ...getColumnSearchProps({
        dataIndex: "phone",
        searchInput,
        searchText,
        searchedColumn,
        setSearchText,
        setSearchedColumn,
      }),
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
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

  if (error) return <Alert message={error.message} type="error" />;
  return (
    <>
      <Title level={2}>Customer List</Title>
      <Table columns={columns} loading={isLoading} rowKey="id" dataSource={customers ? customers.data : []} />
    </>
  );
}
