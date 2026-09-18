"use strict";

const RLS_TABLES = [
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

const createPolicy = (tableName) => {
  const policyName = `${tableName.replace(/"/g, "").replace(/[^a-zA-Z0-9_]/g, "_")}_tenant_isolation`;
  return `
    DROP POLICY IF EXISTS "${policyName}" ON "${tableName}";
    CREATE POLICY "${policyName}" ON "${tableName}"
      USING ("organizationId" = NULLIF(current_setting('app.tenant_id', true), '')::int)
      WITH CHECK ("organizationId" = NULLIF(current_setting('app.tenant_id', true), '')::int);
  `;
};

module.exports = {
  up: async (queryInterface) => {
    for (const tableName of RLS_TABLES) {
      await queryInterface.sequelize.query(`
        ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE "${tableName}" FORCE ROW LEVEL SECURITY;
        ${createPolicy(tableName)}
      `);
    }
  },

  down: async (queryInterface) => {
    for (const tableName of RLS_TABLES) {
      const policyName = `${tableName.replace(/"/g, "").replace(/[^a-zA-Z0-9_]/g, "_")}_tenant_isolation`;
      await queryInterface.sequelize.query(`
        DROP POLICY IF EXISTS "${policyName}" ON "${tableName}";
        ALTER TABLE "${tableName}" NO FORCE ROW LEVEL SECURITY;
        ALTER TABLE "${tableName}" DISABLE ROW LEVEL SECURITY;
      `);
    }
  },
};
