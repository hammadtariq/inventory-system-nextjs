"use client";
import Head from "next/head";
import { useState } from "react";
import { Layout as AntLayout } from "antd";

import AppContent from "@/components/content";
// import AppFooter from "@/components/footer";
import AppSider from "@/components/appSider";

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <Head>
        <title>Inventory System</title>
      </Head>
      <AntLayout className="site-layout">
        <AppSider collapsed={collapsed} onCollapseChange={setCollapsed} />
        <AntLayout
          className="site-layout"
          style={{
            marginLeft: collapsed ? 60 : 250,
            transition: "margin-left 0.2s ease-in-out",
          }}
        >
          <AppContent>{children}</AppContent>
          {/* <AppFooter /> */}
        </AntLayout>
      </AntLayout>
    </>
  );
}
