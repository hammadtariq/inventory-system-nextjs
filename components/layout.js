import { useState } from "react";
import Head from "next/head";
import { Layout as AntLayout } from "antd";

import AppContent from "@/components/content";
import AppFooter from "@/components/footer";
import AppHeader from "@/components/header";
import AppSider from "@/components/sider";

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  const onCollapse = (collapsed) => {
    setCollapsed(collapsed);
  };

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Head>
        <title>Inventory System</title>
      </Head>
      <AppSider collapsed={collapsed} onCollapse={onCollapse} />
      <AntLayout className="site-layout">
        <AppHeader />
        <AppContent>{children}</AppContent>
        <AppFooter />
      </AntLayout>
    </AntLayout>
  );
}
