"use client";
import Head from "next/head";
import { useState } from "react";
import { Layout as AntLayout } from "antd";

import AppContent from "@/components/content";
// import AppFooter from "@/components/footer";
import AppSider from "@/components/appSider";
import MobileDashboardNav from "@/components/mobileDashboardNav";
import styles from "@/styles/DashboardNavigation.module.css";

// Lives outside component state so it survives Layout remounts (e.g. the
// Spinner<->children swap in ProtectedRoutes on every route change) without
// persisting across a real full-page reload, which reinitializes this module.
let sidebarCollapsed = false;

export default function Layout({ children }) {
  const [collapsed, setCollapsedState] = useState(sidebarCollapsed);

  const setCollapsed = (value) => {
    sidebarCollapsed = value;
    setCollapsedState(value);
  };

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
