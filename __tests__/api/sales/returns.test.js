import TenantContext from "@/lib/tenant-context";
import db from "@/lib/postgres";
// pages/api/sales/returns/index.js builds its default export via
// nextConnect({ onError }).use(auth).post(createSaleReturn).get(getAllSaleReturns) —
// onError/requireRole were previously referenced without being imported from
// @/lib/authz, causing a ReferenceError at module-evaluation time (every request
// to this route crashed with a 500 before even reaching auth/validation).
// Importing the default export here is what actually exercises — and would
// catch a regression of — that line.
import saleReturnsHandler, { updateInventoryForReturn } from "@/pages/api/sales/returns/index";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  sequelize: { query: jest.fn().mockResolvedValue() },
  SaleReturn: { findAndCountAll: jest.fn() },
  Inventory: { findOne: jest.fn(), create: jest.fn() },
  Customer: {},
  Sale: {},
}));

describe("sale returns API module", () => {
  it("builds its default next-connect handler without throwing", () => {
    expect(typeof saleReturnsHandler).toBe("function");
  });
});

describe("updateInventoryForReturn", () => {
  const transaction = {};
  const product = { id: 1, companyId: 1, noOfBales: 5, baleWeightKgs: 100, baleWeightLbs: 200, itemName: "shirt" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("bumps inventories_id_seq past a newly created inventory's explicit id, so the sequence never falls behind", async () => {
    db.Inventory.findOne.mockResolvedValue(null);
    db.Inventory.create.mockResolvedValue({ id: 456 });

    await TenantContext.run(23, async () => updateInventoryForReturn([product], transaction));

    expect(db.sequelize.query).toHaveBeenCalledWith(expect.stringContaining("setval"), {
      replacements: { id: 456 },
      transaction,
    });
  });

  it("does not touch the sequence when reusing an existing inventory row", async () => {
    const mockInventory = {
      increment: jest.fn(),
      update: jest.fn(),
      reload: jest.fn(),
      baleWeightKgs: 0,
      baleWeightLbs: 0,
    };
    db.Inventory.findOne.mockResolvedValue(mockInventory);

    await TenantContext.run(23, async () => updateInventoryForReturn([product], transaction));

    expect(db.sequelize.query).not.toHaveBeenCalled();
  });
});
