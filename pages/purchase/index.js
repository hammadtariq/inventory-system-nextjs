import { Alert, Table } from "antd";

import Title from "@/components/title";
import { usePurchaseOrders } from "@/hooks/purchase";

const PurchaseOrders = () => {
  const { purchaseOrders, error, isLoading } = usePurchaseOrders();

  const expandedRowRender = (record) => {
    const columns = [
      { title: "Item Name", dataIndex: "itemName", key: "itemName" },
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
    { title: "Company Name", dataIndex: ["company", "companyName"], key: "companyName" },
    { title: "Invoice Total Amount (Rs)", dataIndex: "totalAmount", key: "totalAmount" },
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
