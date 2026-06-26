import Link from "next/link";
import styles from "@/styles/Landing.module.css";

export default function PublicFooter({ onDemoClick }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerGrid}>
          <div>
            <Link href="/#hero" className={styles.footerLogo}>
              <img
                src="/only-shape-no-bg.png"
                alt=""
                aria-hidden="true"
                width={26}
                height={26}
                className={styles.footerLogoImg}
              />
              StockFlow
            </Link>
            <p className={styles.footerBrandText}>
              Inventory management and accounting for growing businesses across South Asia.
            </p>
          </div>
          <div>
            <p className={styles.footerColHeading}>Product</p>
            <Link href="/#features" className={styles.footerLink}>
              Features
            </Link>
            <Link href="/#pricing" className={styles.footerLink}>
              Pricing
            </Link>
            <Link href="/#testimonials" className={styles.footerLink}>
              Testimonials
            </Link>
            <Link href="/#faq" className={styles.footerLink}>
              FAQ
            </Link>
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
