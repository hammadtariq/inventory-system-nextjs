import { Layout } from "antd";

const { Footer } = Layout;

export default function AppFooter() {
  return <Footer style={{ textAlign: "center" }}>Inventory System ©{new Date().getFullYear()}</Footer>;
}
