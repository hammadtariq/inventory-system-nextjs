import { Breadcrumb, Layout } from "antd";

import styles from "@/styles/Content.module.css";

const { Content } = Layout;

export default function AppContent({ children }) {
  return (
    <Content className={styles.content}>
      <Breadcrumb className={styles.breadcrumb}>
        <Breadcrumb.Item>Customer</Breadcrumb.Item>
        <Breadcrumb.Item>Customer 1</Breadcrumb.Item>
      </Breadcrumb>
      <div className={styles.siteLayout}>{children}</div>
    </Content>
  );
}
