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
    title: "Acceptance of Terms",
    content:
      "By accessing or using the StockFlow platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you are prohibited from using the service. These terms apply to all users, including free trial users and paid subscribers.",
  },
  {
    title: "Description of Service",
    content:
      "StockFlow is a cloud-based inventory and accounting management platform designed for small and medium-sized businesses (SMBs). The service includes real-time inventory tracking, purchase order management, sales management, double-entry ledger accounting, reporting and analytics, and related features as described on our website. Features may be added, modified, or removed at our discretion.",
  },
  {
    title: "Account Registration",
    content:
      "You must provide accurate, complete, and current information when creating an account. You are solely responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify us immediately at legal@stockflow.app if you suspect unauthorized access. Each subscription covers one business entity unless you are enrolled in a multi-company plan (Gold or Platinum). Creating multiple accounts to circumvent plan limits is prohibited.",
  },
  {
    title: "Subscription and Billing",
    content:
      "All subscriptions are prepaid for the chosen billing period (monthly, 6-month, or annual). Fees are non-refundable for partial subscription periods once charged. We reserve the right to change pricing with at least 30 days advance notice to existing subscribers. If you do not cancel before the renewal date, your subscription will automatically renew at the then-current rate. Failure to pay may result in suspension of your account.",
  },
  {
    title: "Acceptable Use",
    content:
      "You agree not to use StockFlow for any unlawful purpose or in violation of these terms. Prohibited activities include: attempting to gain unauthorized access to any part of the service or its infrastructure; uploading or transmitting malicious code, viruses, or any software intended to disrupt the service; reselling or sublicensing access to StockFlow without express written permission; scraping, crawling, or harvesting data from the platform in an automated manner; using the service to store or transmit content that is illegal, defamatory, or infringes third-party rights.",
  },
  {
    title: "Intellectual Property",
    content:
      "StockFlow, its name, logo, product design, underlying technology, and all associated content are the intellectual property of StockFlow and are protected by applicable copyright, trademark, and other laws. You are granted a limited, non-exclusive, non-transferable license to use the service for your internal business purposes. Your data — including inventory records, customer lists, and financial entries — remains your property at all times.",
  },
  {
    title: "Data and Privacy",
    content:
      "Your use of StockFlow involves the collection and processing of personal and business data. How we handle that data is governed by our Privacy Policy, which is incorporated by reference into these Terms of Service. By using the service, you consent to the data practices described in the Privacy Policy.",
  },
  {
    title: "Termination",
    content:
      "We reserve the right to suspend or terminate accounts that violate these Terms of Service, engage in fraudulent activity, or present a security risk to the platform or other users. Upon termination, your access to the service will be revoked. You may export your data before cancellation. You may cancel your subscription at any time from your account settings. Cancellations take effect at the end of the current billing period.",
  },
  {
    title: "Limitation of Liability",
    content:
      "To the maximum extent permitted by applicable law, StockFlow shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, loss of data, or business interruption arising from your use of or inability to use the service. In no event shall our aggregate liability exceed the total amount you paid to StockFlow in the three (3) months immediately preceding the event giving rise to the claim.",
  },
  {
    title: "Governing Law",
    content:
      "These Terms of Service are governed by and construed in accordance with the laws of Pakistan, without regard to conflict of law principles. Any disputes arising out of or relating to these terms or your use of StockFlow shall be resolved exclusively in the courts of Karachi, Pakistan. By using the service, you consent to the personal jurisdiction of such courts.",
  },
  {
    title: "Contact",
    content:
      "For questions about these Terms of Service, legal notices, or compliance matters, please contact our Legal Team at legal@stockflow.app. We aim to respond to all inquiries within 5 business days.",
  },
];

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service — StockFlow</title>
        <meta
          name="description"
          content="StockFlow Terms of Service — the rules governing your use of the StockFlow inventory management platform."
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
            <h1 style={h1Style}>Terms of Service</h1>
            <p style={leadStyle}>
              Effective date: January 1, 2026. Please read these terms carefully before using StockFlow. They govern
              your access to and use of the platform.
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
          <Link href="/privacy" style={{ color: "#6366f1", textDecoration: "none" }}>
            Privacy Policy
          </Link>
        </div>
      </div>
    </>
  );
}

Terms.getLayout = (page) => page;
