"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "status", {
      type: Sequelize.ENUM("ACTIVE", "INVITED", "DISABLED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    });

    await queryInterface.addColumn("users", "inviteTokenHash", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("users", "inviteExpiresAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("users", "invitedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("users", "acceptedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex("users", ["inviteTokenHash"], {
      name: "users_invite_token_hash_idx",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex("users", "users_invite_token_hash_idx");
    await queryInterface.removeColumn("users", "acceptedAt");
    await queryInterface.removeColumn("users", "invitedAt");
    await queryInterface.removeColumn("users", "inviteExpiresAt");
    await queryInterface.removeColumn("users", "inviteTokenHash");
    await queryInterface.removeColumn("users", "status");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_status";');
  },
};
