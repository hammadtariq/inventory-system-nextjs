require("dotenv").config();

const host = process.env.POSTGRES_HOST || "localhost";
const isRemote = process.env.POSTGRES_SSL === "true" || host.includes("supabase.co");
const ssl = isRemote ? { require: true, rejectUnauthorized: false } : false;

// Vercel freezes a timed-out function without closing its connection, so its open transaction keeps its row
// locks and every retry of the same approval waits on them. Fail fast instead, and let Postgres end abandoned
// transactions. Values in ms.
const timeouts = {
  statement_timeout: 30000,
  lock_timeout: 10000,
  idle_in_transaction_session_timeout: 30000,
};

module.exports = {
  development: {
    username: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "postgres",
    database: process.env.POSTGRES_DB || "inventory-management-local",
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
    dialect: "postgres",
    dialectOptions: ssl ? { ssl, ...timeouts } : { ...timeouts },
    pool: {
      // Each request holds one connection for its tenant transaction, and approval opens a second one, so
      // a pool of 2 deadlocks as soon as two such requests overlap (dashboard load, parallel approvals). #228
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  test: {
    username: process.env.POSTGRES_USER || "root",
    password: process.env.POSTGRES_PASSWORD || null,
    database: process.env.POSTGRES_DB || "database_test",
    host: process.env.POSTGRES_HOST || "127.0.0.1",
    port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
    dialect: "postgres",
  },
  production: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
    dialect: "postgres",
    dialectOptions: ssl ? { ssl, ...timeouts } : { ...timeouts },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
};
