import { createMocks } from "node-mocks-http";
import { Op } from "sequelize";

import db from "@/lib/postgres";
import { getAllCompanies } from "@/pages/api/company/index";

jest.mock("@/lib/postgres", () => ({ dbConnect: jest.fn(), Company: { findAndCountAll: jest.fn() } }));

// 60 companies, newest first; "Imperial Traders" is the least recently updated.
const companies = Array.from({ length: 60 }, (_, i) => ({ id: i + 1, companyName: `Company ${i + 1}` }));
companies[59].companyName = "Imperial Traders";

beforeEach(() => {
  db.Company.findAndCountAll.mockImplementation(async ({ limit, offset }) => {
    const rows = companies.slice(Number(offset), Number(offset) + Number(limit));
    return { count: companies.length, rows };
  });
});

const list = async (query) => {
  const { req, res } = createMocks({ method: "GET", query });
  await getAllCompanies(req, res);
  return res._getData().rows.map((c) => c.companyName);
};

it("company dropdown query (attributes only) includes companies past the first page", async () => {
  expect(await list({ attributes: JSON.stringify(["companyName", "id"]) })).toContain("Imperial Traders");
});

it("company list search looks across all companies, not just the loaded page", async () => {
  db.Company.findAndCountAll.mockImplementation(async ({ where, limit, offset }) => {
    const term = where?.companyName?.[Op.iLike]?.replaceAll("%", "").toLowerCase();
    const matches = term ? companies.filter((c) => c.companyName.toLowerCase().includes(term)) : companies;
    return { count: matches.length, rows: matches.slice(Number(offset), Number(offset) + Number(limit)) };
  });

  expect(await list({ limit: "50", offset: "0", search: "imperial" })).toEqual(["Imperial Traders"]);
});
