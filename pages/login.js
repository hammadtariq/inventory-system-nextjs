import { Button, Col, Form, Input, message, Row } from "antd";
import Head from "next/head";
import { useEffect, useState } from "react";
import AuthLayout from "@/components/authLayout";
import { loginUser } from "@/hooks/login";
import styles from "@/styles/Login.module.css";
import StorageUtils from "@/utils/storage.util";
import PermissionUtil from "@/utils/permission.util";

const setUserAccess = (user) => {
  StorageUtils.setItem("user", user);
  PermissionUtil.setPermissions(user?.role ?? "EDITOR");
};

const Login = ({ router }) => {
  const [loading, setLoading] = useState(false);

  const onFinish = (values) => {
    setLoading(true);
    loginUser(values)
      .then((data) => {
        router.replace("/");
        setLoading(false);
        setUserAccess(data.user);
        message.success("User logged in successfully");
      })
      .catch((err) => {
        setLoading(false);
        console.log("login error: ", err);
      });
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  useEffect(() => {
    // Prefetch the dashboard page
    router.prefetch("/");
  }, [router]);

  return (
    <>
      <Head>
        <title>Inventory System - Login</title>
      </Head>
      <Row className={styles.container} justify="center" align="middle">
        <Col xs={23}>
          <Form
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            layout="vertical"
            size="large"
            wrapperCol={{ span: 24 }}
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[{ type: "email", message: "Please provide valid email address", required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[
                {
                  type: "string",
                  message: "Please provide at least 8 characters long password",
                  required: true,
                  min: 8,
                },
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button type="secondary" htmlType="submit" loading={loading}>
                Login
              </Button>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </>
  );
};

Login.getLayout = function getLayout(page) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Login;
