import Link from "next/link";
import Image from "next/image";
import styles from "@/styles/Landing.module.css";

const TRUE_REFINED_URL = "https://truerefinedsolutions.com";

export default function PublicFooter({ onDemoClick }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerGrid}>
          <div>
            <Link href="/#hero" className={styles.footerLogo}>
              <Image
                src="/only-shape-no-bg.png"
                alt=""
                aria-hidden="true"
                width={26}
                height={26}
                className={styles.footerLogoImg}
              />
              TSO
            </Link>
            <p className={styles.footerBrandText}>
              TSO is a product by True Refined Solutions - a software development company specializing in custom web
              apps, SaaS platforms, inventory systems, and AI-powered business automation. TSO is positioned as business
              operations SaaS for Asian businesses.
            </p>
          </div>
          <div>
            <p className={styles.footerColHeading}>Product</p>
            <Link href="/#product" className={styles.footerLink}>
              Product
            </Link>
            <Link href="/#features" className={styles.footerLink}>
              Features
            </Link>
            <Link href="/#use-cases" className={styles.footerLink}>
              Use Cases
            </Link>
            <Link href="/#ai-insights" className={styles.footerLink}>
              AI Insights
            </Link>
            <Link href="/inventory-management-software" className={styles.footerLink}>
              Inventory Guide
            </Link>
            <Link href="/inventory-accounting-software" className={styles.footerLink}>
              Accounting Guide
            </Link>
            <Link href="/inventory-software-south-asia" className={styles.footerLink}>
              Asia SMB Guide
            </Link>
          </div>
          <div>
            <p className={styles.footerColHeading}>True Refined Solutions</p>
            <a href={TRUE_REFINED_URL} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
              Custom software development by True Refined Solutions
            </a>
            <a href={TRUE_REFINED_URL} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
              Work with True Refined Solutions
            </a>
            <Link href="/about" className={styles.footerLink}>
              About
            </Link>
            <button type="button" className={styles.footerLinkBtn} onClick={onDemoClick}>
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
          <span>© 2026 TSO by True Refined Solutions. All rights reserved.</span>
          <span>
            Built and maintained by{" "}
            <a href={TRUE_REFINED_URL} target="_blank" rel="noopener noreferrer" className={styles.footerExternalLink}>
              True Refined Solutions
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
