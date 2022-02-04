import { Alert, Popconfirm, Button } from "antd";
import { useRef, useState } from "react";
import { CheckOutlined, CloseOutlined, EditOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";

import { useSales, approveSale, cancelSale } from "@/hooks/sales";
import { getColumnSearchProps } from "@/utils/filter.util";
import { STATUS_COLORS } from "@/utils/ui.util";
import { EDITABLE_STATUS } from "@/utils/api.util";
import permissionsUtil from "@/utils/permission.util";
import AppTitle from "@/components/title";
import AppCreateButton from "@/components/createButton";
import AppTable from "@/components/table";

const Sales = () => {
  const { sales, error, isLoading, paginationHandler, mutate } = useSales();
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);
  const router = useRouter();
  const canApprove = permissionsUtil.checkAuth({
    category: "sales",
    action: "approve",
  });

  const canEdit = permissionsUtil.checkAuth({
    category: "sales",
    action: "edit",
  });

  const expandedRowRender = (record) => {
    const columns = [
      {
        title: "Item Name",
        dataIndex: "itemName",
        key: "itemName",
        ...getColumnSearchProps({
          dataIndex: "itemName",
          dataIndexName: "item name",
          searchInput,
          searchText,
          searchedColumn,
          setSearchText,
          setSearchedColumn,
        }),
      },
      { title: "No of Bales", dataIndex: "noOfBales", key: "noOfBales" },
      { title: "Bale Weight (LBS)", dataIndex: "baleWeightLbs", key: "baleWeightLbs", render: (text) => text ?? "N/A" },
      { title: "Bale Weight (KGS)", dataIndex: "baleWeightKgs", key: "baleWeightKgs", render: (text) => text ?? "N/A" },
      { title: "Rate per LBS (Rs)", dataIndex: "ratePerLbs", key: "ratePerLbs", render: (text) => text ?? "N/A" },
      { title: "Rate per KGS (Rs)", dataIndex: "ratePerKgs", key: "ratePerKgs", render: (text) => text ?? "N/A" },
      // { title: "Rate per Bale (Rs)", dataIndex: "ratePerBale", key: "ratePerBale" },
    ];
    return <AppTable columns={columns} dataSource={record.soldProducts} pagination={false} />;
  };

  const renderActions = (text, record) => {
    if (record.status === "PENDING" && canApprove) {
      return (
        <>
          <Popconfirm
            title="Are you sure you want to approve?"
            onConfirm={async () => {
              await approveSale(text.id);
              mutate(null);
            }}
            okText="Yes"
            cancelText="No"
          >
            <CheckOutlined style={{ color: STATUS_COLORS.APPROVED }} className="cancelBtn" />
          </Popconfirm>
          <Popconfirm
            title="Are you sure you want to cancel?"
            onConfirm={async () => {
              await cancelSale(text.id);
              mutate(null);
            }}
            okText="Yes"
            cancelText="No"
          >
            <CloseOutlined style={{ color: STATUS_COLORS.CANCEL }} className="approveBtn" />
          </Popconfirm>
        </>
      );
    } else if (EDITABLE_STATUS.includes(record.status) && canEdit) {
      return (
        <Button onClick={() => router.push(`/sales/${text.id}`)} icon={<EditOutlined />}>
          Edit
        </Button>
      );
    }
    return null;
  };

  const columns = [
    {
      title: "Customer Name",
      dataIndex: ["customer", "firstName"],
      key: "customerName",
      ...getColumnSearchProps({
        dataIndex: "firstName",
        dataIndexName: "customer name",
        parentDataIndex: "customer",
        nested: true,
        searchInput,
        searchText,
        searchedColumn,
        setSearchText,
        setSearchedColumn,
      }),
    },
    { title: "Invoice Total Amount (Rs)", dataIndex: "totalAmount", key: "totalAmount" },
    {
      title: "Sold Date",
      dataIndex: "soldDate",
      key: "soldDate",
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      ...getColumnSearchProps({
        dataIndex: "status",
        dataIndexName: "status",
        searchInput,
        searchText,
        searchedColumn,
        setSearchText,
        setSearchedColumn,
      }),
      render(text) {
        return {
          props: {
            style: { color: STATUS_COLORS[text] },
          },
          children: <div>{text}</div>,
        };
      },
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
        Sales List
        <AppCreateButton url="/sales/create" />
      </AppTitle>
      <AppTable
        isLoading={isLoading}
        rowKey={"id"}
        className="components-table-demo-nested"
        columns={columns}
        expandable={{ expandedRowRender: (record) => expandedRowRender(record) }}
        dataSource={sales ? sales.rows : []}
        pagination={true}
        paginationHandler={paginationHandler}
      />
    </>
  );
};

export default Sales;
