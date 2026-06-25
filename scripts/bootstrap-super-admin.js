"use strict";

const bcrypt = require("bcrypt");
const Sequelize = require("sequelize");

const env = process.env.NODE_ENV || "development";
const config = require("../config/config.js")[env];

const requiredEnv = ["SUPER_ADMIN_EMAIL", "SUPER_ADMIN_PASSWORD", "SUPER_ADMIN_FIRST_NAME", "SUPER_ADMIN_LAST_NAME"];

async function run() {
  for (const key of requiredEnv) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  const sequelize = new Sequelize(config.database, config.username, config.password, config);

  try {
    await sequelize.authenticate();

    const [organization] = await sequelize.query(
      `
        INSERT INTO organizations (name, slug, plan, status, "maxUsers", "createdAt", "updatedAt")
        VALUES ('System', 'system', 'ENTERPRISE', 'ACTIVE', 100, NOW(), NOW())
        ON CONFLICT (slug)
        DO UPDATE SET
          name = EXCLUDED.name,
          plan = EXCLUDED.plan,
          status = EXCLUDED.status,
          "maxUsers" = EXCLUDED."maxUsers",
          "updatedAt" = NOW()
        RETURNING id, uuid, name, slug;
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const passwordHash = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD, 10);

    const [user] = await sequelize.query(
      `
        INSERT INTO users (
          "firstName",
          "lastName",
          email,
          password,
          role,
          "organizationId",
          status,
          "acceptedAt",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          :firstName,
          :lastName,
          :email,
          :password,
          'SUPER_ADMIN',
          :organizationId,
          'ACTIVE',
          NOW(),
          NOW(),
          NOW()
        )
        ON CONFLICT (email)
        DO UPDATE SET
          "firstName" = EXCLUDED."firstName",
          "lastName" = EXCLUDED."lastName",
          password = EXCLUDED.password,
          role = 'SUPER_ADMIN',
          "organizationId" = EXCLUDED."organizationId",
          status = 'ACTIVE',
          "acceptedAt" = NOW(),
          "updatedAt" = NOW()
        RETURNING id, uuid, "firstName", "lastName", email, role, "organizationId";
      `,
      {
        replacements: {
          firstName: process.env.SUPER_ADMIN_FIRST_NAME.toLowerCase(),
          lastName: process.env.SUPER_ADMIN_LAST_NAME.toLowerCase(),
          email: process.env.SUPER_ADMIN_EMAIL.toLowerCase(),
          password: passwordHash,
          organizationId: organization.id,
        },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    console.log("Super admin bootstrap complete:", { organization, user });
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = run;
