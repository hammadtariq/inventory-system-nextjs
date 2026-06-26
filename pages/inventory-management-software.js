import { useState, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import styles from "@/styles/Landing.module.css";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import PublicDemoModal from "@/components/PublicDemoModal";

const PAGE_URL = "https://www.treesols.com/inventory-management-software";
const PAGE_TITLE = "Inventory Management Software for SMBs — TSO by TRS";
const PAGE_DESCRIPTION =
  "Inventory management software helps SMBs track stock, purchases, sales, accounting entries, and reports in one connected workflow.";

const sources = [
  {
    name: "IRS Publication 334: Tax Guide for Small Business",
    href: "https://www.irs.gov/publications/p334",
    note: "Small-business tax and recordkeeping context.",
  },
  {
    name: "IFRS IAS 2 Inventories",
    href: "https://www.ifrs.org/issued-standards/list-of-standards/ias-2-inventories/",
    note: "Inventory measurement and net realisable value context.",
  },
  {
    name: "NetSuite inventory management guide",
    href: "https://www.netsuite.com/portal/resource/articles/inventory-management/inventory-management.shtml",
    note: "Operational inventory management practices and benefits.",
  },
  {
    name: "U.S. Chamber inventory management processes",
    href: "https://www.uschamber.com/co/run/technology/inventory-management-processes",
    note: "Small-business process framing for stock oversight.",
  },
];

const faqs = [
  {
    q: "What is inventory management software?",
    a: "Inventory management software is a system for tracking products from purchase to sale, keeping stock counts, supplier orders, customer sales, costs, and reports connected so teams can make decisions from one source of truth.",
  },
  {
    q: "What should a small business track first?",
    a: "Start with item names, suppliers, quantities on hand, purchase cost, selling price, reorder points, sales orders, purchase orders, and payment status. Once those are reliable, add exports, audit checks, and financial reports.",
  },
  {
    q: "How does inventory software connect with accounting?",
    a: "Inventory and accounting connect through purchase costs, sales revenue, receivables, payables, customer ledgers, supplier ledgers, and stock valuation. A connected system reduces duplicate entry and makes profitability easier to review.",
  },
  {
    q: "Is TSO built for inventory and accounting together?",
    a: "Yes. TSO combines inventory, purchases, sales, ledger workflows, customer and supplier balances, reporting, and exports for SMBs that need operational and accounting visibility in one web app.",
  },
];

const relatedGuides = [
  {
    href: "/inventory-accounting-software",
    title: "Inventory accounting software",
    description: "See how stock movement connects with purchases, sales, dues, payments, and ledgers.",
  },
  {
    href: "/inventory-software-south-asia",
    title: "Inventory software for South Asian SMBs",
    description: "Compare the workflows South Asian distributors, wholesalers, and trading teams need most.",
  },
];

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: PAGE_TITLE,
    url: PAGE_URL,
    description: PAGE_DESCRIPTION,
    about: ["Inventory management software", "Inventory accounting", "Small business stock control"],
    mainEntity: {
      "@type": "SoftwareApplication",
      name: "TSO",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://www.treesols.com/",
      description:
        "TSO connects inventory tracking, purchases, sales, ledgers, reporting, and exports for growing SMBs.",
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

const containerStyle = {
  maxWidth: 980,
  margin: "0 auto",
  padding: "clamp(88px, 10vw, 120px) 24px 96px",
};

const h1Style = {
  fontSize: 46,
  lineHeight: 1.08,
  margin: "0 0 18px",
  color: "var(--ink-1)",
};

const leadStyle = {
  fontSize: 19,
  lineHeight: 1.75,
  color: "var(--ink-2)",
  maxWidth: 780,
};

const sectionStyle = {
  marginTop: 44,
};

const cardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
};

const cardStyle = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "22px",
};

const h2Style = {
  fontSize: 27,
  margin: "0 0 16px",
  color: "var(--ink-1)",
};

const h3Style = {
  fontSize: 17,
  margin: "0 0 8px",
  color: "var(--ink-1)",
};

const pStyle = {
  fontSize: 15,
  lineHeight: 1.75,
  color: "var(--ink-2)",
  margin: 0,
};

const listStyle = {
  display: "grid",
  gap: 12,
  paddingLeft: 20,
  color: "var(--ink-2)",
  lineHeight: 1.7,
};

export default function InventoryManagementSoftware() {
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
        <meta property="og:site_name" content="TSO by TRS" />
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
        <main style={containerStyle}>
          <p style={{ ...pStyle, color: "var(--accent)", fontWeight: 800, marginBottom: 12 }}>
            Inventory software guide
          </p>
          <h1 style={h1Style}>Inventory management software for small and growing businesses</h1>
          <p style={leadStyle}>
            Inventory management software helps SMBs know what is in stock, what is committed to customers, what needs
            to be reordered, and how purchases and sales affect cash flow. TSO is built for teams that want inventory,
            accounting, ledgers, reports, and exports in one workflow instead of scattered spreadsheets.
          </p>

          <section style={sectionStyle}>
            <h2 style={h2Style}>What is inventory management software?</h2>
            <p style={pStyle}>
              It is a business system that records product quantities, supplier purchases, customer sales, stock
              movement, item costs, and reporting activity. A useful system answers four questions quickly: what do we
              have, what is it worth, who do we owe, and who owes us?
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>When TSO is a fit</h2>
            <div style={cardGridStyle}>
              <div style={cardStyle}>
                <h3 style={h3Style}>Inventory and orders</h3>
                <p style={pStyle}>Track items, companies, purchases, sales, returns, on-hand quantity, and exports.</p>
              </div>
              <div style={cardStyle}>
                <h3 style={h3Style}>Accounting visibility</h3>
                <p style={pStyle}>Connect sales, purchase dues, payments, customer ledgers, and supplier ledgers.</p>
              </div>
              <div style={cardStyle}>
                <h3 style={h3Style}>SMB operations</h3>
                <p style={pStyle}>Give small teams a dashboard for stock, cash, receivables, payables, and reports.</p>
              </div>
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Answer-ready checklist for buyers</h2>
            <ul style={listStyle}>
              <li>Can the system track item quantity, cost, supplier, and customer movement in one place?</li>
              <li>Does it show purchases, sales, dues, payments, and ledgers without duplicate entry?</li>
              <li>Can managers export inventory, ledger, sales, and purchase reports for review?</li>
              <li>Does it support roles and organization-level access controls for team workflows?</li>
              <li>Can it help reconcile stock movement with cash flow and accounting records?</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Frequently asked questions</h2>
            <div style={cardGridStyle}>
              {faqs.map(({ q, a }) => (
                <div key={q} style={cardStyle}>
                  <h3 style={h3Style}>{q}</h3>
                  <p style={pStyle}>{a}</p>
                </div>
              ))}
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Related guides</h2>
            <div style={cardGridStyle}>
              {relatedGuides.map(({ href, title, description }) => (
                <Link key={href} href={href} style={{ ...cardStyle, display: "block", textDecoration: "none" }}>
                  <h3 style={h3Style}>{title}</h3>
                  <p style={pStyle}>{description}</p>
                </Link>
              ))}
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Sources</h2>
            <ul style={listStyle}>
              {sources.map(({ name, href, note }) => (
                <li key={href}>
                  <a href={href} rel="nofollow" style={{ color: "var(--accent)", fontWeight: 700 }}>
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

InventoryManagementSoftware.getLayout = (page) => page;
