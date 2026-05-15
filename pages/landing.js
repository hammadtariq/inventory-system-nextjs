import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import styles from "@/styles/Landing.module.css";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

function Nav({ onDemoClick }) {
  return (
    <nav className={styles.nav} data-gsap="nav">
      <a href="#hero" className={styles.logo} data-gsap="nav-logo">
        ⬡ StockFlow
      </a>
      <div className={styles.navLinks} data-gsap="nav-links">
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <a href="#testimonials">Testimonials</a>
        <a href="#faq">FAQ</a>
      </div>
      <motion.button className={styles.navCta} onClick={onDemoClick} whileTap={{ scale: 0.97 }} data-gsap="nav-cta">
        Request a Demo
      </motion.button>
    </nav>
  );
}

const STATS = [
  { val: "₨12.4M", lbl: "Total Sales" },
  { val: "₨8.1M", lbl: "Total Purchases" },
  { val: "2,840", lbl: "Items in Stock" },
  { val: "98.2%", lbl: "Order Accuracy" },
];

function Hero({ onDemoClick, glowRef }) {
  return (
    <section className={styles.hero} id="hero" data-gsap="hero">
      <div className={styles.ambientGlow} ref={glowRef} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div className={styles.heroBadge} data-gsap="hero-badge">
          ✦ Inventory Management for Modern Businesses
        </div>
        <h1 className={styles.heroHeading} data-gsap="hero-heading">
          <span className={styles.lineWrap}>
            <span data-gsap="line-inner">Run Your Inventory</span>
          </span>
          <br />
          <span className={styles.lineWrap}>
            <span className={styles.heroGradient} data-gsap="line-inner">
              Smarter, Faster,
            </span>
          </span>
          <br />
          <span className={styles.lineWrap}>
            <span data-gsap="line-inner">With Confidence.</span>
          </span>
        </h1>
        <p className={styles.heroSub} data-gsap="hero-sub">
          StockFlow brings real-time inventory tracking, integrated accounting, and smart order management, all in one
          clean dashboard.
        </p>
        <div className={styles.heroCtaRow} data-gsap="hero-cta">
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
        </div>
        <div className={styles.heroCard} data-gsap="hero-card">
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
    <section className={styles.section} id="features" data-gsap="features">
      <div data-gsap="features-header">
        <p className={styles.sectionLabel}>What You Get</p>
        <h2 className={styles.sectionHeading}>
          Everything your business needs
          <br />
          in one place
        </h2>
        <p className={styles.sectionSub}>
          From purchase orders to financial reconciliation, StockFlow handles the complexity so you can focus on growth.
        </p>
      </div>
      <div className={styles.featuresGrid} data-gsap="features-grid">
        {FEATURES.map(({ icon, color, title, desc }) => (
          <motion.div
            key={title}
            className={styles.featureCard}
            data-gsap="feature-card"
            whileHover={{ y: -6, boxShadow: "0 12px 40px rgba(99,102,241,0.15)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className={`${styles.featureIcon} ${styles[color]}`} data-gsap="feature-icon">
              {icon}
            </div>
            <h3 className={styles.featureTitle}>{title}</h3>
            <p className={styles.featureDesc}>{desc}</p>
          </motion.div>
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
    <section className={styles.section} id="testimonials" data-gsap="testimonials">
      <div data-gsap="testimonials-header">
        <p className={styles.sectionLabel}>Customer Stories</p>
        <h2 className={styles.sectionHeading}>
          Trusted by businesses
          <br />
          across South Asia
        </h2>
      </div>
      <div className={styles.testimonialsGrid} data-gsap="testimonials-grid">
        {TESTIMONIALS.map(({ quote, name, role, initial, avatarClass }) => (
          <motion.div
            key={name}
            className={styles.testimonialCard}
            data-gsap="testimonial-card"
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
    <section className={styles.section} id="pricing" data-gsap="pricing">
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
        <div className={styles.pricingGrid} data-gsap="pricing-grid">
          {PLANS.map((plan) => (
            <motion.div
              key={plan.tier}
              className={`${styles.planCard} ${styles[plan.style]}`}
              data-gsap="plan-card"
              whileHover={{ y: -6, boxShadow: "0 20px 50px rgba(99,102,241,0.18)" }}
              transition={{ type: "spring", stiffness: 280, damping: 20 }}
            >
              {plan.popular && (
                <div className={styles.popularBadge} data-gsap="popular-badge">
                  ⭐ Most Popular
                </div>
              )}
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
    <section className={styles.section} id="faq" data-gsap="faq">
      <p className={styles.sectionLabel}>FAQ</p>
      <h2 className={styles.sectionHeading}>Common questions</h2>
      <div className={styles.faqList}>
        {FAQS.map(({ q, a }) => {
          const isOpen = openFaq === q;
          return (
            <div key={q} className={styles.faqItem} data-gsap="faq-item">
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

function FinalCta({ onDemoClick }) {
  return (
    <div className={styles.finalCta} data-gsap="final-cta">
      <div className={styles.finalCtaGlow} />
      <h2 className={styles.finalCtaHeading} data-gsap="final-cta-heading">
        <span className={styles.lineWrap}>
          <span data-gsap="line-inner">Ready to streamline</span>
        </span>
        <br />
        <span className={styles.lineWrap}>
          <span data-gsap="line-inner">your inventory?</span>
        </span>
      </h2>
      <p className={styles.finalCtaSub} data-gsap="final-cta-sub">
        Join hundreds of businesses already running smarter with StockFlow.
      </p>
      <motion.button
        className={styles.btnPrimaryLg}
        onClick={onDemoClick}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        data-gsap="final-cta-btn"
      >
        Request a Demo <span aria-hidden="true">→</span>
      </motion.button>
    </div>
  );
}

function Footer({ onDemoClick }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        <div>
          <a href="#hero" className={styles.logo} style={{ fontSize: 18 }}>
            ⬡ StockFlow
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
        <span>Built for SMBs in South Asia 🌍</span>
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
  const pageRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") setModalOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  useGSAP(
    () => {
      // ── NAV LOAD ──
      const navEl = document.querySelector('[data-gsap="nav"]');
      const logo = document.querySelector('[data-gsap="nav-logo"]');
      const navLinks = gsap.utils.toArray('[data-gsap="nav-links"] a');
      const navCta = document.querySelector('[data-gsap="nav-cta"]');

      gsap
        .timeline({ delay: 0.1 })
        .from(logo, { x: -30, opacity: 0, duration: 0.5, ease: "power3.out" })
        .from(navLinks, { x: 20, opacity: 0, stagger: 0.06, duration: 0.4, ease: "power3.out" }, "-=0.3")
        .from(navCta, { scale: 0.8, opacity: 0, duration: 0.4, ease: "back.out(1.7)" }, "-=0.2");

      // ── NAV SCROLL STATE ──
      ScrollTrigger.create({
        trigger: '[data-gsap="hero"]',
        start: "bottom top",
        toggleClass: { targets: navEl, className: styles.navScrolled },
      });

      // ── HERO LOAD ──
      const heroBadge = document.querySelector('[data-gsap="hero-badge"]');
      const heroLines = gsap.utils.toArray('[data-gsap="hero-heading"] [data-gsap="line-inner"]');
      const heroSub = document.querySelector('[data-gsap="hero-sub"]');
      const heroCtaEl = document.querySelector('[data-gsap="hero-cta"]');
      const heroCardEl = document.querySelector('[data-gsap="hero-card"]');

      gsap
        .timeline({ delay: 0.25 })
        .from(heroBadge, { y: -20, opacity: 0, duration: 0.4, ease: "power3.out" })
        .fromTo(
          heroLines,
          { clipPath: "inset(100% 0 0 0)", y: 30 },
          { clipPath: "inset(0% 0 0 0)", y: 0, stagger: 0.18, duration: 0.65, ease: "power4.out" },
          "-=0.15"
        )
        .from(heroSub, { opacity: 0, y: 20, duration: 0.5, ease: "power3.out" }, "-=0.3")
        .from(heroCtaEl, { opacity: 0, y: 20, duration: 0.4, ease: "power3.out" }, "-=0.3")
        .from(heroCardEl, { opacity: 0, y: 40, duration: 0.5, ease: "power3.out" }, "-=0.2");

      // ── HERO SCROLL PARALLAX ──
      gsap.to('[data-gsap="hero-card"]', {
        y: -60,
        ease: "none",
        scrollTrigger: {
          trigger: '[data-gsap="hero"]',
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });

      // Background orb scales subtly on scroll for cinematic depth
      gsap.to(".page-bg-orb", {
        scale: 1.08,
        ease: "none",
        scrollTrigger: {
          trigger: '[data-gsap="hero"]',
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });

      // ── AMBIENT GLOW LOOP ──
      if (glowRef.current) {
        gsap.to(glowRef.current, {
          y: 50,
          x: 40,
          scale: 1.12,
          duration: 7,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      }

      // ── FEATURES ──
      const featuresSection = document.querySelector('[data-gsap="features"]');
      const featureCards = gsap.utils.toArray('[data-gsap="feature-card"]');
      const featureIcons = gsap.utils.toArray('[data-gsap="feature-icon"]');
      const featuresHeader = document.querySelector('[data-gsap="features-header"]');
      const mm = gsap.matchMedia();

      mm.add("(min-width: 769px)", () => {
        gsap.from(featuresHeader, {
          opacity: 0,
          y: 30,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: featuresSection,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });

        gsap.set(featuresSection, { perspective: 1000 });

        ScrollTrigger.create({
          trigger: featuresSection,
          start: "top top",
          end: "+=500",
          pin: true,
          anticipatePin: 1,
          onEnter: () => {
            gsap.fromTo(
              featureCards,
              {
                x: (i) => (i % 2 === 0 ? -120 : 120),
                opacity: 0,
                rotateX: 8,
                filter: "blur(8px)",
                scale: 0.96,
              },
              {
                x: 0,
                opacity: 1,
                rotateX: 0,
                filter: "blur(0px)",
                scale: 1,
                stagger: 0.1,
                duration: 0.7,
                ease: "power3.out",
              }
            );
            gsap.from(featureIcons, {
              scale: 0,
              ease: "elastic.out(1, 0.5)",
              duration: 1,
              stagger: 0.1,
              delay: 0.35,
            });
          },
        });
      });

      mm.add("(max-width: 768px)", () => {
        gsap.from(featureCards, {
          opacity: 0,
          y: 40,
          stagger: 0.08,
          duration: 0.5,
          ease: "power3.out",
          scrollTrigger: {
            trigger: featuresSection,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      });

      // ── PRICING ──
      const pricingSection = document.querySelector('[data-gsap="pricing"]');
      const planCards = gsap.utils.toArray('[data-gsap="plan-card"]');
      const popularBadge = document.querySelector('[data-gsap="popular-badge"]');

      gsap.fromTo(
        planCards,
        { y: 100, opacity: 0, scale: 0.92, filter: "blur(10px)" },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          stagger: 0.12,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: pricingSection,
            start: "top 75%",
            toggleActions: "play none none none",
          },
        }
      );

      if (popularBadge) {
        gsap.fromTo(
          popularBadge,
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            ease: "back.out(2)",
            duration: 0.5,
            delay: 0.5,
            scrollTrigger: {
              trigger: pricingSection,
              start: "top 75%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // ── TESTIMONIALS ──
      const testimonialsSection = document.querySelector('[data-gsap="testimonials"]');
      const testimonialsGrid = document.querySelector('[data-gsap="testimonials-grid"]');
      const testimonialCards = gsap.utils.toArray('[data-gsap="testimonial-card"]');
      const testimonialsHeader = document.querySelector('[data-gsap="testimonials-header"]');

      mm.add("(min-width: 769px)", () => {
        gsap.from(testimonialsHeader, {
          opacity: 0,
          y: 30,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: testimonialsSection,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });

        // Start cards slightly faded for blur-to-focus reveal during scroll
        gsap.set(testimonialCards, { opacity: 0.45, filter: "blur(4px)", scale: 0.97 });
        gsap.to(testimonialCards, {
          opacity: 1,
          filter: "blur(0px)",
          scale: 1,
          stagger: 0.15,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: testimonialsSection,
            start: "top 70%",
            toggleActions: "play none none none",
          },
        });

        // Horizontal scroll pin — grid travels left as user scrolls down
        gsap.set(testimonialsGrid, {
          display: "flex",
          flexWrap: "nowrap",
          width: "max-content",
          gap: "16px",
        });

        const getScrollAmount = () => -(testimonialsGrid.scrollWidth - testimonialsSection.clientWidth + 120);

        gsap.to(testimonialsGrid, {
          x: getScrollAmount,
          ease: "none",
          scrollTrigger: {
            trigger: testimonialsSection,
            start: "top top",
            end: () => `+=${Math.abs(getScrollAmount())}`,
            pin: true,
            anticipatePin: 1,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
      });

      mm.add("(max-width: 768px)", () => {
        gsap.from(testimonialCards, {
          opacity: 0,
          y: 40,
          stagger: 0.1,
          duration: 0.5,
          ease: "power3.out",
          scrollTrigger: {
            trigger: testimonialsSection,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      });

      // ── FAQ ──
      const faqSection = document.querySelector('[data-gsap="faq"]');
      const faqItems = gsap.utils.toArray('[data-gsap="faq-item"]');

      gsap.fromTo(
        faqItems,
        { clipPath: "inset(0 100% 0 0)", opacity: 0, y: 24, filter: "blur(6px)" },
        {
          clipPath: "inset(0 0% 0 0)",
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          stagger: 0.1,
          duration: 0.55,
          ease: "power3.inOut",
          scrollTrigger: {
            trigger: faqSection,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );

      // ── FINAL CTA ──
      const finalCtaEl = document.querySelector('[data-gsap="final-cta"]');
      const finalCtaLines = gsap.utils.toArray('[data-gsap="final-cta-heading"] [data-gsap="line-inner"]');
      const finalCtaSub = document.querySelector('[data-gsap="final-cta-sub"]');
      const finalCtaBtn = document.querySelector('[data-gsap="final-cta-btn"]');
      const finalCtaGlow = finalCtaEl?.querySelector(`.${styles.finalCtaGlow}`);

      gsap
        .timeline({
          scrollTrigger: {
            trigger: finalCtaEl,
            start: "top 75%",
            toggleActions: "play none none none",
          },
        })
        .fromTo(
          finalCtaLines,
          { clipPath: "inset(100% 0 0 0)", y: 30 },
          { clipPath: "inset(0% 0 0 0)", y: 0, stagger: 0.15, duration: 0.65, ease: "power4.out" }
        )
        .from(finalCtaSub, { opacity: 0, y: 16, duration: 0.4, ease: "power3.out" }, "-=0.2")
        .fromTo(
          finalCtaBtn,
          { scale: 0.85, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" },
          "-=0.15"
        )
        .to(finalCtaGlow, { opacity: 1, duration: 0.8, ease: "power2.out" }, "-=0.25");

      // ── SECTION CONTINUITY ──
      const transitionSections = gsap.utils.toArray(
        '[data-gsap="features"], [data-gsap="pricing"], [data-gsap="testimonials"], [data-gsap="faq"]'
      );

      transitionSections.forEach((section) => {
        gsap.to(section, {
          scale: 0.97,
          opacity: 0.75,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "bottom 70%",
            end: "bottom 20%",
            scrub: true,
          },
        });
      });
    },
    { scope: pageRef, dependencies: [] }
  );

  return (
    <>
      <Head>
        <title>StockFlow — Inventory Management for Modern Businesses</title>
        <meta
          name="description"
          content="StockFlow brings real-time inventory tracking, integrated accounting, and smart order management for SMBs."
        />
      </Head>
      <div className={styles.page} ref={pageRef}>
        <Nav onDemoClick={() => setModalOpen(true)} />
        <Hero onDemoClick={() => setModalOpen(true)} glowRef={glowRef} />
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
