import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, message } from "antd";
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import Head from "next/head";
import { useCallback, useEffect, useState } from "react";

import OrganizationRegisterFields from "@/components/organizationRegisterFields";
import {
  deleteOrganization,
  getOrganization,
  getOrganizations,
  registerOrganization,
  updateOrganization,
} from "@/hooks/org";
import { requirePageRole } from "@/lib/page-access";
import StorageUtils from "@/utils/storage.util";

const statusColors = {
  ACTIVE: "green",
  SUSPENDED: "gold",
  CANCELLED: "red",
};

const Organizations = ({ currentUser }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [createForm] = Form.useForm();
  const [form] = Form.useForm();

  const loadOrganizations = useCallback(async (query = "") => {
    setLoading(true);
    try {
      const data = await getOrganizations(query ? { q: query } : {});
      setRows(data.rows || []);
    } catch (error) {
      console.error("load organizations error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  const submitSearch = (value) => {
    setSearch(value);
    loadOrganizations(value);
  };

  const openDetails = async (organization) => {
    setViewing(organization);
    setDetailLoading(true);
    try {
      const data = await getOrganization(organization.id);
      setViewing(data);
    } catch (error) {
      console.error("load organization detail error:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const openEdit = (organization) => {
    setEditing(organization);
    form.setFieldsValue({
      name: organization.name,
      status: organization.status,
      plan: organization.plan,
      maxUsers: organization.maxUsers,
    });
  };

  const openCreate = () => {
    createForm.resetFields();
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    createForm.resetFields();
  };

  const submitCreate = async (values) => {
    setCreating(true);
    try {
      await registerOrganization(values);
      message.success("Organization created");
      closeCreate();
      loadOrganizations();
    } catch (error) {
      console.error("create organization error:", error);
    } finally {
      setCreating(false);
    }
  };

  const closeEdit = () => {
    setEditing(null);
    form.resetFields();
  };

  const submitEdit = async (values) => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateOrganization(editing.id, values);
      message.success("Organization updated");
      closeEdit();
      loadOrganizations();
    } catch (error) {
      console.error("update organization error:", error);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (organization) => {
    try {
      await deleteOrganization(organization.id);
      const activeOrganization = StorageUtils.getItem("activeOrganization");

      if (activeOrganization?.id === organization.id) {
        localStorage.removeItem("activeOrganization");
      }

      message.success("Organization deleted");
      loadOrganizations(search);
    } catch (error) {
      console.error("delete organization error:", error);
    }
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Slug", dataIndex: "slug", key: "slug" },
    { title: "Email", dataIndex: "email", key: "email", render: (email) => email || "-" },
    { title: "Plan", dataIndex: "plan", key: "plan" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={statusColors[status] || "default"}>{status}</Tag>,
    },
    { title: "Seat limit", dataIndex: "maxUsers", key: "maxUsers" },
    { title: "Users", dataIndex: "usersCount", key: "usersCount", render: (count) => count || 0 },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openDetails(row)}>
            View
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete organization"
            description="This will delete this organization and its tenant data."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => confirmDelete(row)}
            disabled={row.id === currentUser?.organizationId}
          >
            <Button size="small" danger icon={<DeleteOutlined />} disabled={row.id === currentUser?.organizationId}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Head>
        <title>Inventory System - Organizations</title>
      </Head>

      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0 }}>Organizations</h2>
            <div style={{ color: "#666" }}>Signed in as {currentUser?.email}</div>
          </div>
          <Space>
            <Input.Search
              allowClear
              enterButton={<SearchOutlined />}
              placeholder="Search organizations"
              onSearch={submitSearch}
              style={{ width: 280 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Create organization
            </Button>
          </Space>
        </Space>

        <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} pagination={{ pageSize: 10 }} />
      </Space>

      <Modal title="Edit organization" open={!!editing} onCancel={closeEdit} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={submitEdit}>
          <Form.Item name="name" label="Name" rules={[{ required: true, min: 3 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select
              options={[
                { label: "Active", value: "ACTIVE" },
                { label: "Suspended", value: "SUSPENDED" },
                { label: "Cancelled", value: "CANCELLED" },
              ]}
            />
          </Form.Item>
          <Form.Item name="plan" label="Plan" rules={[{ required: true }]}>
            <Select
              options={[
                { label: "Starter", value: "STARTER" },
                { label: "Pro", value: "PRO" },
                { label: "Enterprise", value: "ENTERPRISE" },
              ]}
            />
          </Form.Item>
          <Form.Item name="maxUsers" label="Seat limit" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={saving}>
            Save
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Create organization"
        open={createOpen}
        onCancel={closeCreate}
        footer={null}
        destroyOnClose
        width={760}
      >
        <Form form={createForm} layout="vertical" onFinish={submitCreate} size="large">
          <OrganizationRegisterFields />

          <Button type="primary" htmlType="submit" block loading={creating} style={{ marginTop: 12 }}>
            Create organization
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Organization details"
        open={!!viewing}
        onCancel={() => setViewing(null)}
        footer={null}
        destroyOnClose
        width={760}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Table
            loading={detailLoading}
            pagination={false}
            showHeader={false}
            rowKey="label"
            columns={[
              { dataIndex: "label", width: 160, render: (value) => <strong>{value}</strong> },
              { dataIndex: "value" },
            ]}
            dataSource={[
              { label: "Name", value: viewing?.name },
              { label: "Slug", value: viewing?.slug },
              { label: "Email", value: viewing?.email || "-" },
              { label: "Status", value: viewing?.status },
              { label: "Plan", value: viewing?.plan },
              { label: "Seat limit", value: viewing?.maxUsers },
              { label: "Users", value: viewing?.usersCount || 0 },
            ]}
          />

          <Table
            title={() => "Users"}
            rowKey="id"
            size="small"
            pagination={false}
            dataSource={viewing?.users || []}
            columns={[
              {
                title: "Name",
                key: "name",
                render: (_, user) => `${user.firstName || ""} ${user.lastName || ""}`.trim() || "-",
              },
              { title: "Email", dataIndex: "email", key: "email" },
              { title: "Role", dataIndex: "role", key: "role" },
              { title: "Status", dataIndex: "status", key: "status" },
            ]}
          />
        </Space>
      </Modal>
    </>
  );
};

export const getServerSideProps = async (context) => {
  return requirePageRole(context, ["SUPER_ADMIN"]);
};

export default Organizations;
