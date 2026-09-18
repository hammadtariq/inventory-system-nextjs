"use strict";

const TENANT_TABLES = [
  "users",
  "customers",
  "companies",
  "inventories",
  "purchases",
  "sales",
  "saleReturns",
  "items",
  "ledgers",
  "cheques",
  "purchase_histories",
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (const tableName of TENANT_TABLES) {
      await queryInterface.changeColumn(tableName, "organizationId", {
        type: Sequelize.INTEGER,
        allowNull: false,
      });
    }

    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS "customers" DROP CONSTRAINT IF EXISTS "customers_email_key";
      ALTER TABLE IF EXISTS "customers" DROP CONSTRAINT IF EXISTS "customers_email_unique";
      ALTER TABLE IF EXISTS "companies" DROP CONSTRAINT IF EXISTS "companies_companyName_key";
      ALTER TABLE IF EXISTS "companies" DROP CONSTRAINT IF EXISTS "companies_companyName_unique";
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "customers_organization_id_email_unique"
      ON "customers" ("organizationId", "email");

      CREATE UNIQUE INDEX IF NOT EXISTS "companies_organization_id_company_name_unique"
      ON "companies" ("organizationId", "companyName");
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "customers_organization_id_email_unique";
      DROP INDEX IF EXISTS "companies_organization_id_company_name_unique";
    `);

    for (const tableName of TENANT_TABLES) {
      await queryInterface.changeColumn(tableName, "organizationId", {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
  },
};
