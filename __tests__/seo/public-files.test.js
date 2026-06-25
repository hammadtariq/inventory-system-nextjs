import fs from "fs";
import path from "path";

const readPublicFile = (fileName) => fs.readFileSync(path.join(process.cwd(), "public", fileName), "utf8");

describe("SEO discovery files", () => {
  it("exposes robots.txt with sitemap discovery", () => {
    const robots = readPublicFile("robots.txt");

    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Allow: /landing");
    expect(robots).toContain("Allow: /llms.txt");
    expect(robots).toContain("Sitemap: https://stockflow.app/sitemap.xml");
  });

  it("lists indexable public pages in sitemap.xml", () => {
    const sitemap = readPublicFile("sitemap.xml");

    expect(sitemap).toContain("<loc>https://stockflow.app/landing</loc>");
    expect(sitemap).toContain("<loc>https://stockflow.app/about</loc>");
    expect(sitemap).toContain("<loc>https://stockflow.app/privacy</loc>");
    expect(sitemap).toContain("<loc>https://stockflow.app/terms</loc>");
  });

  it("exposes llms.txt with answer-ready pages and source context", () => {
    const llms = readPublicFile("llms.txt");

    expect(llms).toContain("# StockFlow");
    expect(llms).toContain("https://stockflow.app/inventory-management-software");
    expect(llms).toContain("https://stockflow.app/inventory-accounting-software");
    expect(llms).toContain("https://stockflow.app/inventory-software-south-asia");
    expect(llms).toContain("https://www.irs.gov/publications/p334");
    expect(llms).toContain("https://www.adb.org/publications/series/asia-small-medium-sized-enterprise-monitor");
  });
});
