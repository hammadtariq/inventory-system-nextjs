import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import styles from "@/styles/Landing.module.css";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import PublicDemoModal from "@/components/PublicDemoModal";

const TRUE_REFINED_URL = "https://truerefinedsolutions.com";
const EASE_OUT = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, transform: "translateY(22px)" },
  visible: (i = 0) => ({
    opacity: 1,
    transform: "translateY(0)",
    transition: { duration: 0.5, delay: i * 0.06, ease: EASE_OUT },
  }),
};

const fadeInLeft = {
  hidden: { opacity: 0, transform: "translateX(-20px)" },
  visible: (i = 0) => ({
    opacity: 1,
    transform: "translateX(0)",
    transition: { duration: 0.5, delay: i * 0.06, ease: EASE_OUT },
  }),
};

const fadeInRight = {
  hidden: { opacity: 0, transform: "translateX(20px)" },
  visible: {
    opacity: 1,
    transform: "translateX(0)",
    transition: { duration: 0.54, ease: EASE_OUT },
  },
};

const scaleReveal = {
  hidden: { opacity: 0, transform: "scale(0.97) translateY(10px)" },
  visible: (i = 0) => ({
    opacity: 1,
    transform: "scale(1) translateY(0)",
    transition: { duration: 0.42, delay: i * 0.055, ease: EASE_OUT },
  }),
};

function Hero({ onDemoClick }) {
  const rm = useReducedMotion();

  return (
    <section className={styles.hero} id="hero">
      <div className={styles.heroAmbient} aria-hidden="true" />
      <div className={styles.heroGridGlow} aria-hidden="true" />
      <div className={styles.heroInner}>
        <motion.div
          className={styles.heroText}
          initial={rm ? false : { opacity: 0, transform: "translateY(18px)" }}
          animate={{ opacity: 1, transform: "translateY(0)" }}
          transition={{ duration: 0.48, ease: EASE_OUT }}
        >
          <motion.div
            className={styles.heroPill}
            initial={rm ? false : { opacity: 0, transform: "translateY(10px)" }}
            animate={{ opacity: 1, transform: "translateY(0)" }}
            transition={{ duration: 0.42, delay: 0.04, ease: EASE_OUT }}
          >
            <span className={styles.heroPillBadge}>TSO</span>
            <span>Inventory, sales, ledger, and reports</span>
          </motion.div>
          <motion.h1
            className={styles.heroHeading}
            initial={rm ? false : { opacity: 0, transform: "translateY(22px)", filter: "blur(5px)" }}
            animate={{ opacity: 1, transform: "translateY(0)", filter: "blur(0px)" }}
            transition={{ duration: 0.56, delay: 0.1, ease: EASE_OUT }}
          >
            Inventory, sales, and ledgers in one clear view.
          </motion.h1>
          <motion.p
            className={styles.heroSub}
            initial={rm ? false : { opacity: 0, transform: "translateY(18px)", filter: "blur(4px)" }}
            animate={{ opacity: 1, transform: "translateY(0)", filter: "blur(0px)" }}
            transition={{ duration: 0.52, delay: 0.18, ease: EASE_OUT }}
          >
            TSO helps Asian SMBs track stock, purchases, sales, and reports from one connected SaaS platform.
          </motion.p>
          <motion.div
            className={styles.heroCtaRow}
            initial={rm ? false : { opacity: 0, transform: "translateY(12px)" }}
            animate={{ opacity: 1, transform: "translateY(0)" }}
            transition={{ duration: 0.46, delay: 0.28, ease: EASE_OUT }}
          >
            <button className={styles.btnPrimaryLg} onClick={onDemoClick}>
              Request a Demo
            </button>
            <a href="#pricing" className={styles.btnOutlineDark}>
              See Pricing
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          className={styles.heroPreview}
          initial={rm ? false : { opacity: 0, transform: "translateY(34px)" }}
          animate={{ opacity: 1, transform: "translateY(0)" }}
          transition={{ duration: 0.62, delay: 0.34, ease: EASE_OUT }}
        >
          <div className={styles.heroMediaFrame}>
            <video
              src="/landing/inventory-dashboard.mov"
              autoPlay
              loop
              muted
              playsInline
              className={styles.heroMediaImage}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const PROBLEMS = [
  {
    title: "Manual stock tracking gets messy",
    desc: "Inventory changes quickly, and spreadsheets rarely keep up with real product availability or movement.",
  },
  {
    title: "Purchases and sales are disconnected",
    desc: "Teams lose time reconciling supplier records, customer activity, invoices, and outgoing stock across tools.",
  },
  {
    title: "Reports and ledgers are scattered",
    desc: "Business owners need clear operational records without chasing separate files, exports, and manual summaries.",
  },
];

function ProblemSection() {
  const rm = useReducedMotion();
  return (
    <section className={styles.section} id="product">
      <div className={styles.inner}>
        <motion.div
          className={styles.featuresHead}
          variants={fadeUp}
          initial={rm ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
        >
          <h2 className={styles.sectionHeading}>When daily operations are split, decisions slow down</h2>
          <p className={styles.sectionSubLeft}>
            Asian businesses need reliable visibility into stock, warehouse work, purchasing, sales, ledgers, and
            reports without rebuilding the same picture manually every day.
          </p>
        </motion.div>
        <div className={styles.problemGrid}>
          {PROBLEMS.map(({ title, desc }, i) => (
            <motion.div
              key={title}
              className={styles.problemItem}
              variants={fadeInLeft}
              initial={rm ? false : "hidden"}
              whileInView="visible"
              custom={i}
              viewport={{ once: true, amount: 0.2 }}
            >
              <span className={styles.problemNumber}>{`0${i + 1}`}</span>
              <h3 className={styles.problemTitle}>{title}</h3>
              <p className={styles.problemDesc}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STATS = [
  {
    value: "6",
    label: "Connected modules",
    sub: "Inventory, Warehouse, Purchase, Sales, Ledger, and Reports — all in one platform.",
  },
  {
    value: "Live",
    label: "Stock visibility",
    sub: "Every purchase and sale updates your inventory records in real time.",
  },
  {
    value: "AI",
    label: "Business insights",
    sub: "Ask plain-language questions about inventory, sales, and business margins.",
  },
];

function StatsBar() {
  const rm = useReducedMotion();
  return (
    <section className={`${styles.section} ${styles.sectionAlt}`}>
      <div className={styles.inner}>
        <div className={styles.statsGrid}>
          {STATS.map(({ value, label, sub }, i) => (
            <motion.div
              key={label}
              className={styles.statItem}
              variants={fadeUp}
              initial={rm ? false : "hidden"}
              whileInView="visible"
              custom={i}
              viewport={{ once: true, amount: 0.3 }}
            >
              <span className={styles.statValue}>{value}</span>
              <span className={styles.statLabel}>{label}</span>
              <p className={styles.statSub}>{sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    title: "Inventory Management",
    desc: "Track products, stock levels, availability, and movement across the business.",
  },
  {
    title: "Warehouse Management",
    desc: "Organize warehouse operations, stock movement, and product handling.",
  },
  {
    title: "Purchase Management",
    desc: "Manage purchasing records, supplier activity, and incoming stock.",
  },
  {
    title: "Sales Management",
    desc: "Track sales, customer activity, invoices, and outgoing stock.",
  },
  {
    title: "Ledger & Reports",
    desc: "View business records, ledgers, summaries, and operational reports.",
  },
  {
    title: "AI Business Insights",
    desc: "Use AI-powered assistance to understand inventory, sales, and business performance more clearly.",
  },
];

function Features() {
  const rm = useReducedMotion();
  return (
    <section className={styles.section} id="features">
      <div className={styles.inner}>
        <motion.div
          className={styles.featuresHead}
          variants={fadeUp}
          initial={rm ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
        >
          <h2 className={styles.sectionHeading}>Core features for inventory and business operations</h2>
          <p className={styles.sectionSubLeft}>
            A small business operations SaaS platform for the workflows Asian teams use every day, with room for future
            business modules as operations grow.
          </p>
        </motion.div>
        <div className={styles.featuresGrid}>
          {FEATURES.map(({ title, desc }, i) => (
            <motion.div
              key={title}
              className={styles.featureBlock}
              variants={scaleReveal}
              initial={rm ? false : "hidden"}
              whileInView="visible"
              custom={i}
              viewport={{ once: true, amount: 0.2 }}
            >
              <h3 className={styles.featureTitle}>{title}</h3>
              <p className={styles.featureDesc}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const USE_CASES = [
  "Retail businesses",
  "Wholesale businesses",
  "Distribution companies",
  "Warehouses",
  "Trading businesses",
  "Small and medium-sized businesses",
];

function UseCases() {
  const rm = useReducedMotion();
  return (
    <section className={`${styles.section} ${styles.sectionAlt}`} id="use-cases">
      <div className={styles.inner}>
        <motion.div
          className={styles.featuresHead}
          variants={fadeUp}
          initial={rm ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
        >
          <h2 className={styles.sectionHeading}>Built for Asian businesses that move products and records daily</h2>
          <p className={styles.sectionSubLeft}>
            TSO supports Asian teams that need an inventory management platform, warehouse management system, purchase
            and sales management system, and ledger management system working from the same operational source.
          </p>
        </motion.div>
        <motion.div
          className={styles.builtForStrip}
          variants={fadeUp}
          initial={rm ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
        >
          <span className={styles.builtForIntro}>Use cases</span>
          {USE_CASES.map((label) => (
            <span key={label} className={styles.builtForPill}>
              {label}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function AiInsights() {
  const rm = useReducedMotion();
  return (
    <section className={styles.section} id="ai-insights">
      <div className={`${styles.inner} ${styles.aiShowcase}`}>
        <motion.div
          className={styles.aiCopy}
          variants={fadeInLeft}
          initial={rm ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
        >
          <p className={styles.panelKicker}>AI inventory assistant</p>
          <h2 className={styles.sectionHeading}>Ask your inventory data directly</h2>
          <p className={styles.sectionSubLeft}>
            The assistant turns sales, purchase, customer, and margin questions into clear answers business owners can
            act on.
          </p>
          <ul className={styles.aiList} role="list">
            <li>Find top customers by revenue and last purchase date.</li>
            <li>Review sales, purchases, margins, and stock movement.</li>
            <li>Get plain-language summaries from operational records.</li>
          </ul>
        </motion.div>
        <motion.div
          className={styles.aiPreview}
          variants={fadeInRight}
          initial={rm ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
        >
          <Image
            src="/landing/inventory-ai-assistant-preview.png"
            alt="TSO AI assistant answering inventory, customer revenue, and sales summary questions"
            width={1500}
            height={1125}
            sizes="(max-width: 768px) 100vw, 54vw"
            className={styles.aiPreviewImage}
          />
        </motion.div>
      </div>
    </section>
  );
}

const WHY_BUY = [
  {
    title: "Know what is in stock",
    desc: "See product availability, movement, and warehouse activity without waiting for manual updates.",
    href: "/inventory-management-software",
  },
  {
    title: "Connect purchases and sales",
    desc: "Keep supplier activity, incoming stock, customer sales, invoices, and outgoing stock in one workflow.",
    href: "/inventory-accounting-software",
  },
  {
    title: "Review cleaner business records",
    desc: "Use ledgers, reports, summaries, and exports to understand daily operations more clearly.",
    href: "/inventory-software-south-asia",
  },
  {
    title: "Make faster owner decisions",
    desc: "Use AI-powered insights to spot useful patterns in inventory, sales, and business performance.",
  },
];

function WhyBuy() {
  const rm = useReducedMotion();
  return (
    <section className={`${styles.section} ${styles.sectionAlt}`}>
      <div className={styles.inner}>
        <motion.div
          className={styles.featuresHead}
          variants={fadeUp}
          initial={rm ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
        >
          <h2 className={styles.sectionHeading}>Why businesses subscribe to TSO</h2>
          <p className={styles.sectionSubLeft}>
            TSO is built for owners and operations teams that need daily clarity, not another disconnected tool.
          </p>
        </motion.div>
        <div className={styles.guidesGrid}>
          {WHY_BUY.map(({ title, desc, href }, i) => {
            const CardTag = href ? motion.a : motion.div;
            return (
              <CardTag
                key={title}
                href={href}
                className={styles.guideCard}
                variants={fadeUp}
                initial={rm ? false : "hidden"}
                whileInView="visible"
                custom={i}
                viewport={{ once: true, amount: 0.2 }}
              >
                <h3 className={styles.guideTitle}>{title}</h3>
                <p className={styles.guideDesc}>{desc}</p>
                {href ? <span className={styles.guideArrow}>Read guide</span> : null}
              </CardTag>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SoftCta({ onDemoClick }) {
  const rm = useReducedMotion();
  return (
    <div className={styles.midCtaBar}>
      <motion.div
        className={styles.midCtaBarInner}
        variants={fadeUp}
        initial={rm ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
      >
        <p className={styles.midCtaText}>
          Ready to stop managing stock, sales, and reports from separate spreadsheets?
        </p>
        <button className={styles.btnPrimary} onClick={onDemoClick}>
          Request a Demo
        </button>
      </motion.div>
    </div>
  );
}

const CheckIcon = () => (
  <svg className={styles.planCheck} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PLANS = [
  {
    name: "Monthly",
    billing: "Flexible, no long-term commitment",
    price: "$40",
    period: "/month",
    perMonth: null,
    savings: null,
    desc: "Full platform access. Cancel or switch billing anytime.",
    featured: false,
    badge: null,
    features: [
      "Inventory and warehouse records",
      "Purchase and sales tracking",
      "Customer and supplier records",
      "Ledger management and reports",
      "AI-powered business insights",
    ],
  },
  {
    name: "Quarterly",
    billing: "Billed every 3 months",
    price: "$100",
    period: "/quarter",
    perMonth: "≈ $33 / month",
    savings: "Save 17%",
    desc: "Same full access at a lower effective monthly rate.",
    featured: true,
    badge: "Popular",
    features: [
      "Inventory and warehouse records",
      "Purchase and sales tracking",
      "Customer and supplier records",
      "Ledger management and reports",
      "AI-powered business insights",
    ],
  },
  {
    name: "Annual",
    billing: "Billed once per year",
    price: "$350",
    period: "/year",
    perMonth: "≈ $29 / month",
    savings: "Save 27%",
    desc: "Best rate. Pay once, use TSO all year.",
    featured: false,
    badge: "Best value",
    features: [
      "Inventory and warehouse records",
      "Purchase and sales tracking",
      "Customer and supplier records",
      "Ledger management and reports",
      "AI-powered business insights",
    ],
  },
];

function Pricing({ onDemoClick }) {
  const rm = useReducedMotion();
  return (
    <section className={styles.section} id="pricing">
      <div className={styles.inner}>
        <motion.div
          className={styles.pricingHead}
          variants={fadeUp}
          initial={rm ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
        >
          <h2 className={styles.sectionHeading}>Simple, transparent pricing</h2>
          <p className={styles.sectionSubLeft}>
            All billing periods include full platform access: inventory, purchases, sales, ledger, reports, and AI
            insights. Pay monthly for flexibility or save up to 27% by paying upfront.
          </p>
        </motion.div>
        <div className={styles.pricingGrid}>
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={plan.featured ? styles.planCardFeatured : styles.planCard}
              variants={fadeUp}
              initial={rm ? false : "hidden"}
              whileInView="visible"
              custom={i}
              viewport={{ once: true, amount: 0.15 }}
            >
              <div className={styles.planHeader}>
                <span className={styles.planName}>{plan.name}</span>
                {plan.badge && <span className={styles.planBadge}>{plan.badge}</span>}
              </div>
              <p className={styles.planBilling}>{plan.billing}</p>
              <div className={styles.planPrice}>
                <span className={styles.planPriceAmt}>{plan.price}</span>
                {plan.period && <span className={styles.planPricePeriod}>{plan.period}</span>}
              </div>
              {plan.perMonth && <p className={styles.planPerMonth}>{plan.perMonth}</p>}
              {plan.savings && <span className={styles.planSavings}>{plan.savings}</span>}
              <p className={styles.planDesc}>{plan.desc}</p>
              <div className={styles.planDivider} />
              <ul className={styles.planFeatures} role="list">
                {plan.features.map((feature) => (
                  <li key={feature} className={styles.planFeatureItem}>
                    <CheckIcon />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button className={plan.featured ? styles.planBtnFill : styles.planBtnOutline} onClick={onDemoClick}>
                Request a Demo
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const ChevronIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path
      d="M4.5 6.75L9 11.25L13.5 6.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FAQS = [
  {
    q: "What is TSO?",
    a: "TSO is a SaaS business operations platform for Asian businesses managing inventory, warehouse operations, purchases, sales, ledgers, reports, and AI-powered insights.",
  },
  {
    q: "Why should I buy a TSO subscription?",
    a: "TSO helps teams replace disconnected spreadsheets with live stock visibility, connected purchase and sales records, cleaner ledgers, exportable reports, and AI-assisted business insights.",
  },
  {
    q: "Can TSO support more than inventory?",
    a: "Yes. TSO includes inventory management, warehouse management, purchase and sales management, ledger management, reporting, AI insights, and future business modules.",
  },
  {
    q: "Who should use TSO?",
    a: "TSO is suited for retail businesses, wholesale businesses, distribution companies, warehouses, trading businesses, and small or medium-sized businesses across Asia that need connected operational records.",
  },
];

function Faq({ openFaq, setOpenFaq }) {
  return (
    <section className={styles.section} id="faq">
      <div className={styles.inner}>
        <h2 className={styles.sectionHeading}>Common questions</h2>
        <div className={styles.faqList}>
          {FAQS.map(({ q, a }, i) => {
            const isOpen = openFaq === q;
            const btnId = `faq-btn-${i}`;
            return (
              <div key={q} className={styles.faqItem}>
                <button
                  id={btnId}
                  className={styles.faqToggle}
                  onClick={() => setOpenFaq(isOpen ? null : q)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.faqQuestion}>{q}</span>
                  <ChevronIcon className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ""}`} />
                </button>
                <div
                  className={`${styles.faqBody} ${isOpen ? styles.faqBodyOpen : ""}`}
                  role="region"
                  aria-labelledby={btnId}
                >
                  <div className={styles.faqBodyInner}>
                    <p className={styles.faqAnswer}>{a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ onDemoClick }) {
  const rm = useReducedMotion();
  return (
    <motion.section
      className={styles.finalCta}
      variants={fadeUp}
      initial={rm ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
    >
      <h2 className={styles.finalCtaHeading}>Ready to manage your business operations from one platform?</h2>
      <p className={styles.finalCtaSub}>
        See how TSO can help your team manage inventory, purchases, sales, reports, and AI insights from one place.
      </p>
      <div className={styles.finalCtaActions}>
        <button className={styles.btnPrimaryLg} onClick={onDemoClick}>
          Request a Demo
        </button>
        <a href="#pricing" className={styles.btnOutlineDark}>
          See Pricing
        </a>
      </div>
    </motion.section>
  );
}

const LANDING_URL = "https://www.treesols.com/";
const LANDING_TITLE = "TSO - Business Operations SaaS for Asia";
const LANDING_DESCRIPTION =
  "TSO is a business operations SaaS platform for Asian businesses managing inventory, warehouse, sales, purchase, ledger, reporting, and AI-powered insights.";

const landingStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "TSO",
    alternateName: "TSO by True Refined Solutions",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: LANDING_URL,
    creator: {
      "@type": "Organization",
      name: "True Refined Solutions",
      url: TRUE_REFINED_URL,
    },
    description: LANDING_DESCRIPTION,
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "True Refined Solutions",
    url: TRUE_REFINED_URL,
    makesOffer: {
      "@type": "Offer",
      itemOffered: {
        "@type": "SoftwareApplication",
        name: "TSO",
        applicationCategory: "BusinessApplication",
      },
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  },
];

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

  const demoTriggerRef = useRef(null);

  const openDemo = () => {
    demoTriggerRef.current = document.activeElement;
    setModalOpen(true);
  };
  const closeDemo = () => setModalOpen(false);

  return (
    <>
      <Head>
        <title>{LANDING_TITLE}</title>
        <meta name="description" content={LANDING_DESCRIPTION} />
        <meta
          name="keywords"
          content="inventory management platform, warehouse management system, business operations software, purchase and sales management system, ledger management system, AI inventory assistant, inventory reporting software, small business operations platform, business operations SaaS Asia"
        />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={LANDING_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="TSO" />
        <meta property="og:title" content={LANDING_TITLE} />
        <meta property="og:description" content={LANDING_DESCRIPTION} />
        <meta property="og:url" content={LANDING_URL} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={LANDING_TITLE} />
        <meta name="twitter:description" content={LANDING_DESCRIPTION} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(landingStructuredData),
          }}
        />
      </Head>
      <div className={styles.page}>
        <PublicNav onDemoClick={openDemo} />
        <main>
          <Hero onDemoClick={openDemo} />
          <ProblemSection />
          <StatsBar />
          <Features />
          <UseCases />
          <AiInsights />
          <WhyBuy />
          <SoftCta onDemoClick={openDemo} />
          <Pricing onDemoClick={openDemo} />
          <Faq openFaq={openFaq} setOpenFaq={setOpenFaq} />
          <FinalCta onDemoClick={openDemo} />
        </main>
        <PublicFooter onDemoClick={openDemo} />
        <PublicDemoModal open={modalOpen} onClose={closeDemo} triggerRef={demoTriggerRef} />
      </div>
    </>
  );
}

Landing.getLayout = (page) => page;
