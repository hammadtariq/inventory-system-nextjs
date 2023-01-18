"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("ledgers", "customerTotal", Sequelize.FLOAT);
    await queryInterface.addColumn("ledgers", "companyTotal", Sequelize.FLOAT);
  },

  down: async (queryInterface) => {
    // await queryInterface.dropTable("ledgers");
  },
};
