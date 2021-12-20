import { Layout } from "antd";

import styles from "@/styles/Footer.module.css";

const { Footer } = Layout;

export default function AppFooter() {
  return <Footer className={styles.footer}>Inventory System ©{new Date().getFullYear()}</Footer>;
}
