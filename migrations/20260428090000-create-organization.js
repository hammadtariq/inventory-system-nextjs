"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("organizations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      plan: {
        type: Sequelize.ENUM("STARTER", "PRO", "ENTERPRISE"),
        defaultValue: "STARTER",
      },
      status: {
        type: Sequelize.ENUM("ACTIVE", "SUSPENDED", "CANCELLED"),
        defaultValue: "ACTIVE",
      },
      maxUsers: {
        type: Sequelize.INTEGER,
        defaultValue: 5,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("organizations");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_organizations_plan";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_organizations_status";');
  },
};
