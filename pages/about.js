import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";

const pageStyle = {
  background: "linear-gradient(160deg, #f0f4ff 0%, #faf5ff 45%, #f0fdf4 100%)",
  minHeight: "100vh",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  color: "#1e1b4b",
};

const navStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "18px 60px",
  position: "sticky",
  top: 0,
  zIndex: 50,
  background: "rgba(255,255,255,0.65)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderBottom: "1px solid rgba(255,255,255,0.8)",
};

const logoStyle = {
  fontSize: 20,
  fontWeight: 800,
  background: "linear-gradient(135deg, #6366f1, #7c3aed)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  textDecoration: "none",
};

const ctaBtnStyle = {
  background: "linear-gradient(135deg, #6366f1, #7c3aed)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "9px 20px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
  fontFamily: "inherit",
};

const containerStyle = {
  maxWidth: 900,
  margin: "0 auto",
  padding: "60px 24px 100px",
};

const cardStyle = {
  background: "rgba(255,255,255,0.65)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.85)",
  borderRadius: 16,
  padding: "28px 32px",
  marginBottom: 16,
  boxShadow: "0 4px 20px rgba(99,102,241,0.07)",
};

const h1Style = {
  fontSize: 40,
  fontWeight: 800,
  letterSpacing: "-0.02em",
  marginBottom: 16,
  color: "#1e1b4b",
};

const leadStyle = {
  fontSize: 17,
  color: "#6b7280",
  lineHeight: 1.7,
  marginBottom: 48,
};

const h2Style = {
  fontSize: 15,
  fontWeight: 700,
  color: "#6366f1",
  marginBottom: 8,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const pStyle = {
  fontSize: 14,
  color: "#374151",
  lineHeight: 1.75,
  margin: 0,
};

const footerBarStyle = {
  textAlign: "center",
  padding: "32px 24px",
  fontSize: 13,
  color: "#9ca3af",
  borderTop: "1px solid rgba(0,0,0,0.06)",
};

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
  return (
    <>
      <Head>
        <title>About StockFlow — Built for Businesses That Mean Business</title>
        <meta
          name="description"
          content="Learn how StockFlow helps South Asian SMBs manage inventory, orders, and accounting in one place."
        />
      </Head>
      <div style={pageStyle}>
        {/* Mini Nav */}
        <nav style={navStyle}>
          <Link href="/landing" style={logoStyle}>
            ⬡ StockFlow
          </Link>
          <Link href="/landing" style={ctaBtnStyle}>
            Request a Demo
          </Link>
        </nav>

        {/* Main Content */}
        <motion.div
          style={containerStyle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Hero Block */}
          <div style={{ marginBottom: 56 }}>
            <h1 style={h1Style}>Built for Businesses That Mean Business</h1>
            <p style={leadStyle}>
              StockFlow is an all-in-one inventory and operations platform built specifically for South Asian SMBs. We
              believe that growing businesses deserve the same powerful tools as large enterprises — without the
              enterprise price tag or complexity. From tracking stock levels to reconciling payments, StockFlow handles
              the operational heavy lifting so you can focus on what matters: running your business.
            </p>
          </div>

          {/* Value Props Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              marginBottom: 64,
            }}
          >
            {VALUE_PROPS.map(({ title, desc }, i) => (
              <motion.div
                key={title}
                style={cardStyle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * (i + 1) }}
              >
                <p style={h2Style}>{title}</p>
                <p style={pStyle}>{desc}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA Section */}
          <motion.div
            style={{
              ...cardStyle,
              textAlign: "center",
              padding: "48px 40px",
              background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(124,58,237,0.08) 100%)",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#1e1b4b",
                marginBottom: 12,
                letterSpacing: "-0.02em",
              }}
            >
              Ready to see it in action?
            </h2>
            <p style={{ ...leadStyle, marginBottom: 28 }}>
              Join hundreds of businesses already running smarter with StockFlow.
            </p>
            <Link href="/landing" style={{ ...ctaBtnStyle, fontSize: 15, padding: "12px 28px" }}>
              Request a Demo →
            </Link>
          </motion.div>
        </motion.div>

        {/* Footer Bar */}
        <div style={footerBarStyle}>
          © 2026 StockFlow &nbsp;·&nbsp;{" "}
          <Link href="/landing" style={{ color: "#6366f1", textDecoration: "none" }}>
            Back to Home
          </Link>
        </div>
      </div>
    </>
  );
}

About.getLayout = (page) => page;
