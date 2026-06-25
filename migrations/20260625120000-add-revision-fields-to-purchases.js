"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable("purchases");
    if (!table["revisionNo"]) {
      await queryInterface.addColumn("purchases", "revisionNo", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }
    if (!table["revisionDetails"]) {
      await queryInterface.addColumn("purchases", "revisionDetails", {
        type: Sequelize.JSONB,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("purchases", "revisionNo");
    await queryInterface.removeColumn("purchases", "revisionDetails");
  },
};
