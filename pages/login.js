import Head from "next/head";
import { useState, useEffect } from "react";
import { Form, Input, Button, Row, Col, message } from "antd";

import AppTitle from "@/components/title";
import { loginUser } from "@/hooks/login";

import styles from "@/styles/Login.module.css";

const Login = ({ router }) => {
  const [loading, setLoading] = useState(false);

  const onFinish = (values) => {
    setLoading(true);
    loginUser(values)
      .then(() => {
        message.success("User logged in successcully");
        router.replace("/");
        setLoading(false);
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
        <Col span={24} md={6}>
          <Row justify="center">
            <AppTitle level={2}>Inventory System</AppTitle>
          </Row>
          <Row justify="center">
            <Col span={24}>
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
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  );
};

Login.getLayout = function getLayout(page) {
  return <>{page}</>;
};

export default Login;
