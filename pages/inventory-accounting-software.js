import { useState, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import styles from "@/styles/Landing.module.css";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import PublicDemoModal from "@/components/PublicDemoModal";

const PAGE_URL = "https://www.treesols.com/inventory-accounting-software";
const PAGE_TITLE = "Inventory Accounting Software for Asian SMBs - TSO by True Refined Solutions";
const PAGE_DESCRIPTION =
  "TSO by True Refined Solutions connects stock movement, purchase costs, sales, dues, ledgers, reports, and AI-powered insights for Asian SMB teams.";

const sources = [
  {
    name: "IRS Publication 334: Tax Guide for Small Business",
    href: "https://www.irs.gov/publications/p334",
    note: "Small-business accounting, tax, and recordkeeping context.",
  },
  {
    name: "IFRS IAS 2 Inventories",
    href: "https://www.ifrs.org/issued-standards/list-of-standards/ias-2-inventories/",
    note: "Inventory measurement and net realisable value guidance.",
  },
  {
    name: "NetSuite inventory management guide",
    href: "https://www.netsuite.com/portal/resource/articles/inventory-management/inventory-management.shtml",
    note: "Inventory management benefits for cash flow and operations.",
  },
];

const faqs = [
  {
    q: "What is inventory accounting software?",
    a: "Inventory accounting software connects stock quantities with purchase costs, sales revenue, customer balances, supplier payables, payment records, and reports so a business can understand stock and cash together.",
  },
  {
    q: "Why should SMBs connect inventory and accounting?",
    a: "When inventory and accounting are separate, teams often duplicate entries and reconcile late. A connected workflow helps owners see what is in stock, what is owed to suppliers, what customers owe, and how sales affect cash flow.",
  },
  {
    q: "What reports matter most?",
    a: "SMBs should start with inventory on hand, purchase reports, sales reports, customer ledgers, supplier ledgers, dues, payments, and exportable summaries for review.",
  },
  {
    q: "How does TSO support inventory accounting?",
    a: "TSO combines inventory, purchases, sales, payments, customer and supplier ledgers, dues, reports, AI-powered insights, and exports so Asian teams can review operational movement and accounting impact from one SaaS app.",
  },
];

const relatedGuides = [
  {
    href: "/inventory-management-software",
    title: "Inventory management software",
    description: "Review the core inventory workflows for stock, purchases, sales, reports, and exports.",
  },
  {
    href: "/inventory-software-south-asia",
    title: "Inventory software for Asian SMBs",
    description: "See how Asian SMB teams manage customer dues, supplier payables, and stock movement.",
  },
];

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: PAGE_TITLE,
    url: PAGE_URL,
    description: PAGE_DESCRIPTION,
    about: ["Inventory accounting software", "Inventory management", "Small business accounting"],
    mainEntity: {
      "@type": "SoftwareApplication",
      name: "TSO",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://www.treesols.com/",
      description:
        "TSO by True Refined Solutions connects inventory, purchases, sales, payments, ledgers, reports, AI-powered insights, and exports for Asian SMB operations.",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: a,
      },
    })),
  },
];

export default function InventoryAccountingSoftware() {
  const [modalOpen, setModalOpen] = useState(false);
  const demoTriggerRef = useRef(null);
  const openDemo = () => {
    demoTriggerRef.current = document.activeElement;
    setModalOpen(true);
  };
  const closeDemo = () => setModalOpen(false);

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={PAGE_URL} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="TSO by True Refined Solutions" />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_DESCRIPTION} />
        <meta property="og:url" content={PAGE_URL} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={PAGE_TITLE} />
        <meta name="twitter:description" content={PAGE_DESCRIPTION} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>
      <div className={styles.page}>
        <PublicNav onDemoClick={openDemo} alwaysLight hrefPrefix="/" />
        <main className={styles.publicArticle}>
          <div className={styles.publicArticleHero}>
            <p className={styles.publicKicker}>Inventory accounting guide</p>
            <h1 className={styles.publicArticleTitle}>Inventory accounting software for Asian SMBs</h1>
            <p className={styles.publicArticleLead}>
              Inventory accounting software connects the operational side of stock with the financial side of the
              business. For Asian SMBs, that means purchases, sales, customer dues, supplier payables, payments, stock
              value, ledgers, and exportable reports can be reviewed together instead of reconciled manually after the
              fact.
            </p>
          </div>

          <section className={styles.publicArticleSection}>
            <h2 className={styles.publicArticleH2}>What is inventory accounting software?</h2>
            <p className={styles.publicArticleText}>
              It is a system that records stock movement and the accounting impact of that movement. A practical SMB
              setup should show what came in, what went out, what each movement cost, what customers owe, what suppliers
              are owed, and which reports can be exported for review.
            </p>
          </section>

          <section className={styles.publicArticleSection}>
            <h2 className={styles.publicArticleH2}>What TSO connects</h2>
            <div className={styles.publicArticleGrid}>
              <div className={styles.publicArticleCard}>
                <h3 className={styles.publicArticleH3}>Purchases and payable</h3>
                <p className={styles.publicArticleText}>
                  Track supplier purchases, payment status, purchase dues, and supplier ledger history.
                </p>
              </div>
              <div className={styles.publicArticleCard}>
                <h3 className={styles.publicArticleH3}>Sales and receivable</h3>
                <p className={styles.publicArticleText}>
                  Connect customer sales, returns, payments, customer balances, and sales reports.
                </p>
              </div>
              <div className={styles.publicArticleCard}>
                <h3 className={styles.publicArticleH3}>Inventory and reports</h3>
                <p className={styles.publicArticleText}>
                  Review on-hand stock, item movement, inventory exports, and operational dashboards.
                </p>
              </div>
            </div>
          </section>

          <section className={styles.publicArticleSection}>
            <h2 className={styles.publicArticleH2}>Buyer checklist</h2>
            <ul className={styles.publicArticleList}>
              <li>Can purchase entries update supplier balances and inventory records?</li>
              <li>Can sales entries update customer balances and stock movement?</li>
              <li>Can payment records be reviewed from customer and supplier ledgers?</li>
              <li>Can inventory, purchase, sales, and ledger reports be exported?</li>
              <li>Can access be scoped by organization and user role?</li>
            </ul>
          </section>

          <section className={styles.publicArticleSection}>
            <h2 className={styles.publicArticleH2}>Frequently asked questions</h2>
            <div className={styles.publicArticleGrid}>
              {faqs.map(({ q, a }) => (
                <div key={q} className={styles.publicArticleCard}>
                  <h3 className={styles.publicArticleH3}>{q}</h3>
                  <p className={styles.publicArticleText}>{a}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.publicArticleSection}>
            <h2 className={styles.publicArticleH2}>Related guides</h2>
            <div className={styles.publicArticleGrid}>
              {relatedGuides.map(({ href, title, description }) => (
                <Link key={href} href={href} className={styles.publicArticleCardLink}>
                  <h3 className={styles.publicArticleH3}>{title}</h3>
                  <p className={styles.publicArticleText}>{description}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.publicArticleSection}>
            <h2 className={styles.publicArticleH2}>Sources</h2>
            <ul className={styles.publicArticleList}>
              {sources.map(({ name, href, note }) => (
                <li key={href}>
                  <a href={href} rel="nofollow" className={styles.publicSourceLink}>
                    {name}
                  </a>
                  : {note}
                </li>
              ))}
            </ul>
          </section>
        </main>
        <PublicFooter onDemoClick={openDemo} />
        <PublicDemoModal open={modalOpen} onClose={closeDemo} triggerRef={demoTriggerRef} />
      </div>
    </>
  );
}

InventoryAccountingSoftware.getLayout = (page) => page;
