import { useState } from "react";
import Head from "next/head";
import styles from "@/styles/Landing.module.css";

function Nav({ onDemoClick }) {
  return (
    <nav className={styles.nav}>
      <a href="#hero" className={styles.logo}>
        ⬡ StockFlow
      </a>
      <div className={styles.navLinks}>
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <a href="#testimonials">Testimonials</a>
        <a href="#faq">FAQ</a>
      </div>
      <button className={styles.navCta} onClick={onDemoClick}>
        Request a Demo
      </button>
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
      <div className={styles.heroBadge}>✦ Inventory Management for Modern Businesses</div>
      <h1 className={styles.heroHeading}>
        Run Your Inventory
        <br />
        <span className={styles.heroGradient}>Smarter, Faster,</span>
        <br />
        With Confidence.
      </h1>
      <p className={styles.heroSub}>
        StockFlow brings real-time inventory tracking, integrated accounting, and smart order management, all in one
        clean dashboard.
      </p>
      <div className={styles.heroCtaRow}>
        <button className={styles.btnPrimary} onClick={onDemoClick}>
          Request a Demo <span aria-hidden="true">→</span>
        </button>
        <a href="#pricing" className={styles.btnSecondary}>
          See Pricing
        </a>
      </div>
      <div className={styles.heroCard}>
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
      </div>
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
      <p className={styles.sectionLabel}>What You Get</p>
      <h2 className={styles.sectionHeading}>
        Everything your business needs
        <br />
        in one place
      </h2>
      <p className={styles.sectionSub}>
        From purchase orders to financial reconciliation, StockFlow handles the complexity so you can focus on growth.
      </p>
      <div className={styles.featuresGrid}>
        {FEATURES.map(({ icon, color, title, desc }) => (
          <div key={title} className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles[color]}`}>{icon}</div>
            <h3 className={styles.featureTitle}>{title}</h3>
            <p className={styles.featureDesc}>{desc}</p>
          </div>
        ))}
      </div>
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
      <p className={styles.sectionLabel}>Customer Stories</p>
      <h2 className={styles.sectionHeading}>
        Trusted by businesses
        <br />
        across South Asia
      </h2>
      <div className={styles.testimonialsGrid}>
        {TESTIMONIALS.map(({ quote, name, role, initial, avatarClass }) => (
          <div key={name} className={styles.testimonialCard}>
            <div className={styles.stars}>★★★★★</div>
            <p className={styles.testimonialQuote}>&ldquo;{quote}&rdquo;</p>
            <div className={styles.author}>
              <div className={`${styles.avatar} ${styles[avatarClass]}`}>{initial}</div>
              <div>
                <div className={styles.authorName}>{name}</div>
                <div className={styles.authorRole}>{role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
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
    <section className={styles.section} id="pricing">
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
        <div className={styles.pricingGrid}>
          {PLANS.map((plan) => (
            <div key={plan.tier} className={`${styles.planCard} ${styles[plan.style]}`}>
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
              <button className={`${styles.planBtn} ${styles[plan.btnClass]}`} onClick={onDemoClick}>
                {plan.btnLabel}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
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

function Faq({ openFaq, setOpenFaq }) {
  return (
    <section className={styles.section} id="faq">
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
    </section>
  );
}

export default function Landing() {
  const [modalOpen, setModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <>
      <Head>
        <title>StockFlow — Inventory Management for Modern Businesses</title>
        <meta
          name="description"
          content="StockFlow brings real-time inventory tracking, integrated accounting, and smart order management for SMBs."
        />
      </Head>
      <div className={styles.page}>
        <Nav onDemoClick={() => setModalOpen(true)} />
        <Hero onDemoClick={() => setModalOpen(true)} />
        <Features />
        <Pricing onDemoClick={() => setModalOpen(true)} />
        <Testimonials />
        <Faq openFaq={openFaq} setOpenFaq={setOpenFaq} />
      </div>
    </>
  );
}

Landing.getLayout = (page) => page;
