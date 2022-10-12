"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("ledgers", "totalBalance", Sequelize.FLOAT);
  },

  down: async (queryInterface) => {
    // await queryInterface.dropTable("ledgers");
  },
};
