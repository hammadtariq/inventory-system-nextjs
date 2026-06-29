import { useState, useRef } from "react";
import Head from "next/head";
import { LazyMotion, domAnimation, m } from "framer-motion";
import styles from "@/styles/Landing.module.css";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import PublicDemoModal from "@/components/PublicDemoModal";

const TERMS_URL = "https://www.treesols.com/terms";
const TERMS_TITLE = "Terms of Service - TSO by True Refined Solutions";
const TERMS_DESCRIPTION =
  "Read the terms governing use of the TSO by True Refined Solutions business operations platform.";

const SECTIONS = [
  {
    title: "Acceptance of Terms",
    content:
      "By accessing or using the TSO platform by True Refined Solutions, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you are prohibited from using the service. These terms apply to all users, including free trial users and paid subscribers.",
  },
  {
    title: "Description of Service",
    content:
      "TSO by True Refined Solutions is a cloud-based business operations platform designed for small and medium-sized businesses (SMBs). The service includes inventory management, warehouse operations, purchase management, sales management, ledger management, reporting, AI-powered insights, and related features as described on our website. Features may be added, modified, or removed at our discretion.",
  },
  {
    title: "Account Registration",
    content:
      "You must provide accurate, complete, and current information when creating an account. You are solely responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify us immediately at legal@treesols.com if you suspect unauthorized access. Each subscription covers one business entity unless you are enrolled in a multi-company plan (Gold or Platinum). Creating multiple accounts to circumvent plan limits is prohibited.",
  },
  {
    title: "Subscription and Billing",
    content:
      "All subscriptions are prepaid for the chosen billing period (monthly, 6-month, or annual). Fees are non-refundable for partial subscription periods once charged. We reserve the right to change pricing with at least 30 days advance notice to existing subscribers. If you do not cancel before the renewal date, your subscription will automatically renew at the then-current rate. Failure to pay may result in suspension of your account.",
  },
  {
    title: "Acceptable Use",
    content:
      "You agree not to use TSO for any unlawful purpose or in violation of these terms. Prohibited activities include: attempting to gain unauthorized access to any part of the service or its infrastructure; uploading or transmitting malicious code, viruses, or any software intended to disrupt the service; reselling or sublicensing access to TSO without express written permission; scraping, crawling, or harvesting data from the platform in an automated manner; using the service to store or transmit content that is illegal, defamatory, or infringes third-party rights.",
  },
  {
    title: "Intellectual Property",
    content:
      "TSO, its name, logo, product design, underlying technology, and all associated content are the intellectual property of True Refined Solutions and are protected by applicable copyright, trademark, and other laws. You are granted a limited, non-exclusive, non-transferable license to use the service for your internal business purposes. Your data — including inventory records, customer lists, and financial entries — remains your property at all times.",
  },
  {
    title: "Data and Privacy",
    content:
      "Your use of TSO involves the collection and processing of personal and business data. How we handle that data is governed by our Privacy Policy, which is incorporated by reference into these Terms of Service. By using the service, you consent to the data practices described in the Privacy Policy.",
  },
  {
    title: "Termination",
    content:
      "We reserve the right to suspend or terminate accounts that violate these Terms of Service, engage in fraudulent activity, or present a security risk to the platform or other users. Upon termination, your access to the service will be revoked. You may export your data before cancellation. You may cancel your subscription at any time from your account settings. Cancellations take effect at the end of the current billing period.",
  },
  {
    title: "Limitation of Liability",
    content:
      "To the maximum extent permitted by applicable law, TSO by True Refined Solutions shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, loss of data, or business interruption arising from your use of or inability to use the service. In no event shall our aggregate liability exceed the total amount you paid for TSO in the three (3) months immediately preceding the event giving rise to the claim.",
  },
  {
    title: "Governing Law",
    content:
      "These Terms of Service are governed by and construed in accordance with the laws of Pakistan, without regard to conflict of law principles. Any disputes arising out of or relating to these terms or your use of TSO shall be resolved exclusively in the courts of Karachi, Pakistan. By using the service, you consent to the personal jurisdiction of such courts.",
  },
  {
    title: "Contact",
    content:
      "For questions about these Terms of Service, legal notices, or compliance matters, please contact our Legal Team at legal@treesols.com. We aim to respond to all inquiries within 5 business days.",
  },
];

export default function Terms() {
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
        <title>{TERMS_TITLE}</title>
        <meta name="description" content={TERMS_DESCRIPTION} />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={TERMS_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="TSO by True Refined Solutions" />
        <meta property="og:title" content={TERMS_TITLE} />
        <meta property="og:description" content={TERMS_DESCRIPTION} />
        <meta property="og:url" content={TERMS_URL} />
      </Head>
      <div className={styles.page}>
        <PublicNav onDemoClick={openDemo} alwaysLight hrefPrefix="/" />

        <LazyMotion features={domAnimation}>
          <main style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(80px, 10vw, 120px) 24px 100px" }}>
            <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1
                style={{
                  fontFamily: "var(--font-bricolage), sans-serif",
                  fontSize: "clamp(28px, 4vw, 40px)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  marginBottom: 16,
                  lineHeight: 1.1,
                }}
              >
                Terms of Service
              </h1>
              <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.7, marginBottom: 48 }}>
                Effective date: January 1, 2026. Please read these terms carefully before using TSO by True Refined
                Solutions. They govern your access to and use of the platform.
              </p>
            </m.div>

            {SECTIONS.map(({ title, content }, i) => (
              <m.div
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
              </m.div>
            ))}
          </main>
        </LazyMotion>

        <PublicFooter onDemoClick={openDemo} />
        <PublicDemoModal open={modalOpen} onClose={closeDemo} triggerRef={demoTriggerRef} />
      </div>
    </>
  );
}

Terms.getLayout = (page) => page;
