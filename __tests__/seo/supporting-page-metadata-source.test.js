import fs from "fs";
import path from "path";

const readPage = (fileName) => fs.readFileSync(path.join(process.cwd(), "pages", fileName), "utf8");

describe("supporting public page SEO metadata", () => {
  it.each(["about.js", "privacy.js", "terms.js"])("%s defines canonical, robots, and social metadata", (fileName) => {
    const source = readPage(fileName);

    expect(source).toContain('rel="canonical"');
    expect(source).toContain('<meta name="robots" content="index,follow" />');
    expect(source).toContain('property="og:title"');
    expect(source).toContain('property="og:url"');
  });
});
