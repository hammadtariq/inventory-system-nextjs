# StockFlow Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public `/landing` page for StockFlow with 7 sections (Nav, Hero, Features, Pricing, Testimonials, FAQ, Footer), a demo request modal, and full mobile responsiveness using the Aurora Light liquid glass theme.

**Architecture:** Two files only — `pages/landing.js` (all JSX, local sub-components, React state) and `styles/Landing.module.css` (all styles). No new dependencies. The page is public — no auth wrapper. State for the modal open/close and FAQ open-item lives in the top-level `Landing` component and is passed as props.

**Tech Stack:** Next.js 16 Pages Router, React 19, CSS Modules, no external UI libraries.

---

## File Map

| File                        | Action | Responsibility                                                                                                 |
| --------------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| `pages/landing.js`          | Create | All page JSX — Nav, Hero, Features, Pricing, Testimonials, FAQ, FinalCta, Footer, DemoModal as local functions |
| `styles/Landing.module.css` | Create | All styles, media queries, glass effects                                                                       |
| `styles/globals.css`        | Modify | Add `scroll-behavior: smooth` to `html`                                                                        |

---

## Task 1: Scaffold both files + global scroll

**Files:**

- Create: `pages/landing.js`
- Create: `styles/Landing.module.css`
- Modify: `styles/globals.css`

- [ ] **Step 1: Add scroll-behavior to globals.css**

Open `styles/globals.css`. Add `scroll-behavior: smooth;` to the existing `html, body` rule:

```css
html,
body {
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica
      Neue, sans-serif;
  scroll-behavior: smooth;
}
```

- [ ] **Step 2: Create `styles/Landing.module.css` with page wrapper and nav**

Create `styles/Landing.module.css` with the content below. This is the full CSS file — subsequent tasks only add to it, never replace it.

```css
/* ── PAGE ── */
.page {
  background: linear-gradient(160deg, #f0f4ff 0%, #faf5ff 45%, #f0fdf4 100%);
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  color: #1e1b4b;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.page::before {
  content: "";
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%);
  top: -200px;
  right: -100px;
  border-radius: 50%;
  pointer-events: none;
}

.page::after {
  content: "";
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%);
  bottom: 200px;
  left: -100px;
  border-radius: 50%;
  pointer-events: none;
}

/* ── NAV ── */
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 60px;
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.8);
}

.logo {
  font-size: 20px;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-decoration: none;
}

.navLinks {
  display: flex;
  gap: 28px;
  font-size: 13px;
}

.navLinks a {
  text-decoration: none;
  color: #4b5563;
  transition: color 0.15s;
}

.navLinks a:hover {
  color: #6366f1;
}

.navCta {
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);
  white-space: nowrap;
  font-family: inherit;
}

/* ── SHARED BUTTONS ── */
.btnPrimary {
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 14px 32px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
  text-decoration: none;
  display: inline-block;
  font-family: inherit;
}

.btnSecondary {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 10px;
  padding: 14px 28px;
  font-size: 15px;
  font-weight: 600;
  color: #6366f1;
  cursor: pointer;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  text-decoration: none;
  display: inline-block;
  font-family: inherit;
}

/* ── SHARED SECTION ── */
.section {
  padding: 80px 60px;
  position: relative;
  z-index: 2;
}

.sectionLabel {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #7c3aed;
  margin-bottom: 12px;
  text-align: center;
}

.sectionHeading {
  font-size: 36px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
  text-align: center;
}

.sectionSub {
  font-size: 16px;
  color: #6b7280;
  max-width: 500px;
  line-height: 1.7;
  text-align: center;
  margin: 0 auto;
}
```

- [ ] **Step 3: Create `pages/landing.js` with the full component skeleton**

```jsx
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
        <p style={{ padding: "40px 60px", color: "#6b7280" }}>Sections coming soon...</p>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Start dev server and verify the page loads at `/landing`**

```bash
pnpm dev
```

Open `http://localhost:3000/landing`. Expected: page with gradient background, sticky glass nav, logo "⬡ StockFlow", nav links, and "Request a Demo" button. No errors in console.

- [ ] **Step 5: Commit**

```bash
git add pages/landing.js styles/Landing.module.css styles/globals.css
git commit -m "feat: scaffold StockFlow landing page with nav"
```

---

## Task 2: Hero section

**Files:**

- Modify: `pages/landing.js` — replace placeholder `<p>` with `<Hero>` and add `Hero` component
- Modify: `styles/Landing.module.css` — append hero CSS

- [ ] **Step 1: Append hero CSS to `styles/Landing.module.css`**

```css
/* ── HERO ── */
.hero {
  text-align: center;
  padding: 100px 60px 80px;
  position: relative;
  z-index: 2;
}

.heroBadge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 12px;
  color: #7c3aed;
  font-weight: 600;
  margin-bottom: 28px;
}

.heroHeading {
  font-size: 56px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0 auto 20px;
  max-width: 760px;
  color: #1e1b4b;
}

.heroGradient {
  background: linear-gradient(135deg, #6366f1, #7c3aed, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.heroSub {
  font-size: 18px;
  color: #6b7280;
  max-width: 520px;
  margin: 0 auto 40px;
  line-height: 1.7;
  text-align: center;
}

.heroCtaRow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
}

.heroCard {
  max-width: 760px;
  margin: 60px auto 0;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(99, 102, 241, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06);
}

.heroCardHeader {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dotRed {
  background: #ff5f57;
}
.dotYellow {
  background: #febc2e;
}
.dotGreen {
  background: #28c840;
}

.cardStats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.statChip {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.05));
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 10px;
  padding: 12px 14px;
  text-align: center;
}

.statVal {
  font-size: 18px;
  font-weight: 700;
  color: #6366f1;
}

.statLbl {
  font-size: 10px;
  color: #9ca3af;
  margin-top: 2px;
}
```

- [ ] **Step 2: Add `Hero` component and wire it into `Landing` in `pages/landing.js`**

Add the `Hero` function before `export default function Landing()`:

```jsx
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
          Request a Demo →
        </button>
        <a href="#pricing" className={styles.btnSecondary}>
          See Pricing
        </a>
      </div>
      <div className={styles.heroCard}>
        <div className={styles.heroCardHeader}>
          <span className={`${styles.dot} ${styles.dotRed}`} />
          <span className={`${styles.dot} ${styles.dotYellow}`} />
          <span className={`${styles.dot} ${styles.dotGreen}`} />
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
```

Replace the placeholder `<p>` inside `Landing` with `<Hero onDemoClick={() => setModalOpen(true)} />`.

- [ ] **Step 3: Verify hero renders correctly at `http://localhost:3000/landing`**

Expected: badge pill, large 3-line heading with gradient on the middle line, two CTA buttons, glass stat card with 4 chips below.

- [ ] **Step 4: Commit**

```bash
git add pages/landing.js styles/Landing.module.css
git commit -m "feat: add landing page hero section"
```

---

## Task 3: Features section

**Files:**

- Modify: `pages/landing.js` — add `Features` component
- Modify: `styles/Landing.module.css` — append features CSS

- [ ] **Step 1: Append features CSS to `styles/Landing.module.css`**

```css
/* ── FEATURES ── */
.featuresGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 48px;
}

.featureCard {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.07);
}

.featureIcon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin: 0 auto 14px;
}

.iconPurple {
  background: rgba(99, 102, 241, 0.12);
}
.iconViolet {
  background: rgba(139, 92, 246, 0.12);
}
.iconGreen {
  background: rgba(16, 185, 129, 0.12);
}
.iconBlue {
  background: rgba(59, 130, 246, 0.12);
}
.iconOrange {
  background: rgba(245, 158, 11, 0.12);
}
.iconPink {
  background: rgba(236, 72, 153, 0.12);
}

.featureTitle {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 6px;
  text-align: center;
  color: #1e1b4b;
}

.featureDesc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.6;
  text-align: center;
}
```

- [ ] **Step 2: Add `Features` component to `pages/landing.js`**

Add before `export default function Landing()`:

```jsx
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
```

Wire it into `Landing` after `<Hero>`:

```jsx
<Features />
```

- [ ] **Step 3: Verify at `http://localhost:3000/landing`**

Expected: section label "WHAT YOU GET", heading, subheading, 3-column grid of 6 glass cards each with colored emoji icon, title, and description text.

- [ ] **Step 4: Commit**

```bash
git add pages/landing.js styles/Landing.module.css
git commit -m "feat: add landing page features section"
```

---

## Task 4: Pricing section

**Files:**

- Modify: `pages/landing.js` — add `Pricing` component
- Modify: `styles/Landing.module.css` — append pricing CSS

- [ ] **Step 1: Append pricing CSS to `styles/Landing.module.css`**

```css
/* ── PRICING ── */
.pricingBg {
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 60px;
}

.toggleWrap {
  display: flex;
  justify-content: center;
  margin: 24px 0 48px;
}

.planToggle {
  display: inline-flex;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 10px;
  padding: 4px;
}

.planToggleBtn {
  padding: 7px 20px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  color: #6b7280;
  white-space: nowrap;
  background: none;
  border: none;
  font-family: inherit;
}

.planToggleActive {
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  color: #fff;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.pricingGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.planCard {
  border-radius: 16px;
  padding: 32px 28px;
  position: relative;
}

.planSilver {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
}

.planGold {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 2px solid rgba(99, 102, 241, 0.35);
  box-shadow: 0 12px 40px rgba(99, 102, 241, 0.15);
}

.planPlatinum {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(168, 85, 247, 0.08));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 92, 246, 0.3);
  box-shadow: 0 8px 30px rgba(139, 92, 246, 0.1);
}

.popularBadge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  color: #fff;
  border-radius: 20px;
  padding: 4px 16px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.planTier {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #9ca3af;
  margin-bottom: 12px;
}

.planTierGold {
  color: #7c3aed;
}

.planPrice {
  font-size: 42px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #1e1b4b;
  line-height: 1;
}

.planPriceSup {
  font-size: 20px;
  vertical-align: top;
  margin-top: 8px;
  font-weight: 800;
}

.planPriceSub {
  font-size: 14px;
  font-weight: 500;
  color: #9ca3af;
}

.planDesc {
  font-size: 12px;
  color: #6b7280;
  margin: 8px 0 24px;
}

.planFeatures {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 28px;
  padding: 0;
}

.planFeatureItem {
  font-size: 13px;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.planFeatureItem::before {
  content: "✓";
  color: #6366f1;
  font-weight: 700;
  font-size: 12px;
  flex-shrink: 0;
}

.planBtn {
  width: 100%;
  padding: 12px;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  font-family: inherit;
}

.btnOutlinePlan {
  background: transparent;
  border: 1.5px solid rgba(99, 102, 241, 0.35);
  color: #6366f1;
}

.btnFillPlan {
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  color: #fff;
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
}

.btnGhostPlan {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.25);
  color: #7c3aed;
}
```

- [ ] **Step 2: Add `Pricing` component to `pages/landing.js`**

```jsx
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
              <p className={`${styles.planTier} ${plan.tierClass === "planTierGold" ? styles.planTierGold : ""}`}>
                {plan.tier}
              </p>
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
```

Wire into `Landing` after `<Features />`:

```jsx
<Pricing onDemoClick={() => setModalOpen(true)} />
```

Note: `Pricing` has its own `useState` for the toggle — import is already at the top of the file.

- [ ] **Step 3: Verify at `http://localhost:3000/landing`**

Expected: glass panel with 3 plan cards. Gold card has a "Most Popular" badge above it. Toggle buttons switch the active state. All plan CTAs are clickable (modal not yet built — no visible effect yet).

- [ ] **Step 4: Commit**

```bash
git add pages/landing.js styles/Landing.module.css
git commit -m "feat: add landing page pricing section"
```

---

## Task 5: Testimonials section

**Files:**

- Modify: `pages/landing.js` — add `Testimonials` component
- Modify: `styles/Landing.module.css` — append testimonials CSS

- [ ] **Step 1: Append testimonials CSS to `styles/Landing.module.css`**

```css
/* ── TESTIMONIALS ── */
.testimonialsGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 48px;
}

.testimonialCard {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.stars {
  color: #f59e0b;
  font-size: 13px;
  margin-bottom: 14px;
  text-align: center;
}

.testimonialQuote {
  font-size: 13px;
  color: #374151;
  line-height: 1.7;
  margin-bottom: 16px;
  font-style: italic;
  text-align: center;
}

.author {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  flex-shrink: 0;
}

.avatarA {
  background: linear-gradient(135deg, #6366f1, #7c3aed);
}
.avatarB {
  background: linear-gradient(135deg, #059669, #10b981);
}
.avatarC {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
}

.authorName {
  font-size: 13px;
  font-weight: 700;
  color: #1e1b4b;
}

.authorRole {
  font-size: 11px;
  color: #9ca3af;
}
```

- [ ] **Step 2: Add `Testimonials` component to `pages/landing.js`**

```jsx
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
```

Wire into `Landing` after `<Pricing>`:

```jsx
<Testimonials />
```

- [ ] **Step 3: Verify at `http://localhost:3000/landing`**

Expected: 3 glass cards in a row, each with 5 gold stars, italic quote in curly quotes, avatar circle with initial, name and role.

- [ ] **Step 4: Commit**

```bash
git add pages/landing.js styles/Landing.module.css
git commit -m "feat: add landing page testimonials section"
```

---

## Task 6: FAQ accordion section

**Files:**

- Modify: `pages/landing.js` — add `Faq` component
- Modify: `styles/Landing.module.css` — append FAQ CSS

- [ ] **Step 1: Append FAQ CSS to `styles/Landing.module.css`**

```css
/* ── FAQ ── */
.faqList {
  max-width: 680px;
  margin: 48px auto 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.faqItem {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.faqToggle {
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  text-align: left;
  font-family: inherit;
}

.faqQuestion {
  font-size: 14px;
  font-weight: 700;
  color: #1e1b4b;
}

.faqChevron {
  font-size: 18px;
  color: #9ca3af;
  transition: transform 0.25s ease;
  flex-shrink: 0;
  display: inline-block;
}

.faqChevronOpen {
  transform: rotate(90deg);
}

.faqBody {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.faqBodyOpen {
  max-height: 200px;
}

.faqAnswer {
  font-size: 13px;
  color: #6b7280;
  padding: 0 24px 20px;
  line-height: 1.7;
}
```

- [ ] **Step 2: Add `Faq` component to `pages/landing.js`**

```jsx
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
```

Wire into `Landing` after `<Testimonials />`:

```jsx
<Faq openFaq={openFaq} setOpenFaq={setOpenFaq} />
```

- [ ] **Step 3: Verify accordion behavior at `http://localhost:3000/landing`**

Click any FAQ question — the answer should expand with a smooth animation. The chevron rotates 90 degrees. Clicking the same question collapses it. Clicking a different question collapses the first and opens the new one.

- [ ] **Step 4: Commit**

```bash
git add pages/landing.js styles/Landing.module.css
git commit -m "feat: add landing page FAQ accordion"
```

---

## Task 7: Final CTA banner + Footer

**Files:**

- Modify: `pages/landing.js` — add `FinalCta` and `Footer` components
- Modify: `styles/Landing.module.css` — append final CTA + footer CSS

- [ ] **Step 1: Append final CTA and footer CSS to `styles/Landing.module.css`**

```css
/* ── FINAL CTA ── */
.finalCta {
  margin: 0 60px 80px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.1));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 24px;
  padding: 72px 60px;
  text-align: center;
  box-shadow: 0 8px 40px rgba(99, 102, 241, 0.1);
  position: relative;
  z-index: 2;
}

.finalCtaHeading {
  font-size: 40px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 14px;
  color: #1e1b4b;
}

.finalCtaSub {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 36px;
  text-align: center;
}

.btnPrimaryLg {
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 16px 40px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
  font-family: inherit;
}

/* ── FOOTER ── */
.footer {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.7);
  padding: 48px 60px 32px;
  position: relative;
  z-index: 2;
}

.footerGrid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 40px;
  margin-bottom: 40px;
}

.footerBrandText {
  font-size: 13px;
  color: #6b7280;
  margin-top: 10px;
  line-height: 1.6;
  max-width: 220px;
}

.footerColHeading {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
  margin-bottom: 14px;
}

.footerLink {
  display: block;
  font-size: 13px;
  color: #4b5563;
  text-decoration: none;
  margin-bottom: 8px;
  transition: color 0.15s;
}

.footerLink:hover {
  color: #6366f1;
}

.footerLinkBtn {
  display: block;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: #4b5563;
  margin-bottom: 8px;
  padding: 0;
  text-align: left;
  font-family: inherit;
  transition: color 0.15s;
}

.footerLinkBtn:hover {
  color: #6366f1;
}

.footerBottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.07);
  font-size: 12px;
  color: #9ca3af;
  flex-wrap: wrap;
  gap: 8px;
}
```

- [ ] **Step 2: Add `FinalCta` and `Footer` components to `pages/landing.js`**

```jsx
function FinalCta({ onDemoClick }) {
  return (
    <div className={styles.finalCta}>
      <h2 className={styles.finalCtaHeading}>
        Ready to streamline
        <br />
        your inventory?
      </h2>
      <p className={styles.finalCtaSub}>Join hundreds of businesses already running smarter with StockFlow.</p>
      <button className={styles.btnPrimaryLg} onClick={onDemoClick}>
        Request a Demo →
      </button>
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
          <a href="/about" className={styles.footerLink}>
            About
          </a>
          <a href="/blog" className={styles.footerLink}>
            Blog
          </a>
          <button className={styles.footerLinkBtn} onClick={onDemoClick}>
            Contact Us
          </button>
        </div>
        <div>
          <p className={styles.footerColHeading}>Legal</p>
          <a href="/privacy" className={styles.footerLink}>
            Privacy Policy
          </a>
          <a href="/terms" className={styles.footerLink}>
            Terms of Service
          </a>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <span>© 2026 StockFlow. All rights reserved.</span>
        <span>Built for SMBs in South Asia 🌍</span>
      </div>
    </footer>
  );
}
```

Wire both into `Landing` after `<Faq>`:

```jsx
<FinalCta onDemoClick={() => setModalOpen(true)} />
<Footer onDemoClick={() => setModalOpen(true)} />
```

- [ ] **Step 3: Verify at `http://localhost:3000/landing`**

Scroll to the bottom. Expected: purple-tinted glass CTA banner with heading, subtext, and large CTA button. Below it a 4-column footer with all links. Product column links scroll to page anchors. Footer "Contact Us" is a button (no underline). Copyright bar at the very bottom.

- [ ] **Step 4: Commit**

```bash
git add pages/landing.js styles/Landing.module.css
git commit -m "feat: add landing page final CTA and footer"
```

---

## Task 8: Demo modal

**Files:**

- Modify: `pages/landing.js` — add `DemoModal` component and render it
- Modify: `styles/Landing.module.css` — append modal CSS

- [ ] **Step 1: Append modal CSS to `styles/Landing.module.css`**

```css
/* ── DEMO MODAL ── */
.modalOverlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(30, 27, 74, 0.4);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 200;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modalOverlayOpen {
  display: flex;
}

.modal {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 30px 80px rgba(99, 102, 241, 0.2);
  position: relative;
}

.modalClose {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #9ca3af;
  line-height: 1;
  font-family: inherit;
}

.modalHeading {
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 6px;
  text-align: center;
  color: #1e1b4b;
}

.modalSub {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 28px;
  text-align: center;
}

.formGroup {
  margin-bottom: 16px;
}

.formLabel {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.formInput,
.formSelect {
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  background: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  color: #1e1b4b;
  outline: none;
  font-family: inherit;
}

.formInput:focus,
.formSelect:focus {
  border-color: rgba(99, 102, 241, 0.5);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.formSubmit {
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
  margin-top: 8px;
  font-family: inherit;
}
```

- [ ] **Step 2: Add `DemoModal` component to `pages/landing.js`**

Add before `export default function Landing()`:

```jsx
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
    <div className={`${styles.modalOverlay} ${open ? styles.modalOverlayOpen : ""}`} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h3 className={styles.modalHeading}>Request a Demo</h3>
        <p className={styles.modalSub}>We will reach out within 24 hours to schedule your walkthrough.</p>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Full Name</label>
            <input className={styles.formInput} type="text" placeholder="Your name" required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Business Email</label>
            <input className={styles.formInput} type="email" placeholder="you@company.com" required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Company Name</label>
            <input className={styles.formInput} type="text" placeholder="Your company" required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Team Size</label>
            <select className={styles.formSelect}>
              <option>1 to 10 employees</option>
              <option>11 to 50 employees</option>
              <option>51 to 200 employees</option>
              <option>200+ employees</option>
            </select>
          </div>
          <button type="submit" className={styles.formSubmit}>
            Submit Request →
          </button>
        </form>
      </div>
    </div>
  );
}
```

Wire into `Landing` — add inside `<div className={styles.page}>` before the closing `</div>`, after `<Footer>`:

```jsx
<DemoModal open={modalOpen} onClose={() => setModalOpen(false)} />
```

Also add a `useEffect` for the Escape key at the top of the `Landing` function body:

```jsx
import { useState, useEffect } from "react";

// inside Landing():
useEffect(() => {
  function handleKey(e) {
    if (e.key === "Escape") setModalOpen(false);
  }
  document.addEventListener("keydown", handleKey);
  return () => document.removeEventListener("keydown", handleKey);
}, []);
```

- [ ] **Step 3: Verify modal behavior at `http://localhost:3000/landing`**

Click any "Request a Demo" button. Expected: frosted glass modal with 4 form fields. Clicking outside the modal, pressing Escape, or clicking ✕ closes it. Submitting the form logs to console and closes the modal.

- [ ] **Step 4: Commit**

```bash
git add pages/landing.js styles/Landing.module.css
git commit -m "feat: add demo request modal to landing page"
```

---

## Task 9: Mobile responsive CSS

**Files:**

- Modify: `styles/Landing.module.css` — append all media query rules

- [ ] **Step 1: Append responsive CSS to `styles/Landing.module.css`**

```css
/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .nav {
    padding: 14px 20px;
  }

  .navLinks {
    display: none;
  }

  .hero {
    padding: 60px 20px 50px;
  }

  .heroHeading {
    font-size: 32px;
  }

  .heroSub {
    font-size: 15px;
  }

  .heroCard {
    padding: 16px;
  }

  .cardStats {
    grid-template-columns: repeat(2, 1fr);
  }

  .statVal {
    font-size: 15px;
  }

  .section {
    padding: 56px 20px;
  }

  .sectionHeading {
    font-size: 28px;
  }

  .featuresGrid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .pricingBg {
    padding: 40px 20px;
  }

  .planToggle {
    width: 100%;
  }

  .planToggleBtn {
    flex: 1;
    text-align: center;
    padding: 9px 8px;
    font-size: 12px;
  }

  .pricingGrid {
    grid-template-columns: 1fr;
  }

  .planCard.planGold {
    margin-top: 12px;
  }

  .testimonialsGrid {
    grid-template-columns: 1fr;
  }

  .finalCta {
    margin: 0 20px 60px;
    padding: 48px 24px;
  }

  .finalCtaHeading {
    font-size: 28px;
  }

  .footer {
    padding: 40px 20px 24px;
  }

  .footerGrid {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
}

@media (max-width: 400px) {
  .featuresGrid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Verify mobile layout using browser DevTools**

Open `http://localhost:3000/landing`. In Chrome DevTools toggle device toolbar to iPhone 12 Pro (390px wide). Verify:

- Nav shows only logo + CTA button (links hidden)
- Hero headline is ~32px
- Stats grid is 2 columns
- Features grid is 2 columns
- Pricing cards stack to 1 column
- Plan toggle spans full width with no text wrapping
- Testimonials stack to 1 column
- Footer is 2 columns

- [ ] **Step 3: Commit**

```bash
git add styles/Landing.module.css
git commit -m "feat: add mobile responsive styles to landing page"
```

---

## Task 10: Final wiring check and clean up

**Files:**

- Modify: `pages/landing.js` — verify all imports and final component tree

- [ ] **Step 1: Verify the final `Landing` component return block**

The full `export default function Landing()` should look exactly like this:

```jsx
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
        <FinalCta onDemoClick={() => setModalOpen(true)} />
        <Footer onDemoClick={() => setModalOpen(true)} />
        <DemoModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    </>
  );
}
```

Verify the top import reads:

```jsx
import { useState, useEffect } from "react";
import Head from "next/head";
import styles from "@/styles/Landing.module.css";
```

- [ ] **Step 2: Run linter**

```bash
pnpm lint
```

Expected: no errors. Fix any reported issues before continuing.

- [ ] **Step 3: Full smoke test — walk through every interactive element**

At `http://localhost:3000/landing`:

1. Click each nav link — page scrolls to the correct section
2. Click "See Pricing" in hero — scrolls to pricing section
3. Click "Request a Demo" in nav — modal opens
4. Press Escape — modal closes
5. Click outside modal — modal closes
6. Submit the demo form — console logs, modal closes
7. Click "Contact Us" in footer — modal opens
8. Toggle pricing buttons (Monthly / 6 Months / Annual) — active state changes
9. Open and close each FAQ item — only one open at a time

- [ ] **Step 4: Final commit**

```bash
git add pages/landing.js styles/Landing.module.css
git commit -m "feat: complete StockFlow landing page (issue #178)"
```
