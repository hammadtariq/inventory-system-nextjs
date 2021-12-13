import Head from "next/head";

import { Layout } from "antd";
import { useState } from "react";

import AppContent from "../components/content";
import AppHeader from "../components/header";
import AppFooter from "../components/footer";
import AppSider from "../components/sider";

export default function Home() {
  const [collapsed, setCollapsed] = useState(false);

  const onCollapse = (collapsed) => {
    setCollapsed(collapsed);
  };
  return <div></div>
  // return (
  //   // <Layout style={{ minHeight: "100vh" }}>
  //   //   <Head>
  //   //     <title>Inventory System</title>
  //   //   </Head>
  //   //   <AppSider collapsed={collapsed} onCollapse={onCollapse} />
  //   //   <Layout className="site-layout">
  //   //     <AppHeader />
  //   //     {/* integrate routes in Content component */}
  //   //     <AppContent />
  //   //     <AppFooter />
  //   //   </Layout>
  //   // </Layout>
  // );
}
