import { useEffect, useRef, useState } from "react";

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
import Spinner from "@/components/spinner";

const Company = () => {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);
  const { companies, error, isLoading, pagination, paginationHandler, mutate } = useCompanies(searchText);

  // A new search starts from the first page of its results.
  useEffect(() => {
    paginationHandler(pagination.limit, 0, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

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
          await deleteCompany(text.id);
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
  if (isLoading) return <Spinner />;
  return (
    <>
      <AppTitle level={2} action={<AppCreateButton url="/company/create" />}>
        Company List
      </AppTitle>
      <AppTable
        isLoading={isLoading}
        rowKey="id"
        columns={columns}
        dataSource={companies ? companies.rows : []}
        totalCount={companies ? companies.count : 0}
        paginationHandler={paginationHandler}
        pagination={pagination}
      />
    </>
  );
};

export default Company;
