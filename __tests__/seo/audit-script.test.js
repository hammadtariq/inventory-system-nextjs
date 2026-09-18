const { auditSeoState } = require("../../scripts/seo-audit");

describe("SEO audit script", () => {
  it("reports no local critical gaps for configured priority pages", () => {
    const report = auditSeoState({ cwd: process.cwd() });

    expect(report.summary.critical).toBe(0);
    expect(report.summary.priorityQueries).toBe(3);
    expect(report.summary.indexablePages).toBe(7);
    expect(report.gaps.filter((gap) => gap.impact === "critical")).toEqual([]);
  });

  it("maps every priority query to a crawlable answer-ready page", () => {
    const report = auditSeoState({ cwd: process.cwd() });

    expect(report.priorityQueries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          query: "inventory management software",
          path: "/inventory-management-software",
          status: "pass",
        }),
        expect.objectContaining({
          query: "inventory accounting software",
          path: "/inventory-accounting-software",
          status: "pass",
        }),
        expect.objectContaining({
          query: "inventory software for Asian SMBs",
          path: "/inventory-software-south-asia",
          status: "pass",
        }),
      ])
    );
  });
});
