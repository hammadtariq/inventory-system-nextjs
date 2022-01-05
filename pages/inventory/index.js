import { Alert, Table } from "antd";

import { useInventory } from "@/hooks/inventory";
import Title from "@/components/title";

const Inventory = () => {
  const { inventory, error, isLoading } = useInventory();

  const columns = [
    { title: "Item Name", dataIndex: "itemName", key: "itemName" },
    { title: "Company Name", dataIndex: ["company", "companyName"], key: "companyName" },
    { title: "No of Bales", dataIndex: "noOfBales", key: "noOfBales" },
    { title: "Bale Weight (LBS)", dataIndex: "baleWeightLbs", key: "baleWeightLbs", render: (text) => text ?? "N/A" },
    { title: "Bale Weight (KGS)", dataIndex: "baleWeightKgs", key: "baleWeightKgs", render: (text) => text ?? "N/A" },
    { title: "Rate per LBS (Rs)", dataIndex: "ratePerLgs", key: "ratePerLgs", render: (text) => text ?? "N/A" },
    { title: "Rate per KGS (Rs)", dataIndex: "ratePerKgs", key: "ratePerKgs", render: (text) => text ?? "N/A" },
    { title: "On Hand", dataIndex: "onHand", key: "onHand" },
    { title: "Rate per Bale (Rs)", dataIndex: "ratePerBale", key: "ratePerBale" },
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
  ];

  if (error) return <Alert message={error} type="error" />;
  return (
    <>
      <Title level={2}>Inventory List</Title>
      <Table loading={isLoading} rowKey="id" columns={columns} dataSource={inventory ? inventory.rows : []} />
    </>
  );
};

export default Inventory;
