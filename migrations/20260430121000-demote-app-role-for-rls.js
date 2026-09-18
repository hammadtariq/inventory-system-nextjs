"use strict";

module.exports = {
  up: async (queryInterface) => {
    const [rows] = await queryInterface.sequelize.query(`
      SELECT current_user AS role_name, rolsuper, rolbypassrls
      FROM pg_roles
      WHERE rolname = current_user
    `);

    const role = rows[0];
    if (!role) {
      throw new Error("Unable to determine current database role for RLS hardening.");
    }

    if (role.rolsuper || role.rolbypassrls) {
      const roleName = String(role.role_name).replace(/"/g, '""');
      await queryInterface.sequelize.query(`ALTER ROLE "${roleName}" NOSUPERUSER NOBYPASSRLS;`);
    }
  },

  down: async () => {
    // Intentionally left blank. Re-enabling superuser/BYPASSRLS would weaken tenant isolation.
  },
};
