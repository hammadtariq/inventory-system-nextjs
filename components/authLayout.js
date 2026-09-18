import Head from "next/head";
import { Layout } from "antd";
import styles from "@/styles/AuthLayout.module.css";

export default function AuthLayout({ children }) {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <Layout>
        <div className={styles.publicRoute}>{children}</div>
      </Layout>
    </>
  );
}
