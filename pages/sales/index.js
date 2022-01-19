import { Alert } from "antd";
import { useRef, useState } from "react";

import { useSales } from "@/hooks/sales";
import { getColumnSearchProps } from "@/utils/filter.util";
import AppTitle from "@/components/title";
import AppCreateButton from "@/components/createButton";
import AppTable from "@/components/table";

const Sales = () => {
  const { sales, error, isLoading, paginationHandler } = useSales();
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

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
    return <AppTable columns={columns} dataSource={record.soldProducts} pagination={false} />;
  };

  const columns = [
    {
      title: "Customer Name",
      dataIndex: ["customer", "firstName"],
      key: "customerName",
      ...getColumnSearchProps({
        dataIndex: "firstName",
        dataIndexName: "customer name",
        parentDataIndex: "customer",
        nested: true,
        searchInput,
        searchText,
        searchedColumn,
        setSearchText,
        setSearchedColumn,
      }),
    },
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
      <AppTitle level={2}>
        Sales List
        <AppCreateButton url="/sales/create" />
      </AppTitle>
      <AppTable
        isLoading={isLoading}
        rowKey={"id"}
        className="components-table-demo-nested"
        columns={columns}
        expandable={{ expandedRowRender: (record) => expandedRowRender(record) }}
        dataSource={sales ? sales.rows : []}
        pagination={true}
        paginationHandler={paginationHandler}
      />
    </>
  );
};

export default Sales;
