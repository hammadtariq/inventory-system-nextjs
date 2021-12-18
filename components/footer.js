import { Layout } from "antd";

import css from "@/styles/Footer.module.css";

const { Footer } = Layout;

export default function AppFooter() {
  return <Footer className={css.footer}>Inventory System ©{new Date().getFullYear()}</Footer>;
}
