import { useEffect, useRef, useState } from "react";

import { Alert, Row, Col } from "antd";
import dayjs from "dayjs";

import SearchInput from "@/components/SearchInput";
import AppTable from "@/components/table";
import AppTitle from "@/components/title";
import ExportToExcel from "@/components/ExportToExcel";
import { getInventory, searchInventory, useInventory } from "@/hooks/inventory";
import { getColumnSearchProps } from "@/utils/filter.util";
import { DATE_TIME_FORMAT } from "@/utils/ui.util";

const Inventory = () => {
  const { inventory, error, isLoading, paginationHandler } = useInventory();
  const [updatedInventory, setUpdatedInventory] = useState();
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  useEffect(() => {
    setUpdatedInventory(inventory);
  }, [inventory]);

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
    { title: "Rate per LBS (Rs)", dataIndex: "ratePerLbs", key: "ratePerLbs", render: (text) => text ?? "N/A" },
    { title: "Rate per KGS (Rs)", dataIndex: "ratePerKgs", key: "ratePerKgs", render: (text) => text ?? "N/A" },
    { title: "On Hand", dataIndex: "onHand", key: "onHand" },
    { title: "Rate per Bale (Rs)", dataIndex: "ratePerBale", key: "ratePerBale" },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      render: (text) => dayjs(text).format(DATE_TIME_FORMAT),
    },
  ];

  const handleSearch = async (value) => {
    if (!value) {
      setUpdatedInventory(inventory);
      return inventory;
    } else {
      const searchResults = await searchInventory(value);
      return searchResults;
    }
  };

  const handleSelect = async (id) => {
    const data = await getInventory(id);
    const newInventory = { ...inventory, rows: [data], count: 1 };
    setUpdatedInventory(newInventory);
    return newInventory;
  };

  if (error) return <Alert message={error} type="error" />;
  return (
    <>
      <AppTitle level={2}>Inventory List</AppTitle>
      <Row>
        <Col span={6}>
          <SearchInput valueKey="itemName" handleSearch={handleSearch} handleSelect={handleSelect} />
        </Col>
        <Col span={6}></Col>
        <Col span={6}></Col>
        <Col span={6}>
          <ExportToExcel />
        </Col>
      </Row>
      <br />
      <br />
      <AppTable
        isLoading={isLoading}
        rowKey="id"
        columns={columns}
        dataSource={updatedInventory ? updatedInventory.rows : []}
        totalCount={updatedInventory ? updatedInventory.count : 0}
        pagination={true}
        paginationHandler={paginationHandler}
      />
    </>
  );
};

export default Inventory;
