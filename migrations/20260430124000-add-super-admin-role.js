"use strict";

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
    `);
  },

  down: async () => {
    // PostgreSQL cannot safely remove enum values without rebuilding the type.
  },
};
