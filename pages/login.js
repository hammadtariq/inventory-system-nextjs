// pages/index.js
import { Form, Input, Button, message } from "antd";
import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "./login.module.css";
import AuthLayout from "@/components/authLayout";
import { loginUser } from "@/hooks/login";
import StorageUtils from "@/utils/storage.util";
import PermissionUtil from "@/utils/permission.util";

const setUserAccess = (user) => {
  StorageUtils.setItem("user", user);
  PermissionUtil.setPermissions(user?.role ?? "EDITOR");
};

const Login = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/");
  }, [router]);

  const onFinish = (values) => {
    setLoading(true);
    loginUser(values)
      .then((data) => {
        setUserAccess(data.user);
        message.success("User logged in successfully");
        router.replace("/");
      })
      .catch((err) => {
        message.error("Login failed. Please check your credentials.");
        console.error("login error:", err);
      })
      .finally(() => setLoading(false));
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Validation Failed:", errorInfo);
  };

  return (
    <>
      <Head>
        <title>Inventory System - Login</title>
      </Head>

      <div className={styles.container}>
        <div className={styles.shape1}></div>
        <div className={styles.shape2}></div>
        <div className={styles.shape3}></div>

        <div className={styles.loginBox}>
          <h3 className={styles.loginTitle}>Login</h3>

          <Form layout="vertical" onFinish={onFinish} onFinishFailed={onFinishFailed} size="large">
            <Form.Item
              name="email"
              label="Email"
              rules={[{ type: "email", required: true, message: "Please enter a valid email address" }]}
            >
              <Input placeholder="username@gmail.com" className={styles.input} />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                {
                  required: true,
                  min: 8,
                  message: "Password must be at least 8 characters long",
                },
              ]}
            >
              <Input.Password placeholder="Password" className={styles.input} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading} style={{ marginTop: "20px" }}>
                Sign in
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </>
  );
};

// Use the AuthLayout wrapper like before
Login.getLayout = function getLayout(page) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Login;
