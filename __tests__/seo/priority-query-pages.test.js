import fs from "fs";
import path from "path";

const read = (filePath) => fs.readFileSync(path.join(process.cwd(), filePath), "utf8");

const expectInternalLink = (source, route) => {
  expect(source).toEqual(expect.stringMatching(new RegExp(`(href="${route}"|href: "${route}")`)));
};

describe("priority query pages", () => {
  it("maps inventory management software queries to an answer-ready page", () => {
    const page = read("pages/inventory-management-software.js");
    const protectedRoutes = read("components/protectedRoutes.js");
    const landing = read("pages/index.js");
    const sitemap = read("public/sitemap.xml");
    const robots = read("public/robots.txt");

    expect(page).toContain("What is inventory management software?");
    expect(page).toContain('rel="canonical"');
    expect(page).toContain('"@type": "FAQPage"');
    expect(page).toContain("Sources");
    expect(page).toContain("https://www.irs.gov/publications/p334");
    expect(page).toContain("https://www.ifrs.org/issued-standards/list-of-standards/ias-2-inventories/");
    expectInternalLink(page, "/inventory-accounting-software");
    expectInternalLink(page, "/inventory-software-south-asia");
    expect(protectedRoutes).toContain('"/inventory-management-software"');
    expectInternalLink(landing, "/inventory-management-software");
    expect(sitemap).toContain("<loc>https://www.treesols.com/inventory-management-software</loc>");
    expect(robots).toContain("Allow: /inventory-management-software");
  });

  it("maps inventory accounting software queries to an answer-ready page", () => {
    const page = read("pages/inventory-accounting-software.js");
    const protectedRoutes = read("components/protectedRoutes.js");
    const landing = read("pages/index.js");
    const sitemap = read("public/sitemap.xml");
    const robots = read("public/robots.txt");

    expect(page).toContain("What is inventory accounting software?");
    expect(page).toContain("Inventory accounting software for SMBs");
    expect(page).toContain('rel="canonical"');
    expect(page).toContain('"@type": "FAQPage"');
    expect(page).toContain('"@type": "SoftwareApplication"');
    expect(page).toContain("Sources");
    expect(page).toContain("https://www.irs.gov/publications/p334");
    expect(page).toContain("https://www.ifrs.org/issued-standards/list-of-standards/ias-2-inventories/");
    expectInternalLink(page, "/inventory-management-software");
    expectInternalLink(page, "/inventory-software-south-asia");
    expect(protectedRoutes).toContain('"/inventory-accounting-software"');
    expectInternalLink(landing, "/inventory-accounting-software");
    expect(sitemap).toContain("<loc>https://www.treesols.com/inventory-accounting-software</loc>");
    expect(robots).toContain("Allow: /inventory-accounting-software");
  });

  it("maps South Asia SMB inventory software queries to an answer-ready page", () => {
    const page = read("pages/inventory-software-south-asia.js");
    const protectedRoutes = read("components/protectedRoutes.js");
    const landing = read("pages/index.js");
    const sitemap = read("public/sitemap.xml");
    const robots = read("public/robots.txt");

    expect(page).toContain("Inventory software for South Asian SMBs");
    expect(page).toContain("What should South Asian SMBs look for in inventory software?");
    expect(page).toContain('rel="canonical"');
    expect(page).toContain('"@type": "FAQPage"');
    expect(page).toContain('"@type": "SoftwareApplication"');
    expect(page).toContain("Sources");
    expect(page).toContain("https://www.adb.org/publications/series/asia-small-medium-sized-enterprise-monitor");
    expect(page).toContain("https://www.oecd.org/en/topics/digitalisation-of-smes.html");
    expect(page).toContain(
      "https://www.worldbank.org/ext/en/topic/competitiveness/small-and-medium-enterprises-smes-finance"
    );
    expectInternalLink(page, "/inventory-management-software");
    expectInternalLink(page, "/inventory-accounting-software");
    expect(protectedRoutes).toContain('"/inventory-software-south-asia"');
    expectInternalLink(landing, "/inventory-software-south-asia");
    expect(sitemap).toContain("<loc>https://www.treesols.com/inventory-software-south-asia</loc>");
    expect(robots).toContain("Allow: /inventory-software-south-asia");
  });
});
