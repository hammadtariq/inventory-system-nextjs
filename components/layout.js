"use client";
import Head from "next/head";
import { useState } from "react";
import { Layout as AntLayout } from "antd";

import AppContent from "@/components/content";
// import AppFooter from "@/components/footer";
import AppSider from "@/components/appSider";
import MobileDashboardNav from "@/components/mobileDashboardNav";
import styles from "@/styles/DashboardNavigation.module.css";

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <Head>
        <title>Inventory System</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <AntLayout className="site-layout">
        <AppSider collapsed={collapsed} onCollapseChange={setCollapsed} />
        <MobileDashboardNav />
        <AntLayout className={`${styles.dashboardShell}${collapsed ? ` ${styles.dashboardShellCollapsed}` : ""}`}>
          <AppContent>{children}</AppContent>
          {/* <AppFooter /> */}
        </AntLayout>
      </AntLayout>
    </>
  );
}
