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

const STATS = [
  { val: "₨12.4M", lbl: "Total Sales" },
  { val: "₨8.1M", lbl: "Total Purchases" },
  { val: "2,840", lbl: "Items in Stock" },
  { val: "98.2%", lbl: "Order Accuracy" },
];

function Hero({ onDemoClick }) {
  return (
    <section className={styles.hero} id="hero">
      <div className={styles.heroBadge}>✦ Inventory Management for Modern Businesses</div>
      <h1 className={styles.heroHeading}>
        Run Your Inventory
        <br />
        <span className={styles.heroGradient}>Smarter, Faster,</span>
        <br />
        With Confidence.
      </h1>
      <p className={styles.heroSub}>
        StockFlow brings real-time inventory tracking, integrated accounting, and smart order management, all in one
        clean dashboard.
      </p>
      <div className={styles.heroCtaRow}>
        <button className={styles.btnPrimary} onClick={onDemoClick}>
          Request a Demo <span aria-hidden="true">→</span>
        </button>
        <a href="#pricing" className={styles.btnSecondary}>
          See Pricing
        </a>
      </div>
      <div className={styles.heroCard}>
        <div className={styles.heroCardHeader}>
          <span className={`${styles.dot} ${styles.dotRed}`} aria-hidden="true" />
          <span className={`${styles.dot} ${styles.dotYellow}`} aria-hidden="true" />
          <span className={`${styles.dot} ${styles.dotGreen}`} aria-hidden="true" />
        </div>
        <div className={styles.cardStats}>
          {STATS.map(({ val, lbl }) => (
            <div key={lbl} className={styles.statChip}>
              <div className={styles.statVal}>{val}</div>
              <div className={styles.statLbl}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
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
        <Hero onDemoClick={() => setModalOpen(true)} />
      </div>
    </>
  );
}

Landing.getLayout = (page) => page;
