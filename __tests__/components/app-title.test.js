import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AppTitle from "@/components/title";

describe("AppTitle", () => {
  test("renders page actions outside the heading", () => {
    const html = renderToStaticMarkup(
      <AppTitle level={2}>
        Purchase Order List
        <div data-testid="actions">Actions</div>
      </AppTitle>
    );

    expect(html).toContain("Purchase Order List");
    expect(html).toContain("Actions");
    expect(html).toMatch(/<h2[^>]*>Purchase Order List<\/h2>/);
    expect(html).not.toMatch(/<h2[^>]*>[\s\S]*Actions[\s\S]*<\/h2>/);
  });

  test("renders primary action and toolbar in separate regions", () => {
    const html = renderToStaticMarkup(
      <AppTitle level={2} action={<button>Create</button>} toolbar={<input aria-label="Search purchase orders" />}>
        Purchase Order List
      </AppTitle>
    );

    expect(html).toContain("Create");
    expect(html).toContain("Search purchase orders");
    expect(html).toMatch(/<h2[^>]*>Purchase Order List<\/h2>/);
    expect(html).not.toMatch(/<h2[^>]*>[\s\S]*(Create|Search purchase orders)[\s\S]*<\/h2>/);
  });
});
