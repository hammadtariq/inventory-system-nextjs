import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, useScroll, useMotionValueEvent } from "framer-motion";
import styles from "@/styles/Landing.module.css";

/* Shared scroll-reveal variant. custom prop = stagger index */
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] },
  }),
};

/* ── NAV ── */
function Nav({ onDemoClick }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const [lightMode, setLightMode] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => {
    setCondensed(v > 24); // pill shape morphs immediately
    setLightMode(v > 460); // light colors only after hero exits viewport
  });

  return (
    <nav
      className={`${styles.nav}${condensed ? ` ${styles.navCondensed}` : ""}${lightMode ? ` ${styles.navLight}` : ""}`}
      aria-label="Main navigation"
    >
      <a href="#hero" className={styles.navLogo}>
        <img
          src="/only-shape-no-bg.png"
          alt=""
          aria-hidden="true"
          width={30}
          height={30}
          className={styles.navLogoImg}
        />
        StockFlow
      </a>
      <ul className={styles.navLinks} role="list">
        <li>
          <a href="#features">Features</a>
        </li>
        <li>
          <a href="#pricing">Pricing</a>
        </li>
        <li>
          <a href="#testimonials">Testimonials</a>
        </li>
        <li>
          <a href="#faq">FAQ</a>
        </li>
      </ul>
      <div className={styles.navActions}>
        <Link href="/login" className={styles.navLogin}>
          Log in
        </Link>
        <button className={styles.btnPrimary} onClick={onDemoClick}>
          Request a demo
        </button>
      </div>
      <button
        className={styles.navMobileBtn}
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        aria-controls="mobile-nav"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        {mobileOpen ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>
      {mobileOpen && (
        <div id="mobile-nav" className={styles.mobileMenu}>
          {["features", "pricing", "testimonials", "faq"].map((id) => (
            <a key={id} href={`#${id}`} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
              {id.charAt(0).toUpperCase() + id.slice(1)}
            </a>
          ))}
          <div className={styles.mobileDivider} />
          <Link href="/login" className={styles.mobileLink}>
            Log in
          </Link>
        </div>
      )}
    </nav>
  );
}

/* ── HERO PREVIEW ── */
const PREVIEW_ROWS = [
  {
    product: "Khaddar Fabric",
    stock: "640 m",
    value: "₨ 380/m",
    total: "₨ 2,43,200",
    status: "In Stock",
    statusClass: "statusIn",
  },
  {
    product: "Lawn Shirting",
    stock: "480 m",
    value: "₨ 550/m",
    total: "₨ 2,64,000",
    status: "In Stock",
    statusClass: "statusIn",
  },
  {
    product: "Chiffon Dupatta",
    stock: "14 pcs",
    value: "₨ 1,200/pc",
    total: "₨ 16,800",
    status: "Low Stock",
    statusClass: "statusLow",
  },
  {
    product: "Polyester Blend",
    stock: "0 m",
    value: "₨ 310/m",
    total: "—",
    status: "Out of Stock",
    statusClass: "statusOut",
  },
];

function HeroPreview() {
  return (
    <div className={styles.heroPreview} aria-hidden="true">
      <div className={styles.previewWindow}>
        <div className={styles.previewBar}>
          <div className={styles.previewBarLeft}>
            <div className={styles.previewDots}>
              <span className={styles.previewDot} />
              <span className={styles.previewDot} />
              <span className={styles.previewDot} />
            </div>
            <span className={styles.previewTitle}>StockFlow · Inventory</span>
          </div>
          <div className={styles.previewLive}>
            <span className={styles.previewLiveDot} />
            Live
          </div>
        </div>
        <div className={styles.previewBody}>
          <table className={styles.previewTable}>
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">In Stock</th>
                <th scope="col">Unit Value</th>
                <th scope="col">Total Value</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {PREVIEW_ROWS.map(({ product, stock, value, total, status, statusClass }) => (
                <tr key={product}>
                  <td>{product}</td>
                  <td>{stock}</td>
                  <td>{value}</td>
                  <td>{total}</td>
                  <td className={styles[statusClass]}>{status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.previewFooter}>
          <span>
            Total stock value: <span className={styles.previewFooterAccent}>₨ 5,24,000</span>
          </span>
          <span>3 purchase orders pending</span>
          <span>Last updated: just now</span>
        </div>
      </div>
    </div>
  );
}

/* ── HERO ── */
function Hero({ onDemoClick }) {
  return (
    <section className={styles.hero} id="hero">
      <div className={styles.heroInner}>
        <div className={styles.heroText}>
          <h1 className={styles.heroHeading}>
            Your business,
            <br />
            running on real numbers.
          </h1>
          <p className={styles.heroSub}>
            Real-time inventory, purchase order approvals, and an integrated double-entry ledger — built for growing
            businesses in Pakistan, India, and Bangladesh.
          </p>
          <div className={styles.heroCtaRow}>
            <button className={styles.btnPrimaryLg} onClick={onDemoClick}>
              Request a demo →
            </button>
            <a href="#pricing" className={styles.btnOutlineDark}>
              See pricing
            </a>
          </div>
        </div>
        <HeroPreview />
      </div>
    </section>
  );
}

/* ── FEATURES ── */
const FEATURES = [
  {
    title: "Real-time inventory",
    desc: "Live stock levels per product and location. Every purchase and sale updates your counts automatically — no manual entries, no discrepancies at month-end.",
  },
  {
    title: "Purchase orders and approvals",
    desc: "Create orders, route them for approval, and track delivery against each line item. Full supplier history in one place.",
  },
  {
    title: "Double-entry ledger",
    desc: "Every transaction posts a proper ledger entry. Payables, receivables, and bank reconciliation are connected — not separate spreadsheets.",
  },
  {
    title: "Cheque tracking",
    desc: "Log issued and received cheques, track clearance status, and get alerts before maturity dates. Built for how business is done here.",
  },
  {
    title: "Reports and export",
    desc: "Sales vs. purchase analysis, top products by margin, customer distribution. Export to CSV or Excel with one click.",
  },
  {
    title: "Multi-company support",
    desc: "Run multiple business entities from a single account. Separate books, shared login, role-based access control per company.",
  },
];

function Features() {
  const rm = useReducedMotion();
  return (
    <section className={`${styles.section} ${styles.sectionAlt}`} id="features">
      <div className={styles.inner}>
        <motion.div
          className={styles.featuresHead}
          variants={fadeUp}
          initial={rm ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
        >
          <h2 className={styles.sectionHeading}>What StockFlow handles</h2>
          <p className={styles.sectionSubLeft}>
            From the purchase order to the bank reconciliation. Everything your accountant wants to see, always up to
            date.
          </p>
        </motion.div>
        <div className={styles.featuresGrid}>
          {FEATURES.map(({ title, desc }, i) => (
            <motion.div
              key={title}
              className={styles.featureBlock}
              variants={fadeUp}
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

/* ── PRICING ── */
const CheckIcon = () => (
  <svg className={styles.planCheck} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PLANS = [
  {
    name: "Silver",
    billing: "Billed monthly",
    total: "20",
    monthly: null,
    period: "/mo",
    desc: "For small teams getting started.",
    featured: false,
    btnLabel: "Get started",
    btnClass: "planBtnOutline",
    badge: null,
    features: ["1 company", "Up to 5 users", "Inventory and orders", "Basic reports", "Email support"],
  },
  {
    name: "Gold",
    billing: "Billed every 6 months",
    total: "100",
    monthly: "₨ equiv. $16.67/mo",
    period: "/6 mo",
    desc: "Save 17% vs. monthly.",
    featured: true,
    btnLabel: "Request a demo",
    btnClass: "planBtnFill",
    badge: "Most popular",
    features: [
      "3 companies",
      "Up to 15 users",
      "Inventory, orders and ledger",
      "Cheque tracking",
      "Advanced reporting",
      "CSV and Excel export",
      "Priority support",
    ],
  },
  {
    name: "Platinum",
    billing: "Billed annually",
    total: "150",
    monthly: "₨ equiv. $12.50/mo",
    period: "/yr",
    desc: "Best value — save 38%.",
    featured: false,
    btnLabel: "Request a demo",
    btnClass: "planBtnOutline",
    badge: "Best value",
    features: [
      "Unlimited companies",
      "Unlimited users",
      "All Gold features",
      "AI assistant",
      "Dedicated onboarding",
      "99.9% uptime SLA",
    ],
  },
];

function Pricing({ onDemoClick }) {
  const rm = useReducedMotion();
  return (
    <section className={styles.section} id="pricing">
      <div className={styles.inner}>
        <motion.div
          className={`${styles.pricingHead}`}
          variants={fadeUp}
          initial={rm ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
        >
          <h2 className={styles.sectionHeading}>Simple, honest pricing</h2>
          <p className={styles.sectionSubLeft}>
            No hidden fees. Switch or cancel anytime. Longer commitments save you money.
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
                <span className={styles.planPriceCurrency}>$</span>
                <span className={styles.planPriceAmt}>{plan.total}</span>
                <span className={styles.planPricePeriod}>{plan.period}</span>
              </div>
              {plan.monthly && <p className={styles.planMonthly}>{plan.monthly}</p>}
              <p className={styles.planDesc}>{plan.desc}</p>
              <div className={styles.planDivider} />
              <ul className={styles.planFeatures} role="list">
                {plan.features.map((f) => (
                  <li key={f} className={styles.planFeatureItem}>
                    <CheckIcon />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button className={styles[plan.btnClass]} onClick={onDemoClick}>
                {plan.btnLabel}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── TESTIMONIALS ── */
function Testimonials() {
  const rm = useReducedMotion();
  return (
    <section className={`${styles.section} ${styles.sectionAlt}`} id="testimonials">
      <div className={styles.inner}>
        <motion.h2
          className={styles.sectionHeading}
          style={{ marginBottom: 40 }}
          variants={fadeUp}
          initial={rm ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
        >
          Trusted by businesses across South Asia
        </motion.h2>
        <div className={styles.testimonialsGrid}>
          <motion.div
            className={styles.testimonialFeatured}
            variants={fadeUp}
            initial={rm ? false : "hidden"}
            whileInView="visible"
            custom={0}
            viewport={{ once: true, amount: 0.2 }}
          >
            <span className={styles.testimonialMark} aria-hidden="true">
              &ldquo;
            </span>
            <blockquote className={styles.testimonialQuoteFeatured}>
              StockFlow saved us 15 hours a week on reconciliation. GST compliance used to be a Friday nightmare — now
              it takes twenty minutes. Our accountant actually approved the switch.
            </blockquote>
            <div className={styles.testimonialAuthor}>
              <div className={styles.testimonialAvatar} aria-hidden="true">
                A
              </div>
              <div>
                <div className={styles.testimonialName}>Ali Hassan</div>
                <div className={styles.testimonialRole}>Finance Manager, Karachi</div>
              </div>
            </div>
          </motion.div>

          <div className={styles.testimonialStack}>
            <motion.div
              className={styles.testimonialMinor}
              variants={fadeUp}
              initial={rm ? false : "hidden"}
              whileInView="visible"
              custom={1}
              viewport={{ once: true, amount: 0.2 }}
            >
              <blockquote className={styles.testimonialQuoteMinor}>
                &ldquo;We cut inventory holding costs by 20% in the first quarter. Having live stock levels meant we
                stopped over-ordering every month.&rdquo;
              </blockquote>
              <div className={styles.testimonialAuthorMinor}>
                <div className={styles.testimonialAvatarMinor} aria-hidden="true">
                  O
                </div>
                <div>
                  <div className={styles.testimonialNameMinor}>Omar Shaikh</div>
                  <div className={styles.testimonialRoleMinor}>Operations Lead, Lahore</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className={styles.testimonialMinor}
              variants={fadeUp}
              initial={rm ? false : "hidden"}
              whileInView="visible"
              custom={2}
              viewport={{ once: true, amount: 0.2 }}
            >
              <blockquote className={styles.testimonialQuoteMinor}>
                &ldquo;As a founder wearing every hat, StockFlow gives me a clean picture of the business in five
                minutes. I used to need an hour with the spreadsheets.&rdquo;
              </blockquote>
              <div className={styles.testimonialAuthorMinor}>
                <div className={styles.testimonialAvatarMinor} aria-hidden="true">
                  F
                </div>
                <div>
                  <div className={styles.testimonialNameMinor}>Fatima Malik</div>
                  <div className={styles.testimonialRoleMinor}>Founder, Islamabad</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ── */
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
    q: "Can I manage multiple companies under one account?",
    a: "Yes. Gold and Platinum plans support multiple business entities from a single dashboard, each with isolated data, books, and user roles.",
  },
  {
    q: "How does the double-entry ledger work?",
    a: "Every transaction — purchase, sale, payment — automatically posts a corresponding ledger entry. You get a live trial balance, accounts payable, and accounts receivable without separate accounting software.",
  },
  {
    q: "Is cheque tracking available on all plans?",
    a: "Cheque tracking is available on Gold and Platinum plans. You can log issued and received cheques, track clearance status, and set alerts for maturity dates.",
  },
  {
    q: "How secure is my business data?",
    a: "Data is encrypted in transit and at rest. We follow OWASP security standards, conduct regular audits, and maintain strict tenant isolation — your data is never shared across accounts.",
  },
  {
    q: "Can I cancel or switch plans anytime?",
    a: "Yes. Upgrade, downgrade, or cancel at any time. There are no lock-in contracts or cancellation fees. Unused time on prepaid plans is credited to your account.",
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

/* ── FINAL CTA ── */
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
      <h2 className={styles.finalCtaHeading}>See it working in your business.</h2>
      <p className={styles.finalCtaSub}>
        Join hundreds of businesses across South Asia that replaced their spreadsheets with StockFlow.
      </p>
      <button className={styles.btnPrimaryLg} onClick={onDemoClick}>
        Request a demo →
      </button>
    </motion.section>
  );
}

/* ── FOOTER ── */
function Footer({ onDemoClick }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerGrid}>
          <div>
            <a href="#hero" className={styles.footerLogo}>
              <img
                src="/only-shape-no-bg.png"
                alt=""
                aria-hidden="true"
                width={26}
                height={26}
                className={styles.footerLogoImg}
              />
              StockFlow
            </a>
            <p className={styles.footerBrandText}>
              Inventory management and accounting for growing businesses across South Asia.
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
              Inventory Guide
            </Link>
            <Link href="/inventory-accounting-software" className={styles.footerLink}>
              Accounting Guide
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
              Contact us
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
            Built for SMBs in South Asia &nbsp;·&nbsp; Powered by{" "}
            <a
              href="https://truerefinedsolutions.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerExternalLink}
            >
              TRS
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ── DEMO MODAL ── */
function DemoModal({ open, onClose, triggerRef }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!open || !modalRef.current) return;

    const focusable = [
      ...modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
    ];
    focusable[0]?.focus();

    function trapTab(e) {
      if (e.key !== "Tab" || !focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", trapTab);
    return () => {
      document.removeEventListener("keydown", trapTab);
      triggerRef?.current?.focus();
    };
  }, [open, triggerRef]);

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleSubmit(e) {
    e.preventDefault();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.modalOverlay}
          onClick={handleOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            ref={modalRef}
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-heading"
          >
            <button className={styles.modalClose} onClick={onClose} aria-label="Close dialog">
              ✕
            </button>
            <h2 className={styles.modalHeading} id="modal-heading">
              Request a demo
            </h2>
            <p className={styles.modalSub}>We will reach out within 24 hours to schedule your walkthrough.</p>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="demo-name">
                  Full name
                </label>
                <input
                  id="demo-name"
                  className={styles.formInput}
                  type="text"
                  placeholder="Your name"
                  required
                  autoComplete="name"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="demo-email">
                  Business email
                </label>
                <input
                  id="demo-email"
                  className={styles.formInput}
                  type="email"
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="demo-company">
                  Company name
                </label>
                <input
                  id="demo-company"
                  className={styles.formInput}
                  type="text"
                  placeholder="Your company"
                  required
                  autoComplete="organization"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="demo-size">
                  Team size
                </label>
                <select id="demo-size" className={styles.formSelect} required>
                  <option value="">Select team size</option>
                  <option value="1-10">1–10 employees</option>
                  <option value="11-50">11–50 employees</option>
                  <option value="51-200">51–200 employees</option>
                  <option value="200+">200+ employees</option>
                </select>
              </div>
              <button type="submit" className={styles.formSubmit}>
                Submit request →
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── SEO ── */
const LANDING_URL = "https://www.treesols.com/";
const LANDING_TITLE = "StockFlow — Inventory Management for Modern Businesses";
const LANDING_DESCRIPTION =
  "StockFlow brings real-time inventory tracking, integrated accounting, and smart order management for SMBs.";

const PLANS_FOR_SCHEMA = PLANS.map((p) => ({
  "@type": "Offer",
  name: p.name,
  price: p.total,
  priceCurrency: "USD",
  availability: "https://schema.org/InStock",
  url: "https://www.treesols.com/#pricing",
}));

const landingStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "StockFlow",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: LANDING_URL,
    description: LANDING_DESCRIPTION,
    offers: PLANS_FOR_SCHEMA,
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
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  },
];

/* ── PAGE ── */
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
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(landingStructuredData),
          }}
        />
      </Head>
      <div className={styles.page}>
        <Nav onDemoClick={openDemo} />
        <main>
          <Hero onDemoClick={openDemo} />
          <Features />
          <Pricing onDemoClick={openDemo} />
          <Testimonials />
          <Faq openFaq={openFaq} setOpenFaq={setOpenFaq} />
          <FinalCta onDemoClick={openDemo} />
        </main>
        <Footer onDemoClick={openDemo} />
        <DemoModal open={modalOpen} onClose={closeDemo} triggerRef={demoTriggerRef} />
      </div>
    </>
  );
}

Landing.getLayout = (page) => page;
