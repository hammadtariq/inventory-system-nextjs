import { Layout } from "antd";
import { useClientNow } from "@/hooks/useClientNow";

import styles from "@/styles/Footer.module.css";

const { Footer } = Layout;

export default function AppFooter() {
  const currentTime = useClientNow();
  const year = currentTime === null ? "" : new Date(currentTime).getFullYear();

  return <Footer className={styles.footer}>Inventory System ©{year}</Footer>;
}
