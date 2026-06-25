import fs from "fs";
import path from "path";

describe("landing page SEO/GEO metadata", () => {
  it("defines canonical, social, and structured data metadata", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "pages", "landing.js"), "utf8");

    expect(source).toContain('rel="canonical"');
    expect(source).toContain('property="og:title"');
    expect(source).toContain('"@type": "SoftwareApplication"');
    expect(source).toContain('"@type": "FAQPage"');
    expect(source).toContain('"@type": "Organization"');
    expect(source).toContain('type="application/ld+json"');
  });
});
