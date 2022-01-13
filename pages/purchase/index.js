import { Alert, Table, Popconfirm, Button } from "antd";
import { useRef, useState } from "react";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

import Title from "@/components/title";
import { usePurchaseOrders, approvePurchase, cancelPurchase } from "@/hooks/purchase";
import styles from "@/styles/Purchase.module.css";
import { getColumnSearchProps } from "@/utils/filter.util";
import { STATUS_COLORS } from "@/utils/ui";
import permissionsUtil from "@/utils/permission.util";

const PurchaseOrders = () => {
  const { purchaseOrders, error, isLoading, mutate } = usePurchaseOrders();
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  const canApprove = permissionsUtil.checkAuth({
    category: "purchase",
    action: "approve",
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
      { title: "Rate per LBS (Rs)", dataIndex: "ratePerLgs", key: "ratePerLgs", render: (text) => text ?? "N/A" },
      { title: "Rate per KGS (Rs)", dataIndex: "ratePerKgs", key: "ratePerKgs", render: (text) => text ?? "N/A" },
      { title: "Rate per Bale (Rs)", dataIndex: "ratePerBale", key: "ratePerBale" },
    ];
    return <Table columns={columns} dataSource={record.purchasedProducts} pagination={false} />;
  };

  const columns = [
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
    { title: "Invoice Number", dataIndex: "invoiceNumber", key: "invoiceNumber", render: (text) => text ?? "N/A" },
    { title: "Sur Charge (Rs)", dataIndex: "surCharge", key: "surCharge", render: (text) => text ?? "N/A" },
    {
      title: "Purchase Date",
      dataIndex: "purchaseDate",
      key: "purchaseDate",
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
      render: (text, record) => {
        if (record.status === "PENDING" && canApprove) {
          return (
            <>
              <Popconfirm
                title="Are you sure for Approve?"
                onConfirm={async () => {
                  await approvePurchase(text.id);
                  mutate(null);
                }}
                okText="Yes"
                cancelText="No"
              >
                <CheckCircleOutlined style={{ color: STATUS_COLORS.APPROVED }} className={styles.cancelBtn} />
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
                <CloseCircleOutlined style={{ color: STATUS_COLORS.CANCEL }} className={styles.approveBtn} />
              </Popconfirm>
            </>
          );
        }
        return null;
      },
    },
  ];

  if (error) return <Alert message={error} type="error" />;
  return (
    <>
      <Title level={2}>Purchase Order List</Title>
      <Table
        loading={isLoading}
        rowKey={"id"}
        className="components-table-demo-nested"
        columns={columns}
        expandable={{ expandedRowRender: (record) => expandedRowRender(record) }}
        dataSource={purchaseOrders ? purchaseOrders.rows : []}
      />
    </>
  );
};

export default PurchaseOrders;
