import { useEffect, useRef, useState } from "react";

import { Alert, Col, Row } from "antd";
import dayjs from "dayjs";

import EditableInventoryCell from "@/components/editableInventoryCell";
import ExportButton from "@/components/exportButton";
import SearchInput from "@/components/SearchInput";
import Spinner from "@/components/spinner";
import AppTable from "@/components/table";
import AppTitle from "@/components/title";
import { exportInventory, getInventory, searchInventory, updateInventory, useInventory } from "@/hooks/inventory";
import styles from "@/styles/EditAbleTable.module.css";
import { getColumnSearchProps } from "@/utils/filter.util";
import { DATE_TIME_FORMAT } from "@/utils/ui.util";

const Inventory = () => {
  const { inventory, error, isLoading, mutate, paginationHandler } = useInventory();
  const [updatedInventory, setUpdatedInventory] = useState();
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [loading, setLoading] = useState(false);

  const searchInput = useRef(null);

  useEffect(() => {
    setUpdatedInventory(inventory);
  }, [inventory]);

  const defaultColumns = [
    {
      title: "Item Name",
      dataIndex: "itemName",
      key: "itemName",
      width: "30%",
      editable: true,
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

  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    };
  });

  const handleSave = async (row) => {
    setLoading(true);
    const newData = [...updatedInventory.rows];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];
    try {
      await updateInventory(item.id, { itemName: row.itemName });
      mutate();
    } catch (error) {
      console.log("update inventory item name error", error);
    }
    setLoading(false);
  };

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

  const handleExport = async () => {
    try {
      const response = await exportInventory();
      return response;
    } catch (error) {
      console.log("export error", error);
      return error;
    }
  };

  if (error) return <Alert message={error} type="error" />;
  return (
    <>
      <AppTitle level={2}>Inventory List</AppTitle>
      <Row justify="space-between">
        <Col>
          <SearchInput valueKey="itemName" handleSearch={handleSearch} handleSelect={handleSelect} />
        </Col>
        <Col>
          <ExportButton handleExport={handleExport} filename="inventory" />
        </Col>
      </Row>
      <br />
      <br />
      {loading && <Spinner />}
      <AppTable
        isLoading={isLoading}
        rowKey="id"
        columns={columns}
        components={{
          body: {
            cell: EditableInventoryCell,
          },
        }}
        rowClassName={styles.editableRow}
        dataSource={updatedInventory ? updatedInventory.rows : []}
        totalCount={updatedInventory ? updatedInventory.count : 0}
        pagination={true}
        paginationHandler={paginationHandler}
      />
    </>
  );
};

export default Inventory;
