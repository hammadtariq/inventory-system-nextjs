"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "organizationId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "organizations",
        key: "id",
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("users", "organizationId");
  },
};
