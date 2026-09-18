import { useState, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import styles from "@/styles/Landing.module.css";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import PublicDemoModal from "@/components/PublicDemoModal";

const PAGE_URL = "https://www.treesols.com/inventory-software-south-asia";
const PAGE_TITLE = "Inventory Software for Asian SMBs - TSO by True Refined Solutions";
const PAGE_DESCRIPTION =
  "TSO by True Refined Solutions is inventory and business operations SaaS for Asian SMBs that need connected stock, purchases, sales, ledgers, reports, and AI insights.";

const sources = [
  {
    name: "Asian Development Bank: Asia Small and Medium-Sized Enterprise Monitor",
    href: "https://www.adb.org/publications/series/asia-small-medium-sized-enterprise-monitor",
    note: "Regional MSME landscape and policy context across Asia and the Pacific.",
  },
  {
    name: "OECD: Digitalisation of SMEs",
    href: "https://www.oecd.org/en/topics/digitalisation-of-smes.html",
    note: "SME digitalization opportunities and adoption barriers.",
  },
  {
    name: "World Bank Group: SME Finance",
    href: "https://www.worldbank.org/ext/en/topic/competitiveness/small-and-medium-enterprises-smes-finance",
    note: "SME finance constraints across emerging markets and developing economies.",
  },
  {
    name: "IFRS IAS 2 Inventories",
    href: "https://www.ifrs.org/issued-standards/list-of-standards/ias-2-inventories/",
    note: "Inventory measurement context for businesses that report inventory value.",
  },
];

const faqs = [
  {
    q: "What should Asian SMBs look for in inventory software?",
    a: "Asian SMBs should look for SaaS inventory software that tracks purchases, sales, stock on hand, customer dues, supplier payables, payments, ledgers, reports, exports, AI-powered insights, and team access controls in one system.",
  },
  {
    q: "Why does regional workflow matter?",
    a: "Many Asian SMBs run lean teams, relationship-based supplier and customer workflows, and frequent payment follow-ups. Software should make dues, stock movement, and ledgers visible without forcing teams into complex enterprise systems.",
  },
  {
    q: "Is TSO built for Asian SMB operations?",
    a: "Yes. TSO by True Refined Solutions is designed as business operations SaaS for Asian SMBs, with inventory, purchases, sales, customer and supplier ledgers, reports, AI-powered insights, exports, and multi-company workflows.",
  },
  {
    q: "What is the first workflow to digitize?",
    a: "Start with item records, purchases, sales, stock on hand, customer dues, supplier payables, and exportable reports. Once those are reliable, add role controls, dashboards, and approval workflows.",
  },
];

const relatedGuides = [
  {
    href: "/inventory-management-software",
    title: "Inventory management software",
    description: "Review the core SMB stock, purchase, sales, reporting, and export workflows.",
  },
  {
    href: "/inventory-accounting-software",
    title: "Inventory accounting software",
    description: "See how inventory connects with ledgers, customer dues, supplier payables, and payments.",
  },
];

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: PAGE_TITLE,
    url: PAGE_URL,
    description: PAGE_DESCRIPTION,
    about: ["Inventory software Asia", "SMB inventory management", "Business operations SaaS"],
    mainEntity: {
      "@type": "SoftwareApplication",
      name: "TSO",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://www.treesols.com/",
      description:
        "TSO by True Refined Solutions connects inventory, purchases, sales, customer and supplier ledgers, reports, AI-powered insights, exports, and multi-company workflows for Asian SMBs.",
      areaServed: "Asia",
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

export default function InventorySoftwareSouthAsia() {
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
            <p className={styles.publicKicker}>Asia SMB guide</p>
            <h1 className={styles.publicArticleTitle}>Inventory software for Asian SMBs</h1>
            <p className={styles.publicArticleLead}>
              Inventory software for Asian SMBs should fit how growing distributors, wholesalers, retailers, and trading
              businesses actually operate: frequent purchases, customer credit, supplier payables, stock movement,
              multi-company records, AI-powered insights, and exportable reports in one simple SaaS workflow.
            </p>
          </div>

          <section className={styles.publicArticleSection}>
            <h2 className={styles.publicArticleH2}>What should Asian SMBs look for in inventory software?</h2>
            <p className={styles.publicArticleText}>
              Look for a system that connects inventory with the financial reality of the business. Stock quantity alone
              is not enough. Teams need to know what stock is available, what customers owe, what suppliers are owed,
              which orders are pending, and which reports can be exported for review.
            </p>
          </section>

          <section className={styles.publicArticleSection}>
            <h2 className={styles.publicArticleH2}>Regional workflows TSO supports</h2>
            <div className={styles.publicArticleGrid}>
              <div className={styles.publicArticleCard}>
                <h3 className={styles.publicArticleH3}>Customer and supplier dues</h3>
                <p className={styles.publicArticleText}>
                  Track receivables, payables, payment records, and ledger history alongside stock.
                </p>
              </div>
              <div className={styles.publicArticleCard}>
                <h3 className={styles.publicArticleH3}>Multi-company operations</h3>
                <p className={styles.publicArticleText}>
                  Support businesses that manage multiple companies or trading entities from one app.
                </p>
              </div>
              <div className={styles.publicArticleCard}>
                <h3 className={styles.publicArticleH3}>Exportable reporting</h3>
                <p className={styles.publicArticleText}>
                  Generate inventory, purchase, sales, customer, supplier, and ledger exports.
                </p>
              </div>
            </div>
          </section>

          <section className={styles.publicArticleSection}>
            <h2 className={styles.publicArticleH2}>Answer-ready buyer checklist</h2>
            <ul className={styles.publicArticleList}>
              <li>Does the app connect purchases, sales, returns, payments, ledgers, and stock on hand?</li>
              <li>Can owners see customer dues and supplier payables without rebuilding spreadsheets?</li>
              <li>Does it support multiple companies, users, and role-based access?</li>
              <li>Can reports be exported for finance review and operational follow-up?</li>
              <li>Is the workflow simple enough for a small team to adopt without a long implementation project?</li>
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

InventorySoftwareSouthAsia.getLayout = (page) => page;
