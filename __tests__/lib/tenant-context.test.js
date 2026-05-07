import TenantContext from "@/lib/tenant-context";
import { withTenantTransaction } from "@/lib/tenant-transaction";

describe("TenantContext", () => {
  it("returns null outside a tenant context", () => {
    expect(TenantContext.get()).toBeNull();
  });

  it("propagates organizationId through async work", async () => {
    await TenantContext.run(42, async () => {
      await Promise.resolve();

      expect(TenantContext.get()).toBe(42);
      expect(TenantContext.assertGet()).toBe(42);
    });
  });

  it("throws when tenant context is required but missing", () => {
    expect(() => TenantContext.assertGet()).toThrow("TenantContext not set");
  });

  it("adds the active transaction to raw query options", async () => {
    const transaction = { id: "tx-1" };

    await TenantContext.run(42, async () => {
      TenantContext.setTransaction(transaction);

      expect(withTenantTransaction({ type: "SELECT" })).toEqual({
        type: "SELECT",
        transaction,
      });
    });
  });
});
