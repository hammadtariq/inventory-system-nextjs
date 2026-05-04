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
  maxWidth: 760,
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

const SECTIONS = [
  {
    title: "Introduction",
    content:
      'StockFlow ("we", "us", or "our") operates the StockFlow inventory management platform accessible at stockflow.app. This Privacy Policy explains how we collect, use, store, and protect your personal data when you use our services. By using StockFlow, you agree to the practices described in this policy.',
  },
  {
    title: "Information We Collect",
    content:
      "We collect the following categories of information: (1) Account information — your name, email address, company name, and role when you register; (2) Usage data — pages visited, features used, session duration, and click patterns to improve the product experience; (3) Payment information — billing details for subscription processing. Payment data is handled entirely by PCI-compliant third-party providers (such as Stripe). We do not store full card numbers or payment credentials on our servers.",
  },
  {
    title: "How We Use Your Information",
    content:
      "We use your information to: provide, maintain, and improve the StockFlow service; send transactional and account-related emails (invoices, password resets, security alerts); respond to support requests and resolve issues; analyze usage patterns to guide product development; comply with legal obligations and enforce our Terms of Service.",
  },
  {
    title: "Data Storage and Security",
    content:
      "Your data is stored on encrypted servers hosted in secure data centers. We use industry-standard TLS encryption for all data in transit. Data at rest is encrypted using AES-256. We conduct regular security audits and vulnerability assessments. Access to production data is restricted to authorized personnel only, under strict need-to-know policies.",
  },
  {
    title: "Data Sharing",
    content:
      "We do not sell, rent, or trade your personal data to third parties. We may share data with trusted service providers (such as cloud hosting and payment processors) who process data on our behalf under data processing agreements that comply with applicable privacy laws. We may disclose data if required by law, court order, or to protect the rights and safety of StockFlow and its users.",
  },
  {
    title: "Your Rights (GDPR)",
    content:
      "If you are located in the European Economic Area or another jurisdiction with applicable privacy laws, you have the following rights: the right to access a copy of your personal data; the right to correct inaccurate data; the right to request deletion of your data (subject to legal retention requirements); the right to restrict or object to processing; the right to data portability. To exercise any of these rights, contact us at privacy@stockflow.app. We will respond within 30 days.",
  },
  {
    title: "Data Retention",
    content:
      "We retain your account data for the duration of your active subscription. Upon cancellation, your data is retained for 90 days to allow for reactivation or export, after which it is permanently deleted from our systems. Anonymized, aggregated usage statistics may be retained indefinitely for product analytics.",
  },
  {
    title: "Cookies",
    content:
      "We use essential cookies for authentication session management and user preference storage. We do not use third-party advertising cookies or sell data to ad networks. You may configure your browser to refuse cookies, but this may affect your ability to log in and use the service.",
  },
  {
    title: "Changes to This Policy",
    content:
      "We reserve the right to update this Privacy Policy as our practices evolve or legal requirements change. For material changes, we will notify registered users via email at least 30 days before the changes take effect. Continued use of the service after the effective date constitutes acceptance of the updated policy.",
  },
  {
    title: "Contact",
    content:
      "For privacy-related inquiries, data access requests, or to report a concern, please contact our Privacy Team at privacy@stockflow.app. We aim to respond to all inquiries within 5 business days.",
  },
];

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy — StockFlow</title>
        <meta
          name="description"
          content="Learn how StockFlow collects, uses, and protects your data. GDPR-compliant privacy policy."
        />
      </Head>
      <div style={pageStyle}>
        {/* Mini Nav */}
        <nav style={navStyle}>
          <Link href="/landing" style={logoStyle}>
            ⬡ StockFlow
          </Link>
          <Link href="/landing" style={ctaBtnStyle}>
            Back to Home
          </Link>
        </nav>

        {/* Main Content */}
        <motion.div
          style={containerStyle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <h1 style={h1Style}>Privacy Policy</h1>
            <p style={leadStyle}>
              Effective date: January 1, 2026. This policy describes how StockFlow collects, uses, and safeguards your
              personal information.
            </p>
          </div>

          {/* Sections */}
          {SECTIONS.map(({ title, content }, i) => (
            <motion.div
              key={title}
              style={cardStyle}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * i }}
            >
              <p style={h2Style}>{title}</p>
              <p style={pStyle}>{content}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer Bar */}
        <div style={footerBarStyle}>
          © 2026 StockFlow &nbsp;·&nbsp;{" "}
          <Link href="/landing" style={{ color: "#6366f1", textDecoration: "none" }}>
            Back to Home
          </Link>
          &nbsp;·&nbsp;{" "}
          <Link href="/terms" style={{ color: "#6366f1", textDecoration: "none" }}>
            Terms of Service
          </Link>
        </div>
      </div>
    </>
  );
}

Privacy.getLayout = (page) => page;
