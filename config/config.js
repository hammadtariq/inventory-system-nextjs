require("dotenv").config();

const host = process.env.POSTGRES_HOST || "localhost";
const isRemote = process.env.POSTGRES_SSL === "true" || host.includes("supabase.co");
const ssl = isRemote ? { require: true, rejectUnauthorized: false } : false;

module.exports = {
  development: {
    username: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "postgres",
    database: process.env.POSTGRES_DB || "inventory-management-local",
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
    dialect: "postgres",
    dialectOptions: ssl ? { ssl } : {},
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
    dialectOptions: ssl ? { ssl } : {},
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
};
