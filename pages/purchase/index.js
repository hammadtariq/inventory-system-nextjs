import { Alert, Table } from "antd";
import { usePurchaseOrders } from "@/hooks/purchase";

const PurchaseOrders = () => {
  const { purchaseOrders, error, isLoading } = usePurchaseOrders();

  const expandedRowRender = (record) => {
    const columns = [
      { title: "Product Name", dataIndex: "productName", key: "productName" },
      { title: "Product Label", dataIndex: "productLabel", key: "productLabel" },
      { title: "Cost", dataIndex: "bundleCost", key: "bundleCost" },
      { title: "Count", dataIndex: "bundleCount", key: "bundleCount" },
      { title: "Weight", dataIndex: "bundleWeight", key: "bundleWeight" },
    ];
    return <Table columns={columns} dataSource={record.purchasedProducts} pagination={false} />;
  };

  const columns = [
    { title: "Company Name", dataIndex: ["company", "companyName"], key: "companyName" },
    { title: "Total Amount", dataIndex: "totalAmount", key: "totalAmount" },
    { title: "Paid Amount", dataIndex: "paidAmount", key: "paidAmount" },
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
