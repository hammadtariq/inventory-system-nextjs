import { Button, Form, Input, message } from "antd";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

import AuthLayout from "@/components/authLayout";
import { registerOrganization } from "@/hooks/org";
import StorageUtils from "@/utils/storage.util";
import PermissionUtil from "@/utils/permission.util";
import styles from "./login.module.css";

const setUserAccess = (user) => {
  StorageUtils.setItem("user", user);
  PermissionUtil.setPermissions(user?.role ?? "EDITOR");
};

const Register = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const data = await registerOrganization(values);
      setUserAccess(data.user);
      message.success("Organization created successfully");
      router.replace("/");
    } catch (error) {
      console.error("register organization error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Inventory System - Register</title>
      </Head>

      <div className={styles.container}>
        <div className={`${styles.loginBox} ${styles.registerBox}`}>
          <h3 className={styles.loginTitle}>Register</h3>

          <Form layout="vertical" onFinish={onFinish} size="large">
            <div className={styles.registerGrid}>
              <Form.Item
                name="organizationName"
                label="Organization"
                rules={[{ required: true, min: 3, message: "Enter your organization name" }]}
              >
                <Input className={styles.input} />
              </Form.Item>

              <Form.Item name="slug" label="Slug" rules={[{ min: 3, message: "Slug must be at least 3 characters" }]}>
                <Input className={styles.input} />
              </Form.Item>

              <Form.Item name="firstName" label="First name" rules={[{ required: true, min: 3 }]}>
                <Input className={styles.input} />
              </Form.Item>

              <Form.Item name="lastName" label="Last name" rules={[{ required: true, min: 3 }]}>
                <Input className={styles.input} />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[{ type: "email", required: true, message: "Please enter a valid email address" }]}
              >
                <Input className={styles.input} />
              </Form.Item>

              <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
                <Input.Password className={styles.input} />
              </Form.Item>
            </div>

            <Button type="primary" htmlType="submit" block loading={loading} style={{ marginTop: 12 }}>
              Create organization
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

Register.getLayout = function getLayout(page) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Register;
