import { Layout, Breadcrumb } from "antd";

const { Content } = Layout;

export default function AppContent({ children }) {
  return (
    <Content style={{ margin: "0 16px" }}>
      <Breadcrumb style={{ margin: "16px 0" }}>
        <Breadcrumb.Item>Customer</Breadcrumb.Item>
        <Breadcrumb.Item>Customer 1</Breadcrumb.Item>
      </Breadcrumb>
      <div
        className="site-layout-background"
        style={{ padding: 24, minHeight: 360 }}
      >
        Need to integrate routes here
        {children}
      </div>
    </Content>
  );
}
