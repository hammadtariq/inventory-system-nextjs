import { useRef, useState } from "react";

import { Alert, Button, Popconfirm } from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/router";

import AppCreateButton from "@/components/createButton";
import AppTable from "@/components/table";
import AppTitle from "@/components/title";
import { deleteCustomer, useCustomers } from "@/hooks/customers";
import styles from "@/styles/Customer.module.css";
import { getColumnSearchProps } from "@/utils/filter.util";
import permissionsUtil from "@/utils/permission.util";
import { DATE_TIME_FORMAT } from "@/utils/ui.util";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

export default function Customers() {
  const { customers, error, isLoading, paginationHandler, mutate } = useCustomers();
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
      title: "Updated At",
      dataIndex: "updatedAt",
      render: (text) => dayjs(text).format(DATE_TIME_FORMAT),
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
      <AppTitle level={2}>
        Customer List
        <AppCreateButton url="/customers/create" />
      </AppTitle>
      <AppTable
        columns={columns}
        rowKey="id"
        isLoading={isLoading}
        dataSource={customers ? customers.rows : []}
        totalCount={customers ? customers.count : 0}
        paginationHandler={paginationHandler}
      />
    </>
  );
}
