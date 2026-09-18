import { useState, useRef } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import styles from "@/styles/Landing.module.css";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import PublicDemoModal from "@/components/PublicDemoModal";

const ABOUT_URL = "https://www.treesols.com/about";
const TRUE_REFINED_URL = "https://truerefinedsolutions.com";
const ABOUT_TITLE = "About TSO by True Refined Solutions";
const ABOUT_DESCRIPTION =
  "Learn how TSO by True Refined Solutions helps Asian businesses manage inventory, warehouse operations, purchases, sales, ledgers, reports, and AI-powered insights.";

const VALUE_PROPS = [
  {
    title: "A True Refined Solutions Product",
    desc: "TSO is built, owned, and maintained by True Refined Solutions as a SaaS product platform for Asian business operations.",
  },
  {
    title: "Operations in One Place",
    desc: "Inventory, warehouse activity, purchases, sales, ledgers, reports, and AI-powered insights stay connected.",
  },
  {
    title: "Built for Future Modules",
    desc: "The platform is positioned beyond stock control, with room for additional business modules as customer needs grow.",
  },
];

export default function About() {
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
        <title>{ABOUT_TITLE}</title>
        <meta name="description" content={ABOUT_DESCRIPTION} />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={ABOUT_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="TSO by True Refined Solutions" />
        <meta property="og:title" content={ABOUT_TITLE} />
        <meta property="og:description" content={ABOUT_DESCRIPTION} />
        <meta property="og:url" content={ABOUT_URL} />
      </Head>
      <div className={styles.page}>
        <PublicNav onDemoClick={openDemo} alwaysLight hrefPrefix="/" />

        <main className={styles.publicArticle}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className={styles.publicArticleHero}>
              <p className={styles.publicKicker}>About TSO</p>
              <h1 className={styles.publicArticleTitle}>About TSO by True Refined Solutions</h1>
              <p className={styles.publicArticleLead}>
                TSO is a SaaS business operations platform for Asian businesses managing inventory, warehouse
                operations, purchases, sales, ledgers, reports, and AI-powered insights. It is designed and maintained
                by True Refined Solutions, the software development company behind the product.
              </p>
            </div>
          </motion.div>

          <div className={styles.aboutValueGrid}>
            {VALUE_PROPS.map(({ title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * (i + 1) }}
                className={styles.publicArticleCard}
              >
                <h2 className={styles.publicArticleH3}>{title}</h2>
                <p className={styles.publicArticleText}>{desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={styles.aboutCta}
          >
            <h2 className={styles.aboutCtaTitle}>Need a custom system for your business?</h2>
            <p className={styles.aboutCtaText}>
              Work with True Refined Solutions for custom web apps, SaaS platforms, inventory systems, and AI-powered
              business automation.
            </p>
            <a href={TRUE_REFINED_URL} target="_blank" rel="noopener noreferrer" className={styles.btnPrimaryLg}>
              Work with True Refined Solutions
            </a>
          </motion.div>
        </main>

        <PublicFooter onDemoClick={openDemo} />
        <PublicDemoModal open={modalOpen} onClose={closeDemo} triggerRef={demoTriggerRef} />
      </div>
    </>
  );
}

About.getLayout = (page) => page;
