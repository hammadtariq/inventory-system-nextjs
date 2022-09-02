import { useRef, useState } from "react";

import { Alert, Button, Popconfirm } from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/router";

import AppCreateButton from "@/components/createButton";
import AppTable from "@/components/table";
import AppTitle from "@/components/title";
import { deleteCompany, useCompanies } from "@/hooks/company";
import styles from "@/styles/Company.module.css";
import { getColumnSearchProps } from "@/utils/filter.util";
import permissionsUtil from "@/utils/permission.util";
import { DATE_TIME_FORMAT } from "@/utils/ui.util";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

const Company = () => {
  const { companies, error, isLoading, paginationHandler, mutate } = useCompanies();
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  const canDelete = permissionsUtil.checkAuth({
    category: "company",
    action: "delete",
  });

  const canEdit = permissionsUtil.checkAuth({
    category: "company",
    action: "edit",
  });

  const renderActions = (text) => (
    <>
      <Popconfirm
        title="Are you sure?"
        onConfirm={async () => {
          const data = await deleteCompany(text.id);
          const res = await deleteCompany(text.id);
          if (res.status === 404) {
            message.error("Error", data.message);
          }
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
        onClick={() => router.push(`/company/${text.id}`)}
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
      title: "Company Name",
      dataIndex: "companyName",
      ...getColumnSearchProps({
        dataIndex: "companyName",
        searchInput,
        searchText,
        searchedColumn,
        setSearchText,
        setSearchedColumn,
        dataIndexName: "company name",
      }),
    },
    {
      title: "Email",
      dataIndex: "email",
      render: (text) => text ?? "N/A",
    },
    {
      title: "Address",
      dataIndex: "address",
      render: (text) => text ?? "N/A",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      render: (text) => text ?? "N/A",
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

  if (error) return <Alert message={error} type="error" />;
  return (
    <>
      <AppTitle level={2}>
        Company List
        <AppCreateButton url="/company/create" />
      </AppTitle>
      <AppTable
        isLoading={isLoading}
        rowKey="id"
        columns={columns}
        dataSource={companies ? companies.rows : []}
        totalCount={companies ? companies.count : 0}
        pagination={true}
        paginationHandler={paginationHandler}
      />
    </>
  );
};

export default Company;
