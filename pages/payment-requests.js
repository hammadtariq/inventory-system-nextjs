import { useState } from "react";

import { Button, Form, Image, Input, Modal, Select, Space, Table, Tabs, Tag, Typography, message } from "antd";
import dayjs from "dayjs";

import {
  reviewPaymentRequest,
  reviewPublicPaymentRequest,
  usePaymentRequests,
  usePublicPaymentRequests,
} from "@/hooks/billing";
import { requirePageRole } from "@/lib/page-access";
import { DATE_TIME_FORMAT } from "@/utils/ui.util";

const statusColors = {
  PENDING: "gold",
  APPROVED: "green",
  REJECTED: "red",
};

const invoiceStatusColors = {
  UNPAID: "default",
  PENDING_REVIEW: "gold",
  PAID: "green",
  REJECTED: "red",
};

const currencyFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

const PaymentRequests = ({ currentUser }) => {
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const [status, setStatus] = useState("PENDING");
  const { requests, isLoading, mutate, paginationHandler } = usePaymentRequests(status);
  const {
    requests: publicRequests,
    isLoading: publicLoading,
    mutate: mutatePublicRequests,
    paginationHandler: publicPaginationHandler,
  } = usePublicPaymentRequests(status, isSuperAdmin);
  const [reviewing, setReviewing] = useState(null);
  const [reviewingPublic, setReviewingPublic] = useState(null);
  const [reviewStatus, setReviewStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const openReview = (row, nextStatus) => {
    setReviewing(row);
    setReviewStatus(nextStatus);
    form.resetFields();
  };

  const openPublicReview = (row, nextStatus) => {
    setReviewingPublic(row);
    setReviewStatus(nextStatus);
    form.resetFields();
  };

  const closeReview = () => {
    setReviewing(null);
    setReviewingPublic(null);
    setReviewStatus(null);
    form.resetFields();
  };

  const submitReview = async (values) => {
    if ((!reviewing && !reviewingPublic) || !reviewStatus) return;
    setSaving(true);
    try {
      if (reviewingPublic) {
        await reviewPublicPaymentRequest(reviewingPublic.id, {
          status: reviewStatus,
          adminNote: values.adminNote,
        });
        mutatePublicRequests();
      } else {
        await reviewPaymentRequest(reviewing.id, {
          status: reviewStatus,
          adminNote: values.adminNote,
        });
        mutate();
      }
      message.success(reviewStatus === "APPROVED" ? "Payment approved" : "Payment rejected");
      closeReview();
    } catch (error) {
      console.error("review payment error:", error);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: "Invoice",
      key: "invoice",
      render: (_, row) => row.invoice?.invoiceNumber || "-",
    },
    {
      title: "Plan",
      key: "plan",
      render: (_, row) => row.invoice?.plan?.name || "-",
    },
    {
      title: "Amount",
      key: "amount",
      render: (_, row) => (row.invoice ? currencyFormatter.format(Number(row.invoice.amount)) : "-"),
    },
    { title: "Payer", dataIndex: "payerName", key: "payerName" },
    { title: "Reference", dataIndex: "referenceNumber", key: "referenceNumber" },
    {
      title: "Proof",
      key: "proof",
      render: (_, row) =>
        row.proofUrl ? (
          <a href={row.proofUrl} target="_blank" rel="noreferrer">
            Open proof
          </a>
        ) : (
          row.proofText || "-"
        ),
    },
    {
      title: "Invoice status",
      key: "invoiceStatus",
      render: (_, row) => (
        <Tag color={invoiceStatusColors[row.invoice?.status] || "default"}>{row.invoice?.status || "-"}</Tag>
      ),
    },
    {
      title: "Proof status",
      dataIndex: "status",
      key: "status",
      render: (value) => <Tag color={statusColors[value] || "default"}>{value}</Tag>,
    },
    {
      title: "Submitted",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => dayjs(value).format(DATE_TIME_FORMAT),
    },
    {
      title: "Action",
      key: "action",
      render: (_, row) => (
        <Space>
          <Button
            size="small"
            type="primary"
            disabled={row.status !== "PENDING"}
            onClick={() => openReview(row, "APPROVED")}
          >
            Approve
          </Button>
          <Button size="small" danger disabled={row.status !== "PENDING"} onClick={() => openReview(row, "REJECTED")}>
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  const publicColumns = [
    { title: "Business", dataIndex: "businessName", key: "businessName" },
    { title: "Contact", dataIndex: "contactName", key: "contactName" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Package", dataIndex: "packageName", key: "packageName" },
    { title: "Expected amount", dataIndex: "amountLabel", key: "amountLabel" },
    { title: "Reference", dataIndex: "referenceNumber", key: "referenceNumber" },
    { title: "Sender account", dataIndex: "senderAccountNumber", key: "senderAccountNumber" },
    {
      title: "Amount paid",
      dataIndex: "amountPaid",
      key: "amountPaid",
      render: (value) => (value != null ? Number(value).toLocaleString() : "-"),
    },
    {
      title: "Payment date",
      dataIndex: "paidAt",
      key: "paidAt",
      render: (value) => (value ? dayjs(value).format(DATE_TIME_FORMAT) : "-"),
    },
    {
      title: "Screenshot",
      key: "proofImage",
      render: (_, row) => <Image src={row.proofImage} alt="Payment screenshot" width={80} />,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) => <Tag color={statusColors[value] || "default"}>{value}</Tag>,
    },
    {
      title: "Submitted",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => dayjs(value).format(DATE_TIME_FORMAT),
    },
    {
      title: "Action",
      key: "action",
      render: (_, row) => (
        <Space>
          <Button
            size="small"
            type="primary"
            disabled={row.status !== "PENDING"}
            onClick={() => openPublicReview(row, "APPROVED")}
          >
            Confirm
          </Button>
          <Button
            size="small"
            danger
            disabled={row.status !== "PENDING"}
            onClick={() => openPublicReview(row, "REJECTED")}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 4 }}>
            Payment Requests
          </Typography.Title>
          <Typography.Text type="secondary">Review manual bank and Raast payment proofs.</Typography.Text>
        </div>
        <Select
          value={status}
          style={{ width: 180 }}
          onChange={setStatus}
          options={[
            { label: "Pending", value: "PENDING" },
            { label: "Approved", value: "APPROVED" },
            { label: "Rejected", value: "REJECTED" },
          ]}
        />
      </Space>

      <Tabs
        items={[
          ...(isSuperAdmin
            ? [
                {
                  key: "public",
                  label: "Public checkout",
                  children: (
                    <Table
                      rowKey="id"
                      columns={publicColumns}
                      dataSource={publicRequests?.rows || []}
                      loading={publicLoading}
                      pagination={{ total: publicRequests?.count || 0, showSizeChanger: true }}
                      onChange={({ current, pageSize }) => publicPaginationHandler(pageSize, (current - 1) * pageSize)}
                      scroll={{ x: "max-content" }}
                    />
                  ),
                },
              ]
            : []),
          {
            key: "tenant",
            label: "Tenant invoices",
            children: (
              <Table
                rowKey="id"
                columns={columns}
                dataSource={requests?.rows || []}
                loading={isLoading}
                pagination={{ total: requests?.count || 0, showSizeChanger: true }}
                onChange={({ current, pageSize }) => paginationHandler(pageSize, (current - 1) * pageSize)}
                scroll={{ x: "max-content" }}
              />
            ),
          },
        ]}
      />

      <Modal
        title={reviewStatus === "APPROVED" ? "Confirm payment" : "Reject payment"}
        open={!!reviewing || !!reviewingPublic}
        onCancel={closeReview}
        footer={null}
        destroyOnClose
      >
        {reviewingPublic && reviewStatus === "APPROVED" && (
          <Typography.Paragraph type="secondary">
            After confirming, create the customer organization and send onboarding credentials to{" "}
            {reviewingPublic.email}.
          </Typography.Paragraph>
        )}
        <Form form={form} layout="vertical" onFinish={submitReview}>
          <Form.Item name="adminNote" label="Admin note">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block danger={reviewStatus === "REJECTED"} loading={saving}>
            {reviewStatus === "APPROVED" ? "Approve payment" : "Reject payment"}
          </Button>
        </Form>
      </Modal>
    </Space>
  );
};

export const getServerSideProps = async (context) => {
  return requirePageRole(context, ["ADMIN", "SUPER_ADMIN"]);
};

export default PaymentRequests;
