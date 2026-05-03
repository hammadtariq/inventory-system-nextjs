import { useState } from "react";
import Head from "next/head";
import styles from "@/styles/Landing.module.css";

function Nav({ onDemoClick }) {
  return (
    <nav className={styles.nav}>
      <a href="#hero" className={styles.logo}>
        ⬡ StockFlow
      </a>
      <div className={styles.navLinks}>
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <a href="#testimonials">Testimonials</a>
        <a href="#faq">FAQ</a>
      </div>
      <button className={styles.navCta} onClick={onDemoClick}>
        Request a Demo
      </button>
    </nav>
  );
}

export default function Landing() {
  const [modalOpen, setModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <>
      <Head>
        <title>StockFlow — Inventory Management for Modern Businesses</title>
        <meta
          name="description"
          content="StockFlow brings real-time inventory tracking, integrated accounting, and smart order management for SMBs."
        />
      </Head>
      <div className={styles.page}>
        <Nav onDemoClick={() => setModalOpen(true)} />
        <p style={{ padding: "40px 60px", color: "#6b7280" }}>Sections coming soon...</p>
      </div>
    </>
  );
}

Landing.getLayout = (page) => page;
