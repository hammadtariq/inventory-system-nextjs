import { useRef, useState, useEffect } from "react";
import { Alert, Popconfirm, Row, Col } from "antd";
import dayjs from "dayjs";
import NextLink from "next/link";
import { useRouter } from "next/router";
import AppCreateButton from "@/components/createButton";
import AppTable from "@/components/table";
import AppTitle from "@/components/title";
import SearchInput from "@/components/SearchInput";
import { approveSale, cancelSale, useSales, searchSales, getAllSalesbyCustomer } from "@/hooks/sales";
import { EDITABLE_STATUS } from "@/utils/api.util";
import { getColumnSearchProps } from "@/utils/filter.util";
import permissionsUtil from "@/utils/permission.util";
import { DATE_FORMAT, STATUS_COLORS } from "@/utils/ui.util";
import { CheckOutlined, CloseOutlined, EditOutlined } from "@ant-design/icons";

const Sales = () => {
  const { sales, error, isLoading, paginationHandler, mutate } = useSales();
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [updatedSales, setUpdatedSales] = useState("");
  const searchInput = useRef(null);
  const router = useRouter();
  const canApprove = permissionsUtil.checkAuth({
    category: "sales",
    action: "approve",
  });

  useEffect(() => {
    setUpdatedSales(sales);
  }, [sales]);

  // const expandedRowRender = (record) => {
  //   const columns = [
  //     {
  //       title: "Item Name",
  //       dataIndex: "itemName",
  //       key: "itemName",
  //       ...getColumnSearchProps({
  //         dataIndex: "itemName",
  //         dataIndexName: "item name",
  //         searchInput,
  //         searchText,
  //         searchedColumn,
  //         setSearchText,
  //         setSearchedColumn,
  //       }),
  //     },
  //     { title: "No of Bales", dataIndex: "noOfBales", key: "noOfBales" },
  //     { title: "Bale Weight (LBS)", dataIndex: "baleWeightLbs", key: "baleWeightLbs", render: (text) => text ?? "N/A" },
  //     { title: "Bale Weight (KGS)", dataIndex: "baleWeightKgs", key: "baleWeightKgs", render: (text) => text ?? "N/A" },
  //     { title: "Rate per LBS (Rs)", dataIndex: "ratePerLbs", key: "ratePerLbs", render: (text) => text ?? "N/A" },
  //     { title: "Rate per KGS (Rs)", dataIndex: "ratePerKgs", key: "ratePerKgs", render: (text) => text ?? "N/A" },
  //     // { title: "Rate per Bale (Rs)", dataIndex: "ratePerBale", key: "ratePerBale" },
  //   ];
  //   return <AppTable columns={columns} dataSource={record.soldProducts} pagination={false} />;
  // };

  const renderActions = (text, record) => {
    if (record.status === "PENDING" && canApprove) {
      return (
        <>
          <Popconfirm
            title="Are you sure you want to approve?"
            onConfirm={async () => {
              await approveSale(text.id);
              mutate(null);
            }}
            okText="Yes"
            cancelText="No"
          >
            <CheckOutlined style={{ color: STATUS_COLORS.APPROVED }} className="cancelBtn" />
          </Popconfirm>
          <Popconfirm
            title="Are you sure you want to cancel?"
            onConfirm={async () => {
              await cancelSale(text.id);
              mutate(null);
            }}
            okText="Yes"
            cancelText="No"
          >
            <CloseOutlined style={{ color: STATUS_COLORS.CANCEL }} className="approveBtn" />
          </Popconfirm>

          <EditOutlined
            style={{ color: STATUS_COLORS.EDIT }}
            className="editBtn"
            onClick={() => router.push(`/sales/${text.id}`)}
          />
        </>
      );
    } else if (EDITABLE_STATUS.includes(record.status)) {
      return (
        <EditOutlined
          style={{ color: STATUS_COLORS.EDIT }}
          className="editBtn"
          onClick={() => router.push(`/sales/${text.id}`)}
        />
      );
    }
  };

  const columns = [
    {
      title: "Invoice Number",
      dataIndex: "id",
      key: "id",
      render: (_, record) => {
        return (
          <NextLink href={`/sales/${record.id}?type=view`} passHref>
            <a>{record.id}</a>
          </NextLink>
        );
        // <EyeOutlined onClick={() => router.push(`/sales/${record.id}?type=view`)} />;
      },
    },
    {
      title: "First Name",
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
    {
      title: "Last Name",
      dataIndex: ["customer", "lastName"],
      key: "customerName",
    },
    { title: "Invoice Total Amount (Rs)", dataIndex: "totalAmount", key: "totalAmount" },
    {
      title: "Sold Date",
      dataIndex: "soldDate",
      key: "soldDate",
      render: (text) => dayjs(text).format(DATE_FORMAT),
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (text) => dayjs(text).format(DATE_FORMAT),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      ...getColumnSearchProps({
        dataIndex: "status",
        dataIndexName: "status",
        searchInput,
        searchText,
        searchedColumn,
        setSearchText,
        setSearchedColumn,
      }),
      render(text) {
        return {
          props: {
            style: { color: STATUS_COLORS[text] },
          },
          children: <div>{text}</div>,
        };
      },
    },
    {
      title: "Action",
      key: "action",
      render: renderActions,
    },
  ];

  const handleSearch = async (value) => {
    if (!value) {
      setUpdatedSales(sales);
      return sales;
    } else {
      const searchResults = await searchSales(value);
      return searchResults;
    }
  };

  const handleSelect = async (customerId) => {
    const newItems = await getAllSalesbyCustomer(customerId);
    setUpdatedSales(newItems);
    return newItems;
  };

  if (error) return <Alert message={error} type="error" />;
  return (
    <>
      <AppTitle level={2}>
        Sales List
        <Row justify="space-between">
          <Col>
            <SearchInput
              valueKey="firstName"
              valueKey2="lastName"
              handleSearch={handleSearch}
              handleSelect={handleSelect}
              placeholder="search customer"
            />
          </Col>
          <Col>
            <AppCreateButton url="/sales/create" />
          </Col>
        </Row>
      </AppTitle>
      <br />
      <AppTable
        isLoading={isLoading}
        rowKey={"id"}
        className="components-table-demo-nested"
        columns={columns}
        // expandable={{ expandedRowRender: (record) => expandedRowRender(record) }}
        dataSource={updatedSales ? updatedSales.rows : []}
        totalCount={updatedSales ? updatedSales.count : 0}
        pagination={true}
        paginationHandler={paginationHandler}
      />
    </>
  );
};

export default Sales;
