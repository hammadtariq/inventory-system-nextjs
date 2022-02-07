import { Alert, Popconfirm } from "antd";
import { useRef, useState } from "react";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { CheckOutlined, CloseOutlined, EditOutlined } from "@ant-design/icons";

import { usePurchaseOrders, approvePurchase, cancelPurchase } from "@/hooks/purchase";

import { getColumnSearchProps } from "@/utils/filter.util";
import { STATUS_COLORS, DATE_FORMAT } from "@/utils/ui.util";
import { EDITABLE_STATUS } from "@/utils/api.util";
import permissionsUtil from "@/utils/permission.util";
import AppTitle from "@/components/title";
import AppCreateButton from "@/components/createButton";
import AppTable from "@/components/table";
import NextLink from "next/link";

const PurchaseOrders = () => {
  const { purchaseOrders, error, isLoading, paginationHandler, mutate } = usePurchaseOrders();
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);
  const router = useRouter();

  const canApprove = permissionsUtil.checkAuth({
    category: "purchase",
    action: "approve",
  });

  // const canEdit = permissionsUtil.checkAuth({
  //   category: "purchase",
  //   action: "edit",
  // });

  // const expandedRowRender = (record) => {
  //   const columns = [
  //     {
  //       title: "Item Name",
  //       dataIndex: "itemName",
  //       key: "itemName",
  //       ...getColumnSearchProps({
  //         dataIndex: "itemName",
  //         dataIndexName: "item name",
  //         searchInput,
  //         searchText,
  //         searchedColumn,
  //         setSearchText,
  //         setSearchedColumn,
  //       }),
  //     },
  //     { title: "No of Bales", dataIndex: "noOfBales", key: "noOfBales" },
  //     { title: "Bale Weight (LBS)", dataIndex: "baleWeightLbs", key: "baleWeightLbs", render: (text) => text ?? "N/A" },
  //     { title: "Bale Weight (KGS)", dataIndex: "baleWeightKgs", key: "baleWeightKgs", render: (text) => text ?? "N/A" },
  //     { title: "Rate per LBS (Rs)", dataIndex: "ratePerLgs", key: "ratePerLgs", render: (text) => text ?? "N/A" },
  //     { title: "Rate per KGS (Rs)", dataIndex: "ratePerKgs", key: "ratePerKgs", render: (text) => text ?? "N/A" },
  //     { title: "Rate per Bale (Rs)", dataIndex: "ratePerBale", key: "ratePerBale" },
  //   ];
  //   return <AppTable columns={columns} dataSource={record.purchasedProducts} pagination={false} />;
  // };

  const renderActions = (text, record) => {
    if (record.status === "PENDING" && canApprove) {
      return (
        <>
          <Popconfirm
            title="Are you sure you want to approve?"
            onConfirm={async () => {
              await approvePurchase(text.id);
              mutate(null);
            }}
            okText="Yes"
            cancelText="No"
          >
            <CheckOutlined style={{ color: STATUS_COLORS.APPROVED }} className="cancelBtn" />
          </Popconfirm>
          <Popconfirm
            title="Are you sure for cancel?"
            onConfirm={async () => {
              await cancelPurchase(text.id);
              mutate(null);
            }}
            okText="Yes"
            cancelText="No"
          >
            <CloseOutlined style={{ color: STATUS_COLORS.CANCEL }} className="approveBtn" />
          </Popconfirm>
          <EditOutlined
            style={{ color: STATUS_COLORS.EDIT }}
            className="editBtn"
            onClick={() => router.push(`/purchase/${text.id}`)}
          />
        </>
      );
    } else if (EDITABLE_STATUS.includes(record.status)) {
      return (
        <EditOutlined
          style={{ color: STATUS_COLORS.EDIT }}
          className="editBtn"
          onClick={() => router.push(`/purchase/${text.id}`)}
        />
      );
    }
    // else if (EDITABLE_STATUS.includes(record.status) && canEdit)
  };
  const columns = [
    {
      title: "Id",
      dataIndex: "id",
      key: "id",
      render: (_, record) => (
        <NextLink href={`/purchase/${record.id}?type=view`} passHref>
          <a>{record.id}</a>
        </NextLink>
      ),
    },
    {
      title: "Company Name",
      dataIndex: ["company", "companyName"],
      key: "companyName",
      ...getColumnSearchProps({
        dataIndex: "companyName",
        dataIndexName: "company name",
        parentDataIndex: "company",
        nested: true,
        searchInput,
        searchText,
        searchedColumn,
        setSearchText,
        setSearchedColumn,
      }),
    },
    { title: "Invoice Total Amount (Rs)", dataIndex: "totalAmount", key: "totalAmount" },
    { title: "Bale Type", dataIndex: "baleType", key: "baleType" },
    { title: "Invoice Number", dataIndex: "invoiceNumber", key: "invoiceNumber", render: (text) => text ?? "N/A" },
    { title: "Sur Charge (Rs)", dataIndex: "surCharge", key: "surCharge", render: (text) => text ?? "N/A" },
    {
      title: "Purchase Date",
      dataIndex: "purchaseDate",
      key: "purchaseDate",
      render: (text) => dayjs(text).format(DATE_FORMAT),
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (text) => dayjs(text).format(DATE_FORMAT),
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
        Purchase Order List
        <AppCreateButton url="/purchase/create" />
      </AppTitle>
      <AppTable
        isLoading={isLoading}
        rowKey={"id"}
        className="components-table-demo-nested"
        columns={columns}
        // expandable={{ expandedRowRender: (record) => expandedRowRender(record) }}
        dataSource={purchaseOrders ? purchaseOrders.rows : []}
        pagination={true}
        paginationHandler={paginationHandler}
      />
    </>
  );
};

export default PurchaseOrders;
