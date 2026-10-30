import db from "@/lib/postgres";

const appConfig = require("@/config/config.js")[process.env.NODE_ENV || "development"];

describe("lib/postgres connection timeouts", () => {
  it("sets statement, lock and idle-in-transaction timeouts on the app's connections", () => {
    expect(db.sequelize.options.dialectOptions).toMatchObject({
      statement_timeout: 30000,
      lock_timeout: 10000,
      idle_in_transaction_session_timeout: 30000,
    });
  });

  it("leaves config/config.js without timeouts, so migrations and scripts can run long", () => {
    expect(appConfig.dialectOptions?.statement_timeout).toBeUndefined();
    expect(appConfig.dialectOptions?.lock_timeout).toBeUndefined();
  });
});
