"use client";
import Head from "next/head";
import { useState } from "react";
import { Layout as AntLayout } from "antd";

import AppContent from "@/components/content";
// import AppFooter from "@/components/footer";
import AppSider from "@/components/appSider";
import MobileDashboardNav from "@/components/mobileDashboardNav";
import styles from "@/styles/DashboardNavigation.module.css";
import StorageUtils from "@/utils/storage.util";

const SIDEBAR_COLLAPSED_KEY = "sidebarCollapsed";

// Layout only ever mounts client-side: ProtectedRoutes renders a Spinner in
// its place until the auth check resolves, for every protected route, on
// both the initial load and every route change. So it's safe to read
// localStorage synchronously here - this never runs during SSR/hydration and
// keeps the collapsed state stable across remounts, navigation, and reloads.
const getInitialCollapsed = () => StorageUtils.getItem(SIDEBAR_COLLAPSED_KEY) ?? false;

export default function Layout({ children }) {
  const [collapsed, setCollapsedState] = useState(getInitialCollapsed);

  const setCollapsed = (value) => {
    setCollapsedState(value);
    StorageUtils.setItem(SIDEBAR_COLLAPSED_KEY, value);
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
