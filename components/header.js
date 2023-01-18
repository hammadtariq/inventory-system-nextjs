import { Layout } from "antd";
// import Image from "next/image";

// import Logo from "../public/logo.png";
import AppNavbar from "./navbar";

const { Header } = Layout;

export default function AppHeader() {
  return (
    <Header className="site-layout-background">
      <AppNavbar />
    </Header>
  );
}
