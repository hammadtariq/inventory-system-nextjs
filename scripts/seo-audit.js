const fs = require("fs");
const path = require("path");

const siteUrl = "https://www.treesols.com";

const indexablePages = [
  { path: "/", file: "pages/index.js", type: "landing" },
  { path: "/about", file: "pages/about.js", type: "supporting" },
  { path: "/privacy", file: "pages/privacy.js", type: "supporting" },
  { path: "/terms", file: "pages/terms.js", type: "supporting" },
  { path: "/inventory-management-software", file: "pages/inventory-management-software.js", type: "priority" },
  { path: "/inventory-accounting-software", file: "pages/inventory-accounting-software.js", type: "priority" },
  { path: "/inventory-software-south-asia", file: "pages/inventory-software-south-asia.js", type: "priority" },
];

const priorityQueries = [
  {
    query: "inventory management software",
    path: "/inventory-management-software",
    requiredText: ["What is inventory management software?", "Sources", "https://www.irs.gov/publications/p334"],
  },
  {
    query: "inventory accounting software",
    path: "/inventory-accounting-software",
    requiredText: [
      "What is inventory accounting software?",
      "Inventory accounting software for SMBs",
      "Sources",
      "https://www.ifrs.org/issued-standards/list-of-standards/ias-2-inventories/",
    ],
  },
  {
    query: "inventory software for South Asian SMBs",
    path: "/inventory-software-south-asia",
    requiredText: [
      "What should South Asian SMBs look for in inventory software?",
      "Sources",
      "https://www.adb.org/publications/series/asia-small-medium-sized-enterprise-monitor",
    ],
  },
];

function read(cwd, filePath) {
  return fs.readFileSync(path.join(cwd, filePath), "utf8");
}

function addGap(gaps, impact, area, pathName, message) {
  gaps.push({ impact, area, path: pathName, message });
}

function hasAll(source, checks) {
  return checks.every((check) => source.includes(check));
}

function auditSeoState({ cwd = process.cwd() } = {}) {
  const gaps = [];
  const robots = read(cwd, "public/robots.txt");
  const sitemap = read(cwd, "public/sitemap.xml");
  const llms = read(cwd, "public/llms.txt");
  const protectedRoutes = read(cwd, "components/protectedRoutes.js");
  const landing = read(cwd, "pages/index.js");

  if (!robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`)) {
    addGap(gaps, "critical", "crawlability", "/robots.txt", "robots.txt must advertise the canonical sitemap.");
  }

  if (!robots.includes("Allow: /llms.txt")) {
    addGap(gaps, "high", "ai-discovery", "/robots.txt", "robots.txt must allow llms.txt discovery.");
  }

  indexablePages.forEach((page) => {
    const source = read(cwd, page.file);
    const fullUrl = `${siteUrl}${page.path}`;

    if (!robots.includes(`Allow: ${page.path}`)) {
      addGap(gaps, "critical", "crawlability", page.path, "Page is not explicitly allowed in robots.txt.");
    }

    if (!sitemap.includes(`<loc>${fullUrl}</loc>`)) {
      addGap(gaps, "critical", "crawlability", page.path, "Page is missing from sitemap.xml.");
    }

    if (!protectedRoutes.includes(`"${page.path}"`)) {
      addGap(gaps, "critical", "crawlability", page.path, "Page is not listed as a public SSR route.");
    }

    if (!source.includes('<meta name="robots" content="index,follow" />')) {
      addGap(gaps, "high", "indexation", page.path, "Page does not explicitly opt into indexing.");
    }

    if (!source.includes('rel="canonical"')) {
      addGap(gaps, "high", "canonical", page.path, "Page is missing a canonical URL.");
    }

    if (!source.includes('property="og:title"')) {
      addGap(gaps, "medium", "titles", page.path, "Page is missing social title metadata.");
    }
  });

  priorityQueries.forEach((query) => {
    const page = indexablePages.find((candidate) => candidate.path === query.path);
    const source = read(cwd, page.file);
    const missingText = query.requiredText.filter((text) => !source.includes(text));

    if (!landing.includes(`href="${query.path}"`)) {
      addGap(gaps, "high", "internal-links", query.path, `Landing page does not link to ${query.query}.`);
    }

    if (!llms.includes(`${siteUrl}${query.path}`)) {
      addGap(gaps, "high", "ai-discovery", query.path, "llms.txt does not map this priority page.");
    }

    if (!hasAll(source, ['"@type": "FAQPage"', '"@type": "SoftwareApplication"', 'type="application/ld+json"'])) {
      addGap(gaps, "high", "structured-data", query.path, "Priority page is missing answer-oriented JSON-LD.");
    }

    if (missingText.length > 0) {
      addGap(
        gaps,
        "critical",
        "answer-first-content",
        query.path,
        `Priority query "${query.query}" is missing required answer/source text: ${missingText.join(", ")}`
      );
    }
  });

  const queryResults = priorityQueries.map((query) => ({
    query: query.query,
    path: query.path,
    status: gaps.some((gap) => gap.path === query.path && ["critical", "high"].includes(gap.impact)) ? "fail" : "pass",
  }));

  return {
    summary: {
      critical: gaps.filter((gap) => gap.impact === "critical").length,
      high: gaps.filter((gap) => gap.impact === "high").length,
      medium: gaps.filter((gap) => gap.impact === "medium").length,
      indexablePages: indexablePages.length,
      priorityQueries: priorityQueries.length,
    },
    gaps,
    priorityQueries: queryResults,
  };
}

if (require.main === module) {
  const report = auditSeoState({ cwd: process.cwd() });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.summary.critical > 0 ? 1 : 0);
}

module.exports = {
  auditSeoState,
  indexablePages,
  priorityQueries,
};
