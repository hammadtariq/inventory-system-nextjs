import { createMocks } from "node-mocks-http";

import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
import { createCompany } from "@/pages/api/company/index";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  Company: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

describe("company create API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("scopes company duplicates to the current organization", async () => {
    db.Company.findOne.mockResolvedValue(null);
    db.Company.create.mockResolvedValue({});

    const { req, res } = createMocks({
      method: "POST",
      body: {
        companyName: "same company",
        email: "same@gmail.com",
        phone: "1234567890",
        address: "1234 Main Street",
      },
    });

    await TenantContext.run(11, async () => createCompany(req, res));

    expect(db.Company.findOne).toHaveBeenCalledWith({
      where: {
        companyName: "same company",
        organizationId: 11,
      },
    });
    expect(db.Company.create).toHaveBeenCalledWith({
      companyName: "same company",
      email: "same@gmail.com",
      phone: "1234567890",
      address: "1234 Main Street",
      organizationId: 11,
    });
    expect(res._getStatusCode()).toBe(200);
  });

  it("returns 409 when the same company already exists in the same organization", async () => {
    db.Company.findOne.mockResolvedValue({ id: 1 });

    const { req, res } = createMocks({
      method: "POST",
      body: {
        companyName: "same company",
        email: "same@gmail.com",
        phone: "1234567890",
        address: "1234 Main Street",
      },
    });

    await TenantContext.run(11, async () => createCompany(req, res));

    expect(res._getStatusCode()).toBe(409);
    expect(res._getData()).toEqual({
      message: 'Company "same company" already exists in this organization.',
    });
    expect(db.Company.create).not.toHaveBeenCalled();
  });
});
