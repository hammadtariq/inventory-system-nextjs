import { Alert } from "antd";
import dayjs from "dayjs";

import AppCreateButton from "@/components/createButton";
import AppTable from "@/components/table";
import AppTitle from "@/components/title";
import { useSaleReturns } from "@/hooks/saleReturns";
import { DATE_FORMAT } from "@/utils/ui.util";
import { comaSeparatedValues } from "@/utils/comaSeparatedValues";

const SaleReturns = () => {
  const { saleReturns, error, isLoading, paginationHandler } = useSaleReturns();

  const columns = [
    {
      title: "Return #",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Sale Invoice #",
      dataIndex: "saleId",
      key: "saleId",
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, record) => (record.customer ? `${record.customer.firstName} ${record.customer.lastName}` : "-"),
    },
    {
      title: "Total Amount (Rs)",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (text) => comaSeparatedValues(Number(text).toFixed(2)),
    },
    {
      title: "Return Date",
      dataIndex: "returnDate",
      key: "returnDate",
      render: (text) => dayjs(text).format(DATE_FORMAT),
    },
    {
      title: "Reference",
      dataIndex: "reference",
      key: "reference",
      render: (text) => text || "-",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => dayjs(text).format(DATE_FORMAT),
    },
  ];

  if (error) return <Alert message={error} type="error" />;

  return (
    <>
      <AppTitle level={2}>Sale Returns</AppTitle>
      <br />
      <AppTable
        isLoading={isLoading}
        rowKey="id"
        columns={columns}
        dataSource={saleReturns ? saleReturns.rows : []}
        totalCount={saleReturns ? saleReturns.count : 0}
        paginationHandler={paginationHandler}
      />
    </>
  );
};

export default SaleReturns;
