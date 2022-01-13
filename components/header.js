import { Layout } from "antd";
import AppNavbar from "./navbar";
const { Header } = Layout;

export default function AppHeader() {
  return (
    <Header className="site-layout-background" style={{ position: "fixed", zIndex: 99, width: "100%", padding: 0 }}>
      <div className="logo" />
      <AppNavbar />
    </Header>
  );
}
