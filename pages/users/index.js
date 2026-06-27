import { Button, Form, Input, Modal, Select, Space, Tag, Tooltip, message } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  MailOutlined,
  LinkOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import Head from "next/head";
import { useEffect, useState } from "react";

import AppTable from "@/components/table";
import AppTitle from "@/components/title";
import {
  deleteOrganizationUser,
  getOrganizationUsers,
  inviteOrganizationUser,
  resendOrganizationInvite,
  updateOrganizationUser,
} from "@/hooks/org";
import styles from "@/styles/Users.module.css";
import StorageUtils from "@/utils/storage.util";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("create");
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();
  const [inviteLinks, setInviteLinks] = useState({});
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

  const openCreate = () => {
    setMode("create");
    setSelectedUser(null);
    form.resetFields();
    form.setFieldsValue({ role: "EDITOR" });
    setInviteOpen(true);
  };

  const openEdit = (user) => {
    setMode("edit");
    setSelectedUser(user);
    form.setFieldsValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setInviteOpen(true);
  };

  const closeModal = () => {
    setInviteOpen(false);
    setSelectedUser(null);
    setSaving(false);
    form.resetFields();
  };

  const submitUser = async (values) => {
    setSaving(true);
    try {
      if (mode === "create") {
        const data = await inviteOrganizationUser(values);
        if (data?.inviteUrl) {
          setInviteLinks((prev) => ({ ...prev, [data.user.id]: data.inviteUrl }));
        }
        if (data?.emailStatus === "SENT") {
          message.success("Invite sent");
        } else if (data?.emailStatus === "NOT_CONFIGURED") {
          message.warning("Invite created, but email is not configured on this server.");
        } else if (data?.emailStatus === "FAILED") {
          message.error("Invite created, but the email delivery failed.");
        } else {
          message.success("Invite created");
        }
      } else {
        await updateOrganizationUser(selectedUser.id, values);
        message.success("User updated");
      }
      closeModal();
      loadUsers();
    } catch (error) {
      console.error("save user error:", error);
    } finally {
      setSaving(false);
    }
  };

  const removeUser = (user) => {
    Modal.confirm({
      title: "Delete user",
      content: `Delete ${user.firstName || ""} ${user.lastName || ""}?`,
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteOrganizationUser(user.id);
          message.success("User deleted");
          loadUsers();
        } catch (error) {
          console.error("delete user error:", error);
        }
      },
    });
  };

  const handleInviteAction = async (user, sendEmail = false) => {
    try {
      const data = await resendOrganizationInvite(user.id, sendEmail);
      setInviteLinks((prev) => ({ ...prev, [user.id]: data.inviteUrl }));
      return data.inviteUrl;
    } catch (error) {
      console.error("invite link error:", error);
      return null;
    }
  };

  const copyInviteLink = async (user) => {
    const inviteUrl = inviteLinks[user.id] || (await handleInviteAction(user, false));
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    message.success("Invite link copied");
  };

  const resendInviteEmail = async (user) => {
    const data = await resendOrganizationInvite(user.id, true);
    setInviteLinks((prev) => ({ ...prev, [user.id]: data.inviteUrl }));
    if (data?.emailStatus === "SENT") {
      message.success("Invite email sent");
    } else if (data?.emailStatus === "NOT_CONFIGURED") {
      message.warning("Email is not configured on this server.");
    } else {
      message.error("Invite email failed.");
    }
  };

  const openInviteLink = async (user) => {
    const inviteUrl = inviteLinks[user.id] || (await handleInviteAction(user, false));
    if (!inviteUrl) return;
    window.open(inviteUrl, "_blank", "noopener,noreferrer");
  };

  const renderInviteCell = (row) => {
    if (row.status !== "INVITED") {
      return <Tag color="default">Not pending</Tag>;
    }

    return (
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <div className={styles.inviteActions}>
          <Tooltip title="Copy invite link">
            <Button
              size="small"
              icon={<LinkOutlined />}
              className={styles.inviteActionButton}
              onClick={() => copyInviteLink(row)}
            >
              Copy
            </Button>
          </Tooltip>
          <Tooltip title="Send the invite email again">
            <Button
              size="small"
              icon={<MailOutlined />}
              className={styles.inviteActionButton}
              onClick={() => resendInviteEmail(row)}
            >
              Resend
            </Button>
          </Tooltip>
          <Tooltip title="Open the invite page">
            <Button
              size="small"
              type="primary"
              icon={<ReloadOutlined />}
              className={styles.inviteActionButton}
              onClick={() => openInviteLink(row)}
            >
              Accept Invite
            </Button>
          </Tooltip>
        </div>
      </Space>
    );
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
    {
      title: "Invite Link",
      width: 320,
      key: "inviteLink",
      render: (_, row) => renderInviteCell(row),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <div className={styles.rowActions}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeUser(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (!["ADMIN", "SUPER_ADMIN"].includes(currentUser?.role)) {
    return <div>Operation not permitted.</div>;
  }

  return (
    <>
      <Head>
        <title>Inventory System - Users</title>
      </Head>

      <AppTitle
        level={2}
        action={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Invite user
          </Button>
        }
      >
        Users
      </AppTitle>

      <AppTable
        rowKey="id"
        columns={columns}
        dataSource={users}
        isLoading={loading}
        pagination={false}
        className={styles.usersTable}
      />

      <Modal
        title={mode === "create" ? "Invite user" : "Edit user"}
        open={inviteOpen}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={submitUser} initialValues={{ role: "EDITOR" }}>
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
          {mode === "edit" && (
            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select
                options={[
                  { label: "Active", value: "ACTIVE" },
                  { label: "Invited", value: "INVITED" },
                  { label: "Disabled", value: "DISABLED" },
                ]}
              />
            </Form.Item>
          )}
          <Button type="primary" htmlType="submit" loading={saving} block>
            {mode === "create" ? "Create invite" : "Save changes"}
          </Button>
        </Form>
      </Modal>
    </>
  );
};

export default Users;
