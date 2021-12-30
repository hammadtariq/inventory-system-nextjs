import { Button, Form, Input, message, Row } from "antd";
import Head from "next/head";
import { useEffect, useState } from "react";
import AuthLayout from "@/components/authLayout";
import { loginUser } from "@/hooks/login";
import styles from "@/styles/Login.module.css";
import localStorageUtil from "@/utils/localStorageUtil";

const Login = ({ router }) => {
  const [loading, setLoading] = useState(false);

  const onFinish = (values) => {
    setLoading(true);
    loginUser(values)
      .then((data) => {
        router.replace("/");
        setLoading(false);
        localStorageUtil.setItem("user", data.user);
        message.success("User logged in successfully");
      })
      .catch((_) => setLoading(false));
  };

  const onFinishFailed = (errorInfo) => {
    // console.log("Failed:", errorInfo);
  };

  useEffect(() => {
    // Prefetch the dashboard page
    router.prefetch("/");
  }, []);

  return (
    <>
      <Head>
        <title>Inventory System - Login</title>
      </Head>
      <Row className={styles.container} justify="center" align="middle">
        <Form onFinish={onFinish} onFinishFailed={onFinishFailed} layout="vertical" size="large">
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
      </Row>
    </>
  );
};

Login.getLayout = function getLayout(page) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Login;
