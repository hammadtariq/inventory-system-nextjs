import fs from "fs";
import path from "path";

const { INDEXNOW_KEY, INDEXNOW_KEY_FILE, buildIndexNowPayload } = require("../../scripts/indexnow-submit");

describe("IndexNow discovery support", () => {
  it("hosts the IndexNow key at the site root", () => {
    const keyPath = path.join(process.cwd(), "public", INDEXNOW_KEY_FILE);

    expect(INDEXNOW_KEY).toMatch(/^[a-f0-9]{32}$/);
    expect(fs.readFileSync(keyPath, "utf8").trim()).toBe(INDEXNOW_KEY);
  });

  it("builds a submission payload for every indexable public page", () => {
    const payload = buildIndexNowPayload();

    expect(payload).toEqual(
      expect.objectContaining({
        host: "www.treesols.com",
        key: INDEXNOW_KEY,
        keyLocation: `https://www.treesols.com/${INDEXNOW_KEY_FILE}`,
      })
    );
    expect(payload.urlList).toEqual([
      "https://www.treesols.com/",
      "https://www.treesols.com/about",
      "https://www.treesols.com/privacy",
      "https://www.treesols.com/terms",
      "https://www.treesols.com/inventory-management-software",
      "https://www.treesols.com/inventory-accounting-software",
      "https://www.treesols.com/inventory-software-south-asia",
    ]);
  });

  it("exposes a package script for repeatable submissions", () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));

    expect(packageJson.scripts["seo:indexnow"]).toBe("node scripts/indexnow-submit.js");
  });
});
