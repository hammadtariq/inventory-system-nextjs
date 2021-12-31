import { Alert, Table } from "antd";
import { usePurchaseOrders } from "@/hooks/purchase";

const PurchaseOrders = () => {
  const { purchaseOrders, error, isLoading } = usePurchaseOrders();

  const expandedRowRender = (record) => {
    const columns = [
      { title: "Item Name", dataIndex: "productName", key: "productName" },
      // { title: "Product Label", dataIndex: "productLabel", key: "productLabel" },
      { title: "No of Bales", dataIndex: "bundleCount", key: "bundleCount" },
      { title: "Bale Weight (LBS)", dataIndex: "bundleWeight", key: "bundleWeight" },
      { title: "Bale Weight (KGS)", dataIndex: "bundleWeight", key: "bundleWeight" },
      { title: "Rate per LBS (Rs)", dataIndex: "bundleCost", key: "bundleCost" },
      { title: "Rate per KGS (Rs)", dataIndex: "bundleCost", key: "bundleCost" },
      { title: "Rate per Bale (Rs)", dataIndex: "bundleCost", key: "bundleCost" },
    ];
    return <Table columns={columns} dataSource={record.purchasedProducts} pagination={false} />;
  };

  const columns = [
    { title: "Company Name", dataIndex: ["company", "companyName"], key: "companyName" },
    { title: "Invoice Total Amount (Rs)", dataIndex: "totalAmount", key: "totalAmount" },
    // { title: "Paid Amount (Rs)", dataIndex: "paidAmount", key: "paidAmount" },
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
  ];

  if (error) return <Alert message={error} type="error" />;
  return (
    <Table
      loading={isLoading}
      rowKey={"id"}
      className="components-table-demo-nested"
      columns={columns}
      expandable={{ expandedRowRender: (record) => expandedRowRender(record) }}
      dataSource={purchaseOrders ? purchaseOrders.rows : []}
    />
  );
};

export default PurchaseOrders;
