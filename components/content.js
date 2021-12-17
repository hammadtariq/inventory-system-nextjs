import { Breadcrumb, Layout } from "antd";

import css from "@/styles/Content.module.css";

const { Content } = Layout;

export default function AppContent({ children }) {
  return (
    <Content className={css.content}>
      <Breadcrumb className={css.breadcrumb}>
        <Breadcrumb.Item>Customer</Breadcrumb.Item>
        <Breadcrumb.Item>Customer 1</Breadcrumb.Item>
      </Breadcrumb>
      <div className={css.siteLayout}>{children}</div>
    </Content>
  );
}
