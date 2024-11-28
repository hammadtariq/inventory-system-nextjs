import { useRef, useState, useEffect } from "react";

import { Alert, Popconfirm, Row, Col } from "antd";
import dayjs from "dayjs";
import NextLink from "next/link";
import { useRouter } from "next/router";

import AppCreateButton from "@/components/createButton";
import AppTable from "@/components/table";
import AppTitle from "@/components/title";
import {
  approvePurchase,
  cancelPurchase,
  getAllPurchasesbyCompany,
  searchPurchase,
  usePurchaseOrders,
} from "@/hooks/purchase";
import { EDITABLE_STATUS } from "@/utils/api.util";
import { getColumnSearchProps } from "@/utils/filter.util";
import permissionsUtil from "@/utils/permission.util";
import { DATE_FORMAT, STATUS_COLORS } from "@/utils/ui.util";
import { CheckOutlined, CloseOutlined, EditOutlined } from "@ant-design/icons";
import SearchInput from "@/components/SearchInput";

const PurchaseOrders = () => {
  const { purchaseOrders, error, isLoading, paginationHandler, mutate } = usePurchaseOrders();
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [updatedPurchase, setUpdatedPurchase] = useState();
  const searchInput = useRef(null);
  const router = useRouter();

  useEffect(() => {
    setUpdatedPurchase(purchaseOrders);
  }, [purchaseOrders]);

  const canApprove = permissionsUtil.checkAuth({
    category: "purchase",
    action: "approve",
  });

  const renderActions = (text, record) => {
    if (record.status === "PENDING" && canApprove) {
      return (
        <>
          <Popconfirm
            title="Are you sure you want to approve?"
            onConfirm={async () => {
              await approvePurchase(text.id);
              mutate(null);
            }}
            okText="Yes"
            cancelText="No"
          >
            <CheckOutlined style={{ color: STATUS_COLORS.APPROVED }} className="cancelBtn" />
          </Popconfirm>
          <Popconfirm
            title="Are you sure for cancel?"
            onConfirm={async () => {
              await cancelPurchase(text.id);
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
            onClick={() => router.push(`/purchase/${text.id}`)}
          />
        </>
      );
    } else if (EDITABLE_STATUS.includes(record.status)) {
      return (
        <EditOutlined
          style={{ color: STATUS_COLORS.EDIT }}
          className="editBtn"
          onClick={() => router.push(`/purchase/${text.id}`)}
        />
      );
    } else {
      return (
        <EditOutlined
          style={{ color: STATUS_COLORS.EDIT }}
          className="editBtn"
          onClick={() => router.push(`/purchase/${text.id}`)}
        />
      );
    }
  };
  const columns = [
    {
      title: "Id",
      dataIndex: "id",
      key: "id",
      render: (_, record) => (
        <NextLink href={`/purchase/${record.id}?type=view`} passHref>
          <a>{record.id}</a>
        </NextLink>
      ),
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
    { title: "Invoice Total Amount (Rs)", dataIndex: "totalAmount", key: "totalAmount" },
    { title: "Bale Type", dataIndex: "baleType", key: "baleType" },
    { title: "Invoice Number", dataIndex: "invoiceNumber", key: "invoiceNumber", render: (text) => text ?? "N/A" },
    { title: "Sur Charge (Rs)", dataIndex: "surCharge", key: "surCharge", render: (text) => text ?? "N/A" },
    {
      title: "Purchase Date",
      dataIndex: "purchaseDate",
      key: "purchaseDate",
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
      setUpdatedPurchase(purchaseOrders);
      return purchaseOrders;
    } else {
      const searchResults = await searchPurchase(value);
      return searchResults;
    }
  };

  const handleSelect = async (companyId) => {
    const newItems = await getAllPurchasesbyCompany(companyId);
    setUpdatedPurchase(newItems);
    return newItems;
  };

  if (error) return <Alert message={error} type="error" />;
  return (
    <>
      <AppTitle level={2}>
        Purchase Order List
        <Row justify="space-between">
          <Col>
            <SearchInput
              valueKey="companyName"
              handleSearch={handleSearch}
              handleSelect={handleSelect}
              placeholder="search company"
            />
          </Col>
          <Col>
            <AppCreateButton url="/purchase/create" />
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
        dataSource={updatedPurchase ? updatedPurchase.rows : []}
        totalCount={updatedPurchase ? updatedPurchase.count : 0}
        paginationHandler={paginationHandler}
      />
    </>
  );
};

export default PurchaseOrders;
