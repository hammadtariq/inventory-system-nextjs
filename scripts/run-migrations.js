"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");

const env = process.env.NODE_ENV || "development";
const config = require("../config/config.js")[env];

const sequelize = new Sequelize(config.database, config.username, config.password, config);
const queryInterface = sequelize.getQueryInterface();
const migrationsDir = path.join(__dirname, "..", "migrations");

async function ensureMetaTable() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
      name VARCHAR(255) NOT NULL PRIMARY KEY
    );
  `);
}

async function getExecutedMigrations() {
  const [rows] = await sequelize.query('SELECT name FROM "SequelizeMeta";');
  return new Set(rows.map((row) => row.name));
}

async function run() {
  await sequelize.authenticate();
  await ensureMetaTable();

  const executed = await getExecutedMigrations();
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".js"))
    .sort();

  for (const file of files) {
    if (executed.has(file)) continue;

    const migration = require(path.join(migrationsDir, file));
    console.log(`Running migration ${file}`);
    await migration.up(queryInterface, Sequelize);
    await sequelize.query('INSERT INTO "SequelizeMeta" (name) VALUES (:name);', {
      replacements: { name: file },
    });
  }

  console.log("Migrations complete");
}

run()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
