import { Alert, Table } from "antd";
import { useRef, useState } from "react";

import { useInventory, searchInventory, getInventory } from "@/hooks/inventory";
import Title from "@/components/title";
import SearchInput from "@/components/SearchInput";

import { getColumnSearchProps } from "@/utils/filter.util";

const Inventory = () => {
  const { inventory, error, isLoading, mutate } = useInventory();
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

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

  const handleSearch = async (value) => {
    const searchResults = await searchInventory(value);
    return searchResults;
  };

  const handleSelect = async (id) => {
    const data = await getInventory(id);
    console.log({ inventory });
    const updatedInventory = { ...inventory, rows: [data], count: 1 };
    mutate(updatedInventory);
    return updatedInventory;
  };

  if (error) return <Alert message={error} type="error" />;
  return (
    <>
      <Title level={2}>Inventory List</Title>
      <SearchInput valueKey="itemName" handleSearch={handleSearch} handleSelect={handleSelect} />
      <br />
      <br />
      <Table loading={isLoading} rowKey="id" columns={columns} dataSource={inventory ? inventory.rows : []} />
    </>
  );
};

export default Inventory;
