"use strict";

const TABLES = [
  "customers",
  "companies",
  "inventories",
  "purchases",
  "purchase_histories",
  "sales",
  "saleReturns",
  "items",
  "ledgers",
  "cheques",
];

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      INSERT INTO organizations (uuid, name, slug, plan, status, "maxUsers", "createdAt", "updatedAt")
      SELECT '00000000-0000-4000-8000-000000000001', 'Default', 'default', 'STARTER', 'ACTIVE', 5, NOW(), NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM organizations WHERE slug = 'default'
      );
    `);

    for (const table of TABLES) {
      await queryInterface.sequelize.query(`
        UPDATE "${table}"
        SET "organizationId" = (
          SELECT id FROM organizations WHERE slug = 'default'
        )
        WHERE "organizationId" IS NULL;
      `);
    }
  },

  down: async () => {},
};
