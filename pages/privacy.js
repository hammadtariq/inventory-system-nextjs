import { useState, useRef } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import styles from "@/styles/Landing.module.css";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import PublicDemoModal from "@/components/PublicDemoModal";

const PRIVACY_URL = "https://www.treesols.com/privacy";
const PRIVACY_TITLE = "Privacy Policy - TSO by True Refined Solutions";
const PRIVACY_DESCRIPTION =
  "Learn how TSO by True Refined Solutions collects, uses, stores, and protects data for its business operations platform.";

const SECTIONS = [
  {
    title: "Introduction",
    content:
      'TSO by True Refined Solutions ("we", "us", or "our") operates the TSO business operations platform accessible at treesols.com. This Privacy Policy explains how we collect, use, store, and protect your personal data when you use our services. By using TSO, you agree to the practices described in this policy.',
  },
  {
    title: "Information We Collect",
    content:
      "We collect the following categories of information: (1) Account information — your name, email address, company name, and role when you register; (2) Usage data — pages visited, features used, session duration, and click patterns to improve the product experience; (3) Payment information — billing details for subscription processing. Payment data is handled entirely by PCI-compliant third-party providers (such as Stripe). We do not store full card numbers or payment credentials on our servers.",
  },
  {
    title: "How We Use Your Information",
    content:
      "We use your information to: provide, maintain, and improve the TSO service; send transactional and account-related emails (invoices, password resets, security alerts); respond to support requests and resolve issues; analyze usage patterns to guide product development; comply with legal obligations and enforce our Terms of Service.",
  },
  {
    title: "Data Storage and Security",
    content:
      "Your data is stored on encrypted servers hosted in secure data centers. We use industry-standard TLS encryption for all data in transit. Data at rest is encrypted using AES-256. We conduct regular security audits and vulnerability assessments. Access to production data is restricted to authorized personnel only, under strict need-to-know policies.",
  },
  {
    title: "Data Sharing",
    content:
      "We do not sell, rent, or trade your personal data to third parties. We may share data with trusted service providers (such as cloud hosting and payment processors) who process data on our behalf under data processing agreements that comply with applicable privacy laws. We may disclose data if required by law, court order, or to protect the rights and safety of TSO, True Refined Solutions, and platform users.",
  },
  {
    title: "Your Rights (GDPR)",
    content:
      "If you are located in the European Economic Area or another jurisdiction with applicable privacy laws, you have the following rights: the right to access a copy of your personal data; the right to correct inaccurate data; the right to request deletion of your data (subject to legal retention requirements); the right to restrict or object to processing; the right to data portability. To exercise any of these rights, contact us at privacy@treesols.com. We will respond within 30 days.",
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
      "For privacy-related inquiries, data access requests, or to report a concern, please contact our Privacy Team at privacy@treesols.com. We aim to respond to all inquiries within 5 business days.",
  },
];

export default function Privacy() {
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
        <title>{PRIVACY_TITLE}</title>
        <meta name="description" content={PRIVACY_DESCRIPTION} />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={PRIVACY_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="TSO by True Refined Solutions" />
        <meta property="og:title" content={PRIVACY_TITLE} />
        <meta property="og:description" content={PRIVACY_DESCRIPTION} />
        <meta property="og:url" content={PRIVACY_URL} />
      </Head>
      <div className={styles.page}>
        <PublicNav onDemoClick={openDemo} alwaysLight hrefPrefix="/" />

        <main style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(80px, 10vw, 120px) 24px 100px" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                marginBottom: 16,
                lineHeight: 1.1,
              }}
            >
              Privacy Policy
            </h1>
            <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.7, marginBottom: 48 }}>
              Effective date: January 1, 2026. This policy describes how TSO by True Refined Solutions collects, uses,
              and safeguards your personal information.
            </p>
          </motion.div>

          {SECTIONS.map(({ title, content }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * i }}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "24px 28px",
                marginBottom: 12,
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--ink-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                }}
              >
                {title}
              </p>
              <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.75, margin: 0 }}>{content}</p>
            </motion.div>
          ))}
        </main>

        <PublicFooter onDemoClick={openDemo} />
        <PublicDemoModal open={modalOpen} onClose={closeDemo} triggerRef={demoTriggerRef} />
      </div>
    </>
  );
}

Privacy.getLayout = (page) => page;
