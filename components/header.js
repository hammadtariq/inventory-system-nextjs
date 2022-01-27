import { Layout } from "antd";
import AppNavbar from "./navbar";
const { Header } = Layout;

export default function AppHeader() {
  return (
    <Header className="site-layout-background">
      <div className="logo">Inventory</div>
      <AppNavbar />
    </Header>
  );
}
