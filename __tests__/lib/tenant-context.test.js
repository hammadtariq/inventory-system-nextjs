import TenantContext from "@/lib/tenant-context";

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
});
