import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ProtectedRoutes from "@/components/protectedRoutes";

jest.mock("@/hooks/login", () => ({
  verifyToken: jest.fn(),
}));

describe("ProtectedRoutes", () => {
  it("renders public route content on the initial server render", () => {
    const html = renderToStaticMarkup(
      <ProtectedRoutes router={{ pathname: "/landing" }}>
        <main>StockFlow landing content</main>
      </ProtectedRoutes>
    );

    expect(html).toContain("StockFlow landing content");
  });
});
