import { Button, Form, Input, Modal, Select, Space, Table, Tag, message } from "antd";
import Head from "next/head";
import { useEffect, useState } from "react";

import { getOrganizationUsers, inviteOrganizationUser } from "@/hooks/org";
import StorageUtils from "@/utils/storage.util";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [form] = Form.useForm();
  const currentUser = StorageUtils.getItem("user");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getOrganizationUsers();
      setUsers(data.rows || []);
    } catch (error) {
      console.error("load users error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onInvite = async (values) => {
    setInviteLoading(true);
    try {
      const data = await inviteOrganizationUser(values);
      setInviteUrl(data.inviteUrl);
      message.success("Invite created");
      form.resetFields();
      loadUsers();
    } catch (error) {
      console.error("invite user error:", error);
    } finally {
      setInviteLoading(false);
    }
  };

  const columns = [
    {
      title: "Name",
      key: "name",
      render: (_, row) => `${row.firstName || ""} ${row.lastName || ""}`,
    },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Role", dataIndex: "role", key: "role" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status = "ACTIVE") => <Tag color={status === "ACTIVE" ? "green" : "gold"}>{status}</Tag>,
    },
  ];

  if (currentUser?.role !== "ADMIN") {
    return <div>Operation not permitted.</div>;
  }

  return (
    <>
      <Head>
        <title>Inventory System - Users</title>
      </Head>

      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>Users</h2>
          <Button type="primary" onClick={() => setInviteOpen(true)}>
            Invite user
          </Button>
        </Space>

        <Table rowKey="id" columns={columns} dataSource={users} loading={loading} pagination={false} />
      </Space>

      <Modal
        title="Invite user"
        open={inviteOpen}
        onCancel={() => {
          setInviteOpen(false);
          setInviteUrl("");
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onInvite} initialValues={{ role: "EDITOR" }}>
          <Form.Item name="firstName" label="First name" rules={[{ required: true, min: 3 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label="Last name" rules={[{ required: true, min: 3 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select
              options={[
                { label: "Editor", value: "EDITOR" },
                { label: "Admin", value: "ADMIN" },
              ]}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={inviteLoading} block>
            Create invite
          </Button>
        </Form>

        {inviteUrl && (
          <Input.TextArea
            value={inviteUrl}
            readOnly
            autoSize
            style={{ marginTop: 16 }}
            onFocus={(e) => e.target.select()}
          />
        )}
      </Modal>
    </>
  );
};

export default Users;
