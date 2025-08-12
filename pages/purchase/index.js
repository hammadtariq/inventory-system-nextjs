import { useState, useEffect } from "react";
import { Alert, Row, Col, Popconfirm } from "antd";
import dayjs from "dayjs";
import NextLink from "next/link";
import { useRouter } from "next/router";

import AppCreateButton from "@/components/createButton";
import AppTable from "@/components/table";
import AppTitle from "@/components/title";
import { approvePurchase, cancelPurchase, searchPurchase, usePurchaseOrders } from "@/hooks/purchase";
import permissionsUtil from "@/utils/permission.util";
import { DATE_FORMAT, DEFAULT_PAGE_LIMIT, STATUS_COLORS } from "@/utils/ui.util";
import SearchInput from "@/components/SearchInput";
import { comaSeparatedValues } from "@/utils/comaSeparatedValues";
import { CheckOutlined, CloseOutlined, EditOutlined } from "@ant-design/icons";
import { EDITABLE_STATUS } from "@/utils/api.util";

const PurchaseOrders = () => {
  const [updatedPurchase, setUpdatedPurchase] = useState();
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { purchaseOrders, error, isLoading, pagination, paginationHandler, mutate } = usePurchaseOrders(search);

  useEffect(() => {
    setUpdatedPurchase(purchaseOrders);
  }, [purchaseOrders]);

  const handleSearch = async (value) => {
    if (!value) {
      setSearch("");
      paginationHandler(DEFAULT_PAGE_LIMIT, 0, 1);
    } else {
      const searchResults = await searchPurchase(value);
      return searchResults;
    }
  };

  const handleSelect = async (companyId) => {
    paginationHandler(DEFAULT_PAGE_LIMIT, 0, 1);
    setSearch(companyId);
  };

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
        <NextLink href={`/purchase/${record.id}?type=view`} passHref target="_blank" rel="noopener noreferrer">
          <span>{record.id}</span>
        </NextLink>
      ),
    },
    {
      title: "Company Name",
      dataIndex: ["company", "companyName"],
      key: "companyName",
    },
    {
      title: "Invoice Total Amount (Rs)",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (text) => comaSeparatedValues(text),
    },
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
        pagination={pagination}
      />
    </>
  );
};

export default PurchaseOrders;
