import { Form, Input, Button, ConfigProvider, message } from "antd";
import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import styles from "./login.module.css";
import AuthLayout from "@/components/authLayout";
import { loginUser } from "@/hooks/login";
import StorageUtils from "@/utils/storage.util";
import PermissionUtil from "@/utils/permission.util";

const setUserAccess = (user) => {
  StorageUtils.setItem("user", user);
  PermissionUtil.setPermissions(user?.role ?? "EDITOR");
};

const FEATURE_BULLETS = [
  "Real-time stock tracking across locations",
  "Double-entry ledger with cheque tracking",
  "Purchase orders, approvals, and reconciliation",
];

const antTheme = {
  token: {
    colorPrimary: "#2563eb",
    colorPrimaryHover: "#1d4ed8",
    borderRadius: 6,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica Neue, sans-serif",
  },
};

const Login = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  const onFinish = (values) => {
    setLoading(true);
    loginUser(values)
      .then((data) => {
        setUserAccess(data.user);
        message.success("Logged in successfully");
        router.replace(data.user?.role === "SUPER_ADMIN" ? "/organizations" : "/dashboard");
      })
      .catch(() => {
        message.error("Login failed. Please check your credentials.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <Head>
        <title>Sign in - StockFlow</title>
      </Head>

      <div className={styles.loginContainer}>
        {/* Left panel - brand / feature summary */}
        <div className={styles.leftPanel} aria-hidden="true">
          <div className={styles.leftInner}>
            <Link href="/" className={styles.brandMark}>
              <img src="/only-shape-no-bg.png" alt="" width={32} height={32} className={styles.logoIcon} />
              <span className={styles.brandName}>StockFlow</span>
            </Link>

            <div className={styles.leftBody}>
              <p className={styles.leftTagline}>Inventory and accounts for growing businesses.</p>
              <ul className={styles.featureList}>
                {FEATURE_BULLETS.map((bullet) => (
                  <li key={bullet} className={styles.featureItem}>
                    <svg className={styles.checkIcon} viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path
                        d="M3 8l3.5 3.5L13 4.5"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>

            <p className={styles.leftFooter}>Trusted by businesses across Pakistan, India, and Bangladesh.</p>
          </div>
        </div>

        {/* Right panel - login form */}
        <motion.div
          className={styles.rightPanel}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={styles.formWrapper}>
            {/* Mobile-only logo */}
            <Link href="/" className={styles.mobileLogoRow}>
              <img
                src="/only-shape-no-bg.png"
                alt="StockFlow"
                width={28}
                height={28}
                className={styles.mobileLogoIcon}
              />
              <span className={styles.mobileLogoName}>StockFlow</span>
            </Link>

            <div className={styles.formHeader}>
              <h1 className={styles.formTitle}>Welcome back</h1>
              <p className={styles.formSubtitle}>Sign in to your StockFlow account.</p>
            </div>

            <ConfigProvider theme={antTheme}>
              <Form layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    {
                      type: "email",
                      required: true,
                      message: "Enter a valid email address",
                    },
                  ]}
                >
                  <Input placeholder="you@company.com" />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    {
                      required: true,
                      min: 8,
                      message: "Password must be at least 8 characters",
                    },
                  ]}
                >
                  <Input.Password placeholder="Password" />
                </Form.Item>

                <Form.Item style={{ marginTop: 8, marginBottom: 0 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={loading}
                    style={{ height: 42, fontWeight: 500 }}
                  >
                    Sign in
                  </Button>
                </Form.Item>
              </Form>
            </ConfigProvider>
          </div>
        </motion.div>
      </div>
    </>
  );
};

Login.getLayout = function getLayout(page) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Login;
