import { Layout } from "antd";
// import Image from "next/image";

// import Logo from "../public/logo.png";
import AppNavbar from "./navbar";

const { Sider } = Layout;

export default function AppSider({ collapsed, onCollapseChange }) {
  return (
    <Sider className="site-layout-background">
      <AppNavbar onCollapseChange={onCollapseChange} collapsed={collapsed} />
    </Sider>
  );
}
