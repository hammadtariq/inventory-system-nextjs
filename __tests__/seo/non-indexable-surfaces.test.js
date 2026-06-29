import fs from "fs";
import path from "path";

const read = (filePath) => fs.readFileSync(path.join(process.cwd(), filePath), "utf8");

describe("non-indexable app surfaces", () => {
  it("sets noindex by default in the app wrapper for gated SSR routes", () => {
    const app = read("pages/_app.js");

    expect(app).toContain("indexablePublicRoutes");
    expect(app).toContain('<meta name="robots" content="noindex,nofollow" />');
  });

  it("marks authenticated app layout as noindex", () => {
    const layout = read("components/layout.js");

    expect(layout).toContain('<meta name="robots" content="noindex,nofollow" />');
  });

  it("marks auth utility layout as noindex", () => {
    const authLayout = read("components/authLayout.js");

    expect(authLayout).toContain('<meta name="robots" content="noindex,nofollow" />');
  });
});
