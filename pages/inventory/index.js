import { Alert } from "antd";
import { useRef, useState } from "react";
import dayjs from "dayjs";

import { useInventory } from "@/hooks/inventory";
import { getColumnSearchProps } from "@/utils/filter.util";
import { DATE_TIME_FORMAT } from "@/utils/ui.util";
import AppTitle from "@/components/title";
import AppTable from "@/components/table";

const Inventory = () => {
  const { inventory, error, isLoading, paginationHandler } = useInventory();
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
      title: "Updated At",
      dataIndex: "updatedAt",
      render: (text) => dayjs(text).format(DATE_TIME_FORMAT),
    },
  ];

  if (error) return <Alert message={error} type="error" />;
  return (
    <>
      <AppTitle level={2}>Inventory List</AppTitle>
      <AppTable
        isLoading={isLoading}
        rowKey="id"
        columns={columns}
        dataSource={inventory ? inventory.rows : []}
        pagination={true}
        paginationHandler={paginationHandler}
      />
    </>
  );
};

export default Inventory;
