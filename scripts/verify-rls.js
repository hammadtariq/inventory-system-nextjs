"use strict";

const Sequelize = require("sequelize");

const env = process.env.NODE_ENV || "development";
const config = require("../config/config.js")[env];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const runAsTenant = async (organizationId, fn) => {
  return sequelize.transaction(async (transaction) => {
    await sequelize.query("SET LOCAL app.tenant_id = :organizationId", {
      transaction,
      replacements: { organizationId },
    });
    return fn(transaction);
  });
};

async function run() {
  await sequelize.authenticate();

  const roleInfo = await sequelize.query(
    `SELECT current_user AS role_name, rolsuper, rolbypassrls
     FROM pg_roles
     WHERE rolname = current_user`,
    {
      type: Sequelize.QueryTypes.SELECT,
    }
  );

  const currentRole = roleInfo[0];
  if (!currentRole) {
    throw new Error("Unable to determine current database role.");
  }

  if (currentRole.rolsuper || currentRole.rolbypassrls) {
    throw new Error(
      `Current database role "${currentRole.role_name}" still bypasses RLS. Use a non-superuser, non-BYPASSRLS app role.`
    );
  }

  const organizations = await sequelize.query(`SELECT id FROM organizations ORDER BY id ASC LIMIT 2`, {
    type: Sequelize.QueryTypes.SELECT,
  });

  if (!organizations || organizations.length < 2) {
    throw new Error("Need at least two organizations to verify RLS.");
  }

  const orgA = organizations[0];
  const orgB = organizations[1];

  const customerFromA = await runAsTenant(orgA.id, async (transaction) => {
    const result = await sequelize.query(`SELECT id FROM customers ORDER BY id ASC LIMIT 1`, {
      transaction,
      type: Sequelize.QueryTypes.SELECT,
    });
    return result[0] || null;
  });

  if (!customerFromA) {
    throw new Error("Need at least one customer in the first organization to verify RLS.");
  }

  const orgAVisibleCount = await runAsTenant(orgA.id, async (transaction) => {
    const result = await sequelize.query(`SELECT COUNT(*)::int AS count FROM customers`, {
      transaction,
      type: Sequelize.QueryTypes.SELECT,
    });
    return result[0]?.count || 0;
  });

  const orgBCanSeeOrgACustomer = await runAsTenant(orgB.id, async (transaction) => {
    const result = await sequelize.query(`SELECT COUNT(*)::int AS count FROM customers WHERE id = :customerId`, {
      transaction,
      replacements: { customerId: customerFromA.id },
      type: Sequelize.QueryTypes.SELECT,
    });
    return result[0]?.count || 0;
  });

  const anonymousCount = await sequelize.query(`SELECT COUNT(*)::int AS count FROM customers`, {
    type: Sequelize.QueryTypes.SELECT,
  });

  console.table({
    orgAVisibleCount,
    orgBCanSeeOrgACustomer,
    anonymousCount: anonymousCount[0]?.count || 0,
  });

  if (orgAVisibleCount <= 0) {
    throw new Error("RLS did not expose rows to the matching tenant.");
  }

  if (orgBCanSeeOrgACustomer !== 0) {
    throw new Error("RLS leaked a customer row across tenants.");
  }

  if ((anonymousCount[0]?.count || 0) !== 0) {
    throw new Error("RLS allowed anonymous access without tenant context.");
  }

  console.log("RLS verification passed");
}

if (require.main === module) {
  run()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await sequelize.close();
    });
}

module.exports = run;
