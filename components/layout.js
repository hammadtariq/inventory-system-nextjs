import Head from "next/head";
import { Layout as AntLayout } from "antd";

import AppContent from "@/components/content";
import AppFooter from "@/components/footer";
import AppHeader from "@/components/header";
import styles from "@/styles/Layout.module.css";

export default function Layout({ children }) {
  return (
    <AntLayout className={styles.antLayout}>
      <Head>
        <title>Inventory System</title>
      </Head>
      <AntLayout className="site-layout">
        <AppHeader />
        <AppContent>{children}</AppContent>
        <AppFooter />
      </AntLayout>
    </AntLayout>
  );
}
