import { useState, useRef } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import styles from "@/styles/Landing.module.css";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import PublicDemoModal from "@/components/PublicDemoModal";

const ABOUT_URL = "https://www.treesols.com/about";
const ABOUT_TITLE = "About TSO by TRS - Inventory Software for South Asian SMBs";
const ABOUT_DESCRIPTION =
  "Learn how TSO by TRS helps South Asian SMBs manage inventory, purchases, sales, ledgers, and reporting in one place.";

const VALUE_PROPS = [
  {
    title: "Built for South Asia",
    desc: "GST-ready, supports PKR and INR, and designed around how local businesses actually operate — from wholesale traders in Karachi to retail distributors in Mumbai.",
  },
  {
    title: "Everything in One Place",
    desc: "Inventory, purchases, sales, ledger, and reporting — all connected. Stop juggling spreadsheets, separate accounting tools, and WhatsApp threads.",
  },
  {
    title: "Simple Enough for Any Team",
    desc: "No accountant or IT team required. Most businesses are fully operational within days, not months. Clean UI, sensible defaults, zero fluff.",
  },
];

export default function About() {
  const [modalOpen, setModalOpen] = useState(false);
  const demoTriggerRef = useRef(null);

  const openDemo = () => {
    demoTriggerRef.current = document.activeElement;
    setModalOpen(true);
  };
  const closeDemo = () => setModalOpen(false);

  return (
    <>
      <Head>
        <title>{ABOUT_TITLE}</title>
        <meta name="description" content={ABOUT_DESCRIPTION} />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={ABOUT_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="TSO by TRS" />
        <meta property="og:title" content={ABOUT_TITLE} />
        <meta property="og:description" content={ABOUT_DESCRIPTION} />
        <meta property="og:url" content={ABOUT_URL} />
      </Head>
      <div className={styles.page}>
        <PublicNav onDemoClick={openDemo} alwaysLight hrefPrefix="/" />

        <main style={{ maxWidth: 900, margin: "0 auto", padding: "clamp(80px, 10vw, 120px) 24px 100px" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontSize: "clamp(32px, 5vw, 48px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                marginBottom: 16,
                lineHeight: 1.1,
              }}
            >
              Built for Businesses That Mean Business
            </h1>
            <p
              style={{
                fontSize: 17,
                color: "var(--ink-2)",
                lineHeight: 1.75,
                marginBottom: 56,
                maxWidth: 680,
              }}
            >
              TSO is an all-in-one inventory and operations platform built specifically for South Asian SMBs. We believe
              that growing businesses deserve the same powerful tools as large enterprises — without the enterprise
              price tag or complexity. From tracking stock levels to reconciling payments, TSO handles the operational
              heavy lifting so you can focus on what matters: running your business.
            </p>
          </motion.div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 24,
              marginBottom: 72,
            }}
          >
            {VALUE_PROPS.map(({ title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * (i + 1) }}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "24px 28px",
                }}
              >
                <p
                  style={{
                    fontFamily: '"Bricolage Grotesque", sans-serif',
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--ink-1)",
                    letterSpacing: "-0.015em",
                    marginBottom: 8,
                    marginTop: 0,
                  }}
                >
                  {title}
                </p>
                <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.75, margin: 0 }}>{desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{
              background: "var(--accent-muted)",
              border: "1px solid var(--border-mid)",
              borderRadius: 12,
              padding: "clamp(36px, 5vw, 56px) clamp(28px, 5vw, 48px)",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontSize: "clamp(22px, 3vw, 30px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                marginBottom: 12,
              }}
            >
              Ready to see it in action?
            </h2>
            <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.65, marginBottom: 28 }}>
              Join hundreds of businesses already running smarter with TSO by TRS.
            </p>
            <button className={styles.btnPrimaryLg} onClick={openDemo}>
              Request a demo →
            </button>
          </motion.div>
        </main>

        <PublicFooter onDemoClick={openDemo} />
        <PublicDemoModal open={modalOpen} onClose={closeDemo} triggerRef={demoTriggerRef} />
      </div>
    </>
  );
}

About.getLayout = (page) => page;
