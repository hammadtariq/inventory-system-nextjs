import { bumpInventorySequence } from "@/lib/inventory";
import db from "@/lib/postgres";

jest.mock("@/lib/postgres", () => ({
  __esModule: true,
  default: {
    sequelize: {
      query: jest.fn(),
    },
  },
}));

describe("bumpInventorySequence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("runs a setval query bounded by GREATEST so it never moves the sequence backward", async () => {
    const transaction = {};

    await bumpInventorySequence(123, transaction);

    expect(db.sequelize.query).toHaveBeenCalledTimes(1);
    const [sql, options] = db.sequelize.query.mock.calls[0];
    expect(sql).toContain("setval");
    expect(sql).toContain("GREATEST");
    expect(sql).toContain("inventories_id_seq");
    expect(options).toEqual({ replacements: { id: 123 }, transaction });
  });
});
