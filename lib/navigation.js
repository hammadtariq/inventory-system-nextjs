const baseNavigationItems = [
  { id: "1", title: "Overview", url: "/dashboard", iconKey: "dashboard" },
  { id: "2", title: "Customers", url: "/customers", iconKey: "user" },
  { id: "3", title: "Company", url: "/company", iconKey: "team" },
  { id: "4", title: "Items List", url: "/items", iconKey: "list" },
  { id: "5", title: "Purchase", url: "/purchase", iconKey: "file" },
  { id: "6", title: "Inventory", url: "/inventory", iconKey: "shop" },
  { id: "7", title: "Sales", url: "/sales", iconKey: "file" },
  { id: "12", title: "Sale Returns", url: "/sale-returns", iconKey: "file" },
  { id: "11", title: "Quotation", url: "/quotation/create", iconKey: "presentation" },
  { id: "8", title: "Ledger", url: "/ledger", iconKey: "database" },
  { id: "9", title: "Reports", url: "/reports", iconKey: "presentation" },
  { id: "10", title: "Cheques", url: "/cheques", iconKey: "money" },
];

const adminNavigationItems = [{ id: "13", title: "Users", url: "/users", iconKey: "userAdd" }];

const superAdminNavigationItems = [{ id: "14", title: "Organizations", url: "/organizations", iconKey: "apartment" }];

const mobileShortcutUrls = new Set(["/purchase", "/sales", "/ledger", "/reports"]);

export function getNavigationItems(role) {
  if (role === "SUPER_ADMIN") {
    return [...baseNavigationItems, ...adminNavigationItems, ...superAdminNavigationItems];
  }

  if (role === "ADMIN") {
    return [...baseNavigationItems, ...adminNavigationItems];
  }

  return baseNavigationItems;
}

export function getMobileNavigationItems(role) {
  return getNavigationItems(role).filter((item) => mobileShortcutUrls.has(item.url));
}

export function getActiveNavigationItem(items, pathname) {
  const baseRoute = `/${pathname.split("/")[1] || ""}`;
  return (
    items.find((item) => item.url === pathname) ||
    items.find((item) => item.url !== "/" && pathname.startsWith(`${item.url}/`)) ||
    items.find((item) => item.url === baseRoute) ||
    items[0]
  );
}

export function getToggledDrawerOpen(isOpen) {
  return !isOpen;
}
