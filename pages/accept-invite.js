import { Button, Form, Input, message } from "antd";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

import AuthLayout from "@/components/authLayout";
import { acceptOrganizationInvite } from "@/hooks/org";
import StorageUtils from "@/utils/storage.util";
import PermissionUtil from "@/utils/permission.util";
import styles from "./login.module.css";

const setUserAccess = (user) => {
  StorageUtils.setItem("user", user);
  PermissionUtil.setPermissions(user?.role ?? "EDITOR");
};

const AcceptInvite = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    const token = values.token || router.query.token;
    setLoading(true);
    try {
      const data = await acceptOrganizationInvite({ token, password: values.password });
      setUserAccess(data.user);
      message.success("Invite accepted");
      router.replace("/");
    } catch (error) {
      console.error("accept invite error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Inventory System - Accept Invite</title>
      </Head>

      <div className={styles.container}>
        <div className={styles.loginBox}>
          <h3 className={styles.loginTitle}>Accept Invite</h3>

          <Form layout="vertical" onFinish={onFinish} size="large" initialValues={{ token: router.query.token }}>
            {!router.query.token && (
              <Form.Item name="token" label="Invite token" rules={[{ required: true }]}>
                <Input className={styles.input} />
              </Form.Item>
            )}

            <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
              <Input.Password className={styles.input} />
            </Form.Item>

            <Button type="primary" htmlType="submit" block loading={loading} style={{ marginTop: 12 }}>
              Continue
            </Button>

            <div style={{ marginTop: 16, textAlign: "center" }}>
              <Link href="/login">Back to login</Link>
            </div>
          </Form>
        </div>
      </div>
    </>
  );
};

AcceptInvite.getLayout = function getLayout(page) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default AcceptInvite;
