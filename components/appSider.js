"use client";
import { Layout } from "antd";
// import Image from "next/image";

// import Logo from "../public/logo.png";
import AppNavbar from "./navbar";
import styles from "@/styles/DashboardNavigation.module.css";

const { Sider } = Layout;

export default function AppSider({ collapsed, onCollapseChange }) {
  return (
    <Sider className={`site-layout-background ${styles.desktopSider}`}>
      <AppNavbar onCollapseChange={onCollapseChange} collapsed={collapsed} />
    </Sider>
  );
}
