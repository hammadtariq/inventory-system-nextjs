import {
  getActiveNavigationItem,
  getMobileNavigationItems,
  getNavigationItems,
  getToggledDrawerOpen,
} from "@/lib/navigation";

describe("navigation config", () => {
  test("returns base navigation for editor users", () => {
    const items = getNavigationItems("EDITOR");

    expect(items.map((item) => item.title)).toEqual([
      "Overview",
      "Customers",
      "Company",
      "Items List",
      "Purchase",
      "Inventory",
      "Sales",
      "Sale Returns",
      "Quotation",
      "Ledger",
      "Reports",
      "Cheques",
    ]);
  });

  test("adds users for admin users", () => {
    const items = getNavigationItems("ADMIN");

    expect(items.map((item) => item.title)).toContain("Users");
    expect(items.map((item) => item.title)).toContain("Payments");
    expect(items.map((item) => item.title)).not.toContain("Organizations");
  });

  test("adds organizations for super admin users", () => {
    const items = getNavigationItems("SUPER_ADMIN");

    expect(items.map((item) => item.title)).toContain("Users");
    expect(items.map((item) => item.title)).toContain("Organizations");
  });

  test("keeps owner mobile shortcuts focused on approval and status routes", () => {
    const items = getMobileNavigationItems("ADMIN");

    expect(items.map((item) => item.title)).toEqual(["Purchase", "Sales", "Ledger", "Reports"]);
    expect(items.map((item) => item.url)).toEqual(["/purchase", "/sales", "/ledger", "/reports"]);
  });

  test("matches active items for nested and create routes", () => {
    const items = getNavigationItems("ADMIN");

    expect(getActiveNavigationItem(items, "/purchase/12").title).toBe("Purchase");
    expect(getActiveNavigationItem(items, "/quotation/create").title).toBe("Quotation");
  });

  test("toggles mobile drawer state from the hamburger button", () => {
    expect(getToggledDrawerOpen(false)).toBe(true);
    expect(getToggledDrawerOpen(true)).toBe(false);
  });
});
