import { requireRole, AuthzError } from "@/lib/authz";

describe("requireRole", () => {
  it("throws AuthzError when user role is not in allowed list", () => {
    const user = { role: "EDITOR" };
    expect(() => requireRole("ADMIN", "SUPER_ADMIN")(user)).toThrow(AuthzError);
  });

  it("throws with the standard forbidden message", () => {
    const user = { role: "EDITOR" };
    expect(() => requireRole("ADMIN")(user)).toThrow("Operation not permitted.");
  });

  it("does not throw when user has an allowed role", () => {
    const admin = { role: "ADMIN" };
    expect(() => requireRole("ADMIN", "SUPER_ADMIN")(admin)).not.toThrow();
  });

  it("does not throw for SUPER_ADMIN when both roles are allowed", () => {
    const superAdmin = { role: "SUPER_ADMIN" };
    expect(() => requireRole("ADMIN", "SUPER_ADMIN")(superAdmin)).not.toThrow();
  });

  it("throws for an unknown role", () => {
    const user = { role: "UNKNOWN" };
    expect(() => requireRole("ADMIN")(user)).toThrow(AuthzError);
  });
});

describe("AuthzError", () => {
  it("is an instance of Error", () => {
    const err = new AuthzError();
    expect(err).toBeInstanceOf(Error);
  });

  it("carries status 403", () => {
    const err = new AuthzError();
    expect(err.status).toBe(403);
  });

  it("carries the default message", () => {
    const err = new AuthzError();
    expect(err.message).toBe("Operation not permitted.");
  });
});
