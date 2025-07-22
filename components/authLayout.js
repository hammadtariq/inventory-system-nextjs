import { Layout } from "antd";
import styles from "@/styles/AuthLayout.module.css";

export default function AuthLayout({ children }) {
  return (
    <Layout>
      <div className={styles.publicRoute}>{children}</div>
    </Layout>
  );
}
