"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("ledgers", "customerTotal", Sequelize.FLOAT);
    await queryInterface.addColumn("ledgers", "companyTotal", Sequelize.FLOAT);
    await queryInterface.addColumn("ledgers", "totalBalance", Sequelize.FLOAT);
    await queryInterface.addColumn("ledgers", "transactionId", Sequelize.INTEGER);
  },

  down: async (queryInterface) => {
    // await queryInterface.dropTable("ledgers");
  },
};
