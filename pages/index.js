import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import styles from "@/styles/Landing.module.css";
import { motion, AnimatePresence } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function Nav({ onDemoClick }) {
  return (
    <nav className={styles.nav}>
      <a href="#hero" className={styles.logo}>
        <img
          src="/only-shape-no-bg.png"
          alt="StockFlow logo"
          style={{ height: 40, width: 40, marginRight: 2, verticalAlign: "middle" }}
        />
        StockFlow
      </a>
      <div className={styles.navLinks}>
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <a href="#testimonials">Testimonials</a>
        <a href="#faq">FAQ</a>
      </div>
      <div className={styles.navActions}>
        <Link href="/login" className={styles.navLoginBtn}>
          Login
        </Link>
        <motion.button className={styles.navCta} onClick={onDemoClick} whileTap={{ scale: 0.97 }}>
          Request a Demo
        </motion.button>
      </div>
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
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp} className={styles.heroBadge}>
          ✦ Inventory Management for Modern Businesses
        </motion.div>
        <motion.h1 variants={fadeUp} className={styles.heroHeading}>
          Run Your Inventory
          <br />
          <span className={styles.heroGradient}>Smarter, Faster,</span>
          <br />
          With Confidence.
        </motion.h1>
        <motion.p variants={fadeUp} className={styles.heroSub}>
          StockFlow brings real-time inventory tracking, integrated accounting, and smart order management, all in one
          clean dashboard.
        </motion.p>
        <motion.div variants={fadeUp} className={styles.heroCtaRow}>
          <motion.button
            className={styles.btnPrimary}
            onClick={onDemoClick}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Request a Demo <span aria-hidden="true">→</span>
          </motion.button>
          <motion.a
            href="#pricing"
            className={styles.btnSecondary}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            See Pricing
          </motion.a>
        </motion.div>
        <motion.div variants={fadeUp} className={styles.heroCard}>
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
        </motion.div>
      </motion.div>
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
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <p className={styles.sectionLabel}>What You Get</p>
        <h2 className={styles.sectionHeading}>
          Everything your business needs
          <br />
          in one place
        </h2>
        <p className={styles.sectionSub}>
          From purchase orders to financial reconciliation, StockFlow handles the complexity so you can focus on growth.
        </p>
      </motion.div>
      <motion.div
        className={styles.featuresGrid}
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {FEATURES.map(({ icon, color, title, desc }) => (
          <motion.div
            key={title}
            className={styles.featureCard}
            variants={fadeUp}
            whileHover={{ y: -6, boxShadow: "0 12px 40px rgba(99,102,241,0.15)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className={`${styles.featureIcon} ${styles[color]}`}>{icon}</div>
            <h3 className={styles.featureTitle}>{title}</h3>
            <p className={styles.featureDesc}>{desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

const TESTIMONIALS = [
  {
    quote: "StockFlow saved us 15 hours a week on reconciliation. GST compliance is finally stress-free.",
    name: "Ali Hassan",
    role: "Finance Manager, Karachi",
    initial: "A",
    avatarClass: "avatarA",
  },
  {
    quote: "We cut inventory costs by 20% in the first quarter. The real-time visibility is a game-changer.",
    name: "Omar Shaikh",
    role: "Operations Lead, Lahore",
    initial: "O",
    avatarClass: "avatarB",
  },
  {
    quote: "As a founder wearing all hats, StockFlow lets me run the whole business from my phone.",
    name: "Fatima Malik",
    role: "Founder, Islamabad",
    initial: "F",
    avatarClass: "avatarC",
  },
];

function Testimonials() {
  return (
    <section className={styles.section} id="testimonials">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <p className={styles.sectionLabel}>Customer Stories</p>
        <h2 className={styles.sectionHeading}>
          Trusted by businesses
          <br />
          across South Asia
        </h2>
      </motion.div>
      <motion.div
        className={styles.testimonialsGrid}
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {TESTIMONIALS.map(({ quote, name, role, initial, avatarClass }) => (
          <motion.div
            key={name}
            className={styles.testimonialCard}
            variants={fadeUp}
            whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.1)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className={styles.stars}>★★★★★</div>
            <p className={styles.testimonialQuote}>&ldquo;{quote}&rdquo;</p>
            <div className={styles.author}>
              <div className={`${styles.avatar} ${styles[avatarClass]}`}>{initial}</div>
              <div>
                <div className={styles.authorName}>{name}</div>
                <div className={styles.authorRole}>{role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

const PLANS = [
  {
    tier: "🥈 Silver",
    style: "planSilver",
    tierClass: "planTier",
    btnClass: "btnOutlinePlan",
    btnLabel: "Get Started",
    price: "$20",
    period: "/mo",
    desc: "Perfect for small teams getting started",
    features: ["1 Company", "Up to 5 Users", "Inventory and Orders", "Basic Reports", "Email Support"],
  },
  {
    tier: "🥇 Gold",
    style: "planGold",
    tierClass: "planTierGold",
    btnClass: "btnFillPlan",
    btnLabel: "Request a Demo",
    popular: true,
    price: "$100",
    period: "/6 mo",
    desc: "Save 17%. Best for growing businesses.",
    features: [
      "3 Companies",
      "Up to 15 Users",
      "Advanced Reporting",
      "Ledger and Cheques",
      "Priority Support",
      "CSV and Excel Exports",
    ],
  },
  {
    tier: "💎 Platinum",
    style: "planPlatinum",
    tierClass: "planTier",
    btnClass: "btnGhostPlan",
    btnLabel: "Request a Demo",
    price: "$150",
    period: "/yr",
    desc: "Best value. Save 38% annually.",
    features: [
      "Unlimited Companies",
      "Unlimited Users",
      "All Gold Features",
      "AI Assistant",
      "Dedicated Onboarding",
      "99.9% SLA",
    ],
  },
];

const TOGGLE_LABELS = ["Monthly", "6 Months", "Annual"];

function Pricing({ onDemoClick }) {
  const [active, setActive] = useState(0);

  return (
    <motion.section
      className={styles.section}
      id="pricing"
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className={styles.pricingBg}>
        <p className={styles.sectionLabel}>Simple Pricing</p>
        <h2 className={styles.sectionHeading}>
          Choose the plan that fits
          <br />
          your business
        </h2>
        <p className={styles.sectionSub}>No hidden fees. Cancel anytime. Switch plans as you grow.</p>
        <div className={styles.toggleWrap}>
          <div className={styles.planToggle}>
            {TOGGLE_LABELS.map((label, i) => (
              <button
                key={label}
                className={`${styles.planToggleBtn} ${active === i ? styles.planToggleActive : ""}`}
                onClick={() => setActive(i)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <motion.div
          className={styles.pricingGrid}
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {PLANS.map((plan) => (
            <motion.div
              key={plan.tier}
              className={`${styles.planCard} ${styles[plan.style]}`}
              variants={fadeUp}
              whileHover={{ y: -6, boxShadow: "0 20px 50px rgba(99,102,241,0.18)" }}
              transition={{ type: "spring", stiffness: 280, damping: 20 }}
            >
              {plan.popular && <div className={styles.popularBadge}>⭐ Most Popular</div>}
              <p className={`${styles.planTier} ${styles[plan.tierClass] ?? ""}`}>{plan.tier}</p>
              <div className={styles.planPrice}>
                <sup className={styles.planPriceSup}>$</sup>
                {plan.price.replace("$", "")}
                <sub className={styles.planPriceSub}>{plan.period}</sub>
              </div>
              <p className={styles.planDesc}>{plan.desc}</p>
              <ul className={styles.planFeatures}>
                {plan.features.map((f) => (
                  <li key={f} className={styles.planFeatureItem}>
                    {f}
                  </li>
                ))}
              </ul>
              <motion.button
                className={`${styles.planBtn} ${styles[plan.btnClass]}`}
                onClick={onDemoClick}
                whileTap={{ scale: 0.97 }}
              >
                {plan.btnLabel}
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

const FAQS = [
  {
    q: "Can I manage multiple companies under one account?",
    a: "Yes. Gold and Platinum plans support multiple business entities from a single dashboard, each with isolated data and user roles.",
  },
  {
    q: "How secure is my business data?",
    a: "Your data is encrypted in transit and at rest. We follow OWASP security standards and conduct regular audits.",
  },
  {
    q: "Can I cancel or switch plans anytime?",
    a: "Absolutely. Upgrade, downgrade, or cancel at any time. No lock-in contracts, no cancellation fees.",
  },
  {
    q: "How long does onboarding take?",
    a: "Most businesses are up and running within a week. Platinum customers get dedicated onboarding support.",
  },
];

const LANDING_URL = "https://www.treesols.com/";
const LANDING_TITLE = "StockFlow — Inventory Management for Modern Businesses";
const LANDING_DESCRIPTION =
  "StockFlow brings real-time inventory tracking, integrated accounting, and smart order management for SMBs.";

const landingStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "StockFlow",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: LANDING_URL,
    description: LANDING_DESCRIPTION,
    offers: PLANS.map((plan) => ({
      "@type": "Offer",
      name: plan.tier.replace(/[^\w\s]/g, "").trim(),
      price: plan.price.replace("$", ""),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `https://www.treesols.com/#pricing`,
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "StockFlow",
    url: "https://www.treesols.com",
    description: "Inventory, accounting, purchasing, sales, ledger, and reporting software for growing SMBs.",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: a,
      },
    })),
  },
];

function Faq({ openFaq, setOpenFaq }) {
  return (
    <motion.section
      className={styles.section}
      id="faq"
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <p className={styles.sectionLabel}>FAQ</p>
      <h2 className={styles.sectionHeading}>Common questions</h2>
      <div className={styles.faqList}>
        {FAQS.map(({ q, a }) => {
          const isOpen = openFaq === q;
          return (
            <div key={q} className={styles.faqItem}>
              <button className={styles.faqToggle} onClick={() => setOpenFaq(isOpen ? null : q)}>
                <span className={styles.faqQuestion}>{q}</span>
                <span className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ""}`}>›</span>
              </button>
              <div className={`${styles.faqBody} ${isOpen ? styles.faqBodyOpen : ""}`}>
                <p className={styles.faqAnswer}>{a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

function FinalCta({ onDemoClick }) {
  return (
    <motion.div
      className={styles.finalCta}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <h2 className={styles.finalCtaHeading}>
        Ready to streamline
        <br />
        your inventory?
      </h2>
      <p className={styles.finalCtaSub}>Join hundreds of businesses already running smarter with StockFlow.</p>
      <motion.button
        className={styles.btnPrimaryLg}
        onClick={onDemoClick}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        Request a Demo <span aria-hidden="true">→</span>
      </motion.button>
    </motion.div>
  );
}

function Footer({ onDemoClick }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        <div>
          <a href="#hero" className={styles.logo} style={{ fontSize: 18 }}>
            <img
              src="/only-shape-no-bg.png"
              alt="StockFlow logo"
              style={{ height: 40, width: 40, marginRight: 2, verticalAlign: "middle" }}
            />
            StockFlow
          </a>
          <p className={styles.footerBrandText}>
            Modern inventory management for growing businesses across South Asia.
          </p>
        </div>
        <div>
          <p className={styles.footerColHeading}>Product</p>
          <a href="#features" className={styles.footerLink}>
            Features
          </a>
          <a href="#pricing" className={styles.footerLink}>
            Pricing
          </a>
          <a href="#testimonials" className={styles.footerLink}>
            Testimonials
          </a>
          <a href="#faq" className={styles.footerLink}>
            FAQ
          </a>
          <Link href="/inventory-management-software" className={styles.footerLink}>
            Inventory Software Guide
          </Link>
          <Link href="/inventory-accounting-software" className={styles.footerLink}>
            Inventory Accounting Guide
          </Link>
          <Link href="/inventory-software-south-asia" className={styles.footerLink}>
            South Asia SMB Guide
          </Link>
        </div>
        <div>
          <p className={styles.footerColHeading}>Company</p>
          <Link href="/about" className={styles.footerLink}>
            About
          </Link>
          <button className={styles.footerLinkBtn} onClick={onDemoClick}>
            Contact Us
          </button>
        </div>
        <div>
          <p className={styles.footerColHeading}>Legal</p>
          <Link href="/privacy" className={styles.footerLink}>
            Privacy Policy
          </Link>
          <Link href="/terms" className={styles.footerLink}>
            Terms of Service
          </Link>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <span>© 2026 StockFlow. All rights reserved.</span>
        <span>
          Built for SMBs in South Asia 🌍 &nbsp;·&nbsp; Powered by{" "}
          <a
            href="https://truerefinedsolutions.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerTrsLink}
          >
            TRS
          </a>
        </span>
      </div>
    </footer>
  );
}

function DemoModal({ open, onClose }) {
  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleSubmit(e) {
    e.preventDefault();
    console.log("Demo request submitted");
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`${styles.modalOverlay} ${styles.modalOverlayOpen}`}
          onClick={handleOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <button className={styles.modalClose} onClick={onClose} aria-label="Close">
              ✕
            </button>
            <h3 className={styles.modalHeading}>Request a Demo</h3>
            <p className={styles.modalSub}>We will reach out within 24 hours to schedule your walkthrough.</p>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="demo-name">
                  Full Name
                </label>
                <input id="demo-name" className={styles.formInput} type="text" placeholder="Your name" required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="demo-email">
                  Business Email
                </label>
                <input
                  id="demo-email"
                  className={styles.formInput}
                  type="email"
                  placeholder="you@company.com"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="demo-company">
                  Company Name
                </label>
                <input id="demo-company" className={styles.formInput} type="text" placeholder="Your company" required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="demo-size">
                  Team Size
                </label>
                <select id="demo-size" className={styles.formSelect} required>
                  <option>1 to 10 employees</option>
                  <option>11 to 50 employees</option>
                  <option>51 to 200 employees</option>
                  <option>200+ employees</option>
                </select>
              </div>
              <motion.button type="submit" className={styles.formSubmit} whileTap={{ scale: 0.97 }}>
                Submit Request →
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Landing() {
  const [modalOpen, setModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") setModalOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <Head>
        <title>{LANDING_TITLE}</title>
        <meta name="description" content={LANDING_DESCRIPTION} />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={LANDING_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="StockFlow" />
        <meta property="og:title" content={LANDING_TITLE} />
        <meta property="og:description" content={LANDING_DESCRIPTION} />
        <meta property="og:url" content={LANDING_URL} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={LANDING_TITLE} />
        <meta name="twitter:description" content={LANDING_DESCRIPTION} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(landingStructuredData) }}
        />
      </Head>
      <div className={styles.page}>
        <Nav onDemoClick={() => setModalOpen(true)} />
        <Hero onDemoClick={() => setModalOpen(true)} />
        <Features />
        <Pricing onDemoClick={() => setModalOpen(true)} />
        <Testimonials />
        <Faq openFaq={openFaq} setOpenFaq={setOpenFaq} />
        <FinalCta onDemoClick={() => setModalOpen(true)} />
        <Footer onDemoClick={() => setModalOpen(true)} />
        <DemoModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    </>
  );
}

Landing.getLayout = (page) => page;
