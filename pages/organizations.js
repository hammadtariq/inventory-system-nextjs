import { Button, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, message } from "antd";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import Head from "next/head";
import { useEffect, useState } from "react";

import OrganizationRegisterFields from "@/components/organizationRegisterFields";
import { getOrganizations, registerOrganization, updateOrganization } from "@/hooks/org";
import { requirePageRole } from "@/lib/page-access";

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
  const [saving, setSaving] = useState(false);
  const [createForm] = Form.useForm();
  const [form] = Form.useForm();

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const data = await getOrganizations();
      setRows(data.rows || []);
    } catch (error) {
      console.error("load organizations error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

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

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Slug", dataIndex: "slug", key: "slug" },
    { title: "Plan", dataIndex: "plan", key: "plan" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={statusColors[status] || "default"}>{status}</Tag>,
    },
    { title: "Seat limit", dataIndex: "maxUsers", key: "maxUsers" },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>
            Edit
          </Button>
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
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Create organization
          </Button>
        </Space>

        <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} pagination={false} />
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
    </>
  );
};

export const getServerSideProps = async (context) => {
  return requirePageRole(context, ["SUPER_ADMIN"]);
};

export default Organizations;
