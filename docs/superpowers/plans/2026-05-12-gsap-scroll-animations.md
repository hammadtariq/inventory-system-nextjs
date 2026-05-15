# GSAP Bold Scroll Animations — Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add bold, dramatic GSAP ScrollTrigger scroll animations to the StockFlow landing page — cinematic word-line reveals, section pins, directional card wipes, horizontal scroll, and ambient glow loops.

**Architecture:** All GSAP animations live in a single `useGSAP` hook scoped to the page root ref (`pageRef`). Framer Motion is kept only for `whileHover`/`whileTap`/`AnimatePresence` modal. ScrollTrigger drives all scroll effects. Headings are pre-structured with `data-gsap="line-inner"` spans for clip-path line reveals (avoids innerHTML hacking that would destroy gradient spans). All desktop-only pins are guarded with `gsap.matchMedia()`.

**Tech Stack:** GSAP 3.x, @gsap/react (`useGSAP` hook), ScrollTrigger, Framer Motion (kept for micro-interactions), Next.js Pages Router

---

## Files to Modify

| File                        | What changes                                                                                                               |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `package.json`              | Add `gsap`, `@gsap/react`                                                                                                  |
| `pages/landing.js`          | Add imports, refs, data-gsap attrs, pre-structured headings, `useGSAP` animations, remove conflicting Framer `whileInView` |
| `styles/Landing.module.css` | Add `.navScrolled`, `.ambientGlow`, `.finalCtaGlow`, `.lineWrap`                                                           |

---

### Task 1: Install GSAP packages

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
pnpm add gsap @gsap/react
```

Expected: both packages listed in `node_modules/gsap` and `node_modules/@gsap/react`.

- [ ] **Step 2: Sanity-check install**

```bash
node -e "require('gsap'); require('@gsap/react'); console.log('ok')"
```

Expected output: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add gsap and @gsap/react"
```

---

### Task 2: Add CSS animation utility classes

**Files:**

- Modify: `styles/Landing.module.css`

- [ ] **Step 1: Append these classes to the end of `styles/Landing.module.css`**

```css
/* ── GSAP ANIMATION UTILITIES ── */
.navScrolled {
  box-shadow: 0 4px 24px rgba(99, 102, 241, 0.14);
  background: rgba(255, 255, 255, 0.95);
}

/* Line-reveal: outer clips, inner translates */
.lineWrap {
  display: inline-block;
  overflow: hidden;
  vertical-align: bottom;
}

.ambientGlow {
  position: absolute;
  width: 640px;
  height: 640px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, transparent 70%);
  border-radius: 50%;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 0;
  will-change: transform;
}

.finalCtaGlow {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
  opacity: 0;
  pointer-events: none;
  will-change: opacity;
}
```

- [ ] **Step 2: Commit**

```bash
git add styles/Landing.module.css
git commit -m "feat: add GSAP animation utility CSS classes"
```

---

### Task 3: Restructure JSX — data-gsap attrs, line spans, refs, imports

**Files:**

- Modify: `pages/landing.js`

This task rewrites the component JSX to add `data-gsap` attributes, pre-structure animated headings with line spans, add the ambient glow div, and wire up `pageRef` + `glowRef`. No animation code yet.

- [ ] **Step 1: Replace the imports block (top of file)**

```js
import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import styles from "@/styles/Landing.module.css";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);
```

- [ ] **Step 2: Replace the `Nav` component**

Add `data-gsap` attributes to the nav elements so GSAP can select them without hashed CSS class names:

```jsx
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
```

- [ ] **Step 3: Replace the `Hero` component**

Key changes: remove Framer stagger/fadeUp variants (GSAP now owns load animation), add ambient glow div, accept `glowRef` prop, pre-structure h1 with `lineWrap` + `data-gsap="line-inner"` spans to preserve the gradient span while enabling clip-path animation:

```jsx
function Hero({ onDemoClick, glowRef }) {
  return (
    <section className={styles.hero} id="hero" data-gsap="hero">
      <div className={styles.ambientGlow} ref={glowRef} />
      <div>
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
```

- [ ] **Step 4: Replace the `Features` component**

Remove Framer `whileInView` from section wrapper. Keep `whileHover` on cards. Add `data-gsap` attrs:

```jsx
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
```

- [ ] **Step 5: Replace the `Pricing` component**

Remove Framer `whileInView` from section and grid wrappers. Keep `whileHover`/`whileTap` on cards and buttons. Add `data-gsap` attrs. Change `motion.section` to `section` and `motion.div` grid wrapper to `div`:

```jsx
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
```

- [ ] **Step 6: Replace the `Testimonials` component**

Remove Framer `whileInView` wrappers. Keep `whileHover` on cards. Add `data-gsap` attrs:

```jsx
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
```

- [ ] **Step 7: Replace the `Faq` component**

Remove Framer `motion.section` wrapper. Add `data-gsap` attrs:

```jsx
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
```

- [ ] **Step 8: Replace the `FinalCta` component**

Remove Framer `motion.div` wrapper. Add ambient glow div, `data-gsap` attrs, and pre-structured h2 with line spans:

```jsx
function FinalCta({ onDemoClick }) {
  return (
    <div className={styles.finalCta} data-gsap="final-cta" style={{ position: "relative" }}>
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
```

- [ ] **Step 9: Update `Landing()` component — add refs, pass glowRef to Hero, add empty useGSAP stub**

```jsx
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
      // animations added in subsequent tasks
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
```

- [ ] **Step 10: Verify page still renders at this point**

```bash
pnpm dev
```

Navigate to `http://localhost:3000/landing`. Page should render without errors. Sections visible, modal still opens. No animations yet (empty useGSAP stub). Check browser console for zero errors.

- [ ] **Step 11: Commit**

```bash
git add pages/landing.js styles/Landing.module.css
git commit -m "feat: GSAP animation scaffolding — refs, data attrs, pre-structured headings"
```

---

### Task 4: Nav load animations + scroll state toggle

**Files:**

- Modify: `pages/landing.js`

- [ ] **Step 1: Fill in the `useGSAP` hook with nav animations**

Replace the empty `useGSAP(() => { // animations added in subsequent tasks }, ...)` stub with this (keep the closing `}, { scope: pageRef, dependencies: [] });` at the bottom — you'll keep appending inside it across tasks):

```js
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
  },
  { scope: pageRef, dependencies: [] }
);
```

- [ ] **Step 2: Verify nav on dev server**

Reload `/landing`. Logo slides in from left, links stagger in from right, CTA pops with back-ease. Scroll past the hero — the nav should gain a box-shadow. Scroll back up — box-shadow removes.

- [ ] **Step 3: Commit**

```bash
git add pages/landing.js
git commit -m "feat: GSAP nav load animations and scroll-state toggle"
```

---

### Task 5: Hero load animations

**Files:**

- Modify: `pages/landing.js`

- [ ] **Step 1: Append hero load animations inside the `useGSAP` callback, before the closing `}, { scope: pageRef ... }`**

```js
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
```

- [ ] **Step 2: Verify hero heading reveals**

Reload `/landing`. The badge should drop in, then each line of the heading clips upward one by one (line 1 → gradient line 2 → line 3). The gradient on "Smarter, Faster," must still render correctly. Then sub, CTA row, and card follow.

- [ ] **Step 3: Commit**

```bash
git add pages/landing.js
git commit -m "feat: GSAP hero load animation with line clip-path reveals"
```

---

### Task 6: Hero scroll parallax + ambient glow loop

**Files:**

- Modify: `pages/landing.js`

- [ ] **Step 1: Append inside `useGSAP` callback**

```js
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
```

- [ ] **Step 2: Verify parallax and glow**

Scroll down from the hero: the dashboard card should drift upward slower than the page. The ambient glow orb should undulate slowly behind the hero content.

- [ ] **Step 3: Commit**

```bash
git add pages/landing.js
git commit -m "feat: GSAP hero scroll parallax and ambient glow loop"
```

---

### Task 7: Features section pin + directional card wipe

**Files:**

- Modify: `pages/landing.js`

- [ ] **Step 1: Append inside `useGSAP` callback**

```js
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
```

- [ ] **Step 2: Verify features on desktop (≥769px)**

Scroll to Features. Section pins. Cards wipe in from alternating left/right with blur clearing and rotateX correction. Icons bounce elastically after cards settle.

- [ ] **Step 3: Verify mobile fallback (≤768px)**

Resize to 375px. No pin — cards simply fade up. No layout breakage.

- [ ] **Step 4: Commit**

```bash
git add pages/landing.js
git commit -m "feat: GSAP features pin with directional card wipe and mobile fallback"
```

---

### Task 8: Pricing card fly-in + popular badge bounce

**Files:**

- Modify: `pages/landing.js`

- [ ] **Step 1: Append inside `useGSAP` callback**

```js
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
```

- [ ] **Step 2: Verify pricing section**

Scroll to Pricing. Cards fly up from `y: 100` with blur clearing. "Most Popular" badge slams in with back-ease after a slight delay.

- [ ] **Step 3: Commit**

```bash
git add pages/landing.js
git commit -m "feat: GSAP pricing card fly-in with blur and badge bounce"
```

---

### Task 9: Testimonials horizontal scroll pin

**Files:**

- Modify: `pages/landing.js`

- [ ] **Step 1: Append inside `useGSAP` callback**

```js
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
```

- [ ] **Step 2: Verify testimonials horizontal scroll on desktop**

Scroll to Testimonials. Section pins. Cards travel leftward as you continue scrolling. Cards blur-to-focus as the section enters. When all cards have passed, scroll resumes.

- [ ] **Step 3: Verify mobile**

At 375px, no pin, cards fade up vertically. Grid layout unchanged.

- [ ] **Step 4: Commit**

```bash
git add pages/landing.js
git commit -m "feat: GSAP testimonials horizontal scroll with pin"
```

---

### Task 10: FAQ clip-path wipe

**Files:**

- Modify: `pages/landing.js`

- [ ] **Step 1: Append inside `useGSAP` callback**

```js
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
```

- [ ] **Step 2: Verify FAQ wipe**

Scroll to FAQ. Each item wipes in from the left with clip-path, staggered, with blur clearing.

- [ ] **Step 3: Commit**

```bash
git add pages/landing.js
git commit -m "feat: GSAP FAQ clip-path wipe animation"
```

---

### Task 11: Final CTA animations

**Files:**

- Modify: `pages/landing.js`

- [ ] **Step 1: Append inside `useGSAP` callback**

```js
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
```

- [ ] **Step 2: Verify final CTA**

Scroll to Final CTA. Lines snap in with clip-path, sub fades up, button bounces in, gradient glow overlay fades in.

- [ ] **Step 3: Commit**

```bash
git add pages/landing.js
git commit -m "feat: GSAP final CTA animations with line reveals and glow"
```

---

### Task 12: Section transition continuity

**Files:**

- Modify: `pages/landing.js`

- [ ] **Step 1: Append inside `useGSAP` callback (last block before the closing brace)**

```js
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
```

- [ ] **Step 2: Verify continuity effect**

Scroll slowly through all sections. As each section exits the bottom of the viewport, it should subtly scale down and fade while the next rises fresh. Should feel cinematic — not distracting.

- [ ] **Step 3: Commit**

```bash
git add pages/landing.js
git commit -m "feat: GSAP section transition continuity (scale + fade on exit)"
```

---

### Task 13: Verify no Framer Motion conflicts remain

**Files:**

- Modify: `pages/landing.js` (if conflicts found)

- [ ] **Step 1: Search for leftover `whileInView` on GSAP-controlled sections**

```bash
grep -n "whileInView" pages/landing.js
```

Expected: no output (zero matches). If any appear on Features, Pricing, Testimonials, FAQ, or FinalCta wrappers, remove them — GSAP controls those now.

- [ ] **Step 2: Search for stagger/fadeUp variants on section wrappers**

```bash
grep -n 'variants={stagger}\|variants={fadeUp}' pages/landing.js
```

Expected: zero matches. The original Hero had these; they were removed in Task 3.

- [ ] **Step 3: Open browser console and verify zero animation errors**

With `pnpm dev` running, open `http://localhost:3000/landing` and check the console. Confirm no errors about conflicting animations, missing refs, or undefined GSAP targets.

- [ ] **Step 4: Commit (only if fixes were made)**

```bash
git add pages/landing.js
git commit -m "fix: remove remaining Framer whileInView conflicts with GSAP"
```

---

### Task 14: Full manual verification

**Files:** None (verification only)

- [ ] **Step 1: Desktop full-page scroll test (≥1280px)**

With `pnpm dev` at desktop width:

1. Reload `/landing` — nav animates in, hero lines snap with clip-path, badge/sub/card follow
2. Scroll down slowly — hero card parallaxes upward, ambient glow drifts
3. Features — section pins, 6 cards wipe in from alternating sides with blur+rotateX, icons bounce elastically
4. Pricing — 3 plan cards fly up with blur, "Most Popular" badge bounces in
5. Testimonials — section pins, cards travel horizontally across screen
6. FAQ — 4 items clip-wipe from left in staggered sequence
7. Final CTA — 2 lines snap in, sub fades, button bounces, glow fades
8. Throughout — exiting sections subtly scale down and fade

- [ ] **Step 2: Mobile scroll test (≤768px)**

Resize to 375px:

1. No pinning on Features or Testimonials
2. Cards use simple fade-up fallbacks
3. Hero still animates (no pin involved)
4. Modal opens/closes correctly (Framer AnimatePresence untouched)
5. All `whileHover` and `whileTap` still work on buttons

- [ ] **Step 3: Check for scroll jank**

Scroll rapidly up and down multiple times. Confirm no layout shifts, no janky re-triggers, no broken scroll positions after pinned sections.

- [ ] **Step 4: Final commit**

```bash
git add pages/landing.js styles/Landing.module.css
git status
git commit -m "feat: GSAP bold scroll animations complete on landing page"
```
