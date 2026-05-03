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

const FEATURES = [
  {
    icon: "📦",
    color: "iconPurple",
    title: "Real-Time Inventory",
    desc: "Live stock levels, product tracking, and smart allocation across all your locations.",
  },
  {
    icon: "🧾",
    color: "iconViolet",
    title: "Purchase Orders",
    desc: "Supplier management, order approval workflows, and full purchase history at a glance.",
  },
  {
    icon: "💰",
    color: "iconGreen",
    title: "Integrated Ledger",
    desc: "Double-entry accounting built in, not bolted on. Payables, receivables, reconciliation.",
  },
  {
    icon: "📊",
    color: "iconBlue",
    title: "Reports and Analytics",
    desc: "Sales vs purchases charts, top products, customer distribution, and export to CSV or Excel.",
  },
  {
    icon: "🏢",
    color: "iconOrange",
    title: "Multi-Company Support",
    desc: "Manage multiple business entities from one dashboard with role-based access control.",
  },
  {
    icon: "🤖",
    color: "iconPink",
    title: "AI Assistant",
    desc: "Ask your inventory questions in plain language. Get instant insights without digging through reports.",
  },
];

function Features() {
  return (
    <section className={styles.section} id="features">
      <p className={styles.sectionLabel}>What You Get</p>
      <h2 className={styles.sectionHeading}>
        Everything your business needs
        <br />
        in one place
      </h2>
      <p className={styles.sectionSub}>
        From purchase orders to financial reconciliation, StockFlow handles the complexity so you can focus on growth.
      </p>
      <div className={styles.featuresGrid}>
        {FEATURES.map(({ icon, color, title, desc }) => (
          <div key={title} className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles[color]}`}>{icon}</div>
            <h3 className={styles.featureTitle}>{title}</h3>
            <p className={styles.featureDesc}>{desc}</p>
          </div>
        ))}
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
        <Features />
      </div>
    </>
  );
}

Landing.getLayout = (page) => page;
