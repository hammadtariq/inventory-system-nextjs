"use client";
import { useState } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import styles from "@/styles/Landing.module.css";

export default function PublicNav({ onDemoClick, alwaysLight = false, hrefPrefix = "" }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const [lightMode, setLightMode] = useState(alwaysLight);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => {
    setCondensed(v > 24);
    if (!alwaysLight) setLightMode(v > 460);
  });

  const isLight = alwaysLight || lightMode;

  return (
    <nav
      className={`${styles.nav}${condensed ? ` ${styles.navCondensed}` : ""}${isLight ? ` ${styles.navLight}` : ""}`}
      aria-label="Main navigation"
    >
      <Link href={`${hrefPrefix}#hero`} className={styles.navLogo}>
        <img
          src="/only-shape-no-bg.png"
          alt=""
          aria-hidden="true"
          width={30}
          height={30}
          className={styles.navLogoImg}
        />
        TSO
      </Link>
      <ul className={styles.navLinks} role="list">
        <li>
          <Link href={`${hrefPrefix}#product`}>Product</Link>
        </li>
        <li>
          <Link href={`${hrefPrefix}#features`}>Features</Link>
        </li>
        <li>
          <Link href={`${hrefPrefix}#use-cases`}>Use Cases</Link>
        </li>
        <li>
          <Link href={`${hrefPrefix}#pricing`}>Pricing</Link>
        </li>
        <li>
          <Link href={`${hrefPrefix}#faq`}>FAQ</Link>
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
          {[
            { id: "product", label: "Product" },
            { id: "features", label: "Features" },
            { id: "use-cases", label: "Use Cases" },
            { id: "pricing", label: "Pricing" },
            { id: "faq", label: "FAQ" },
          ].map(({ id, label }) => (
            <Link
              key={id}
              href={`${hrefPrefix}#${id}`}
              className={styles.mobileLink}
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
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
