import { useState, useRef } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import styles from "@/styles/Landing.module.css";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import PublicDemoModal from "@/components/PublicDemoModal";

const ABOUT_URL = "https://www.treesols.com/about";
const TRUE_REFINED_URL = "https://truerefinedsolutions.com";
const ABOUT_TITLE = "About TSO by True Refined Solutions";
const ABOUT_DESCRIPTION =
  "Learn how TSO by True Refined Solutions helps Asian businesses manage inventory, warehouse operations, purchases, sales, ledgers, reports, and AI-powered insights.";

const VALUE_PROPS = [
  {
    title: "A True Refined Solutions Product",
    desc: "TSO is built, owned, and maintained by True Refined Solutions as a SaaS product platform for Asian business operations.",
  },
  {
    title: "Operations in One Place",
    desc: "Inventory, warehouse activity, purchases, sales, ledgers, reports, and AI-powered insights stay connected.",
  },
  {
    title: "Built for Future Modules",
    desc: "The platform is positioned beyond stock control, with room for additional business modules as customer needs grow.",
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
        <meta property="og:site_name" content="TSO by True Refined Solutions" />
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
              About TSO by True Refined Solutions
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
              TSO is a SaaS business operations platform for Asian businesses managing inventory, warehouse operations,
              purchases, sales, ledgers, reports, and AI-powered insights. It is designed and maintained by True Refined
              Solutions, the software development company behind the product.
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
              Need a custom system for your business?
            </h2>
            <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.65, marginBottom: 28 }}>
              Work with True Refined Solutions for custom web apps, SaaS platforms, inventory systems, and AI-powered
              business automation.
            </p>
            <a href={TRUE_REFINED_URL} target="_blank" rel="noopener noreferrer" className={styles.btnPrimaryLg}>
              Work with True Refined Solutions
            </a>
          </motion.div>
        </main>

        <PublicFooter onDemoClick={openDemo} />
        <PublicDemoModal open={modalOpen} onClose={closeDemo} triggerRef={demoTriggerRef} />
      </div>
    </>
  );
}

About.getLayout = (page) => page;
