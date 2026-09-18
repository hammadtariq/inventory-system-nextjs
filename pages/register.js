import { Button, Form, message } from "antd";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

import AuthLayout from "@/components/authLayout";
import OrganizationRegisterFields from "@/components/organizationRegisterFields";
import { registerOrganization } from "@/hooks/org";
import { requirePageRole } from "@/lib/page-access";
import styles from "./login.module.css";

const Register = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await registerOrganization(values);
      message.success("Organization created successfully");
      router.replace("/organizations");
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
            <OrganizationRegisterFields />

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

export const getServerSideProps = async (context) => {
  return requirePageRole(context, ["SUPER_ADMIN"]);
};

Register.getLayout = function getLayout(page) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Register;
