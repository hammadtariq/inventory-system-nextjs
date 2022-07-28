"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("ledgers", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      paymentType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      otherName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      companyId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      spendType: {
        type: Sequelize.ENUM(["CREDIT", "DEBIT"]),
        allowNull: false,
      },
      amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      invoiceNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      paymentDate: {
        allowNull: true,
        type: Sequelize.DATE,
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
    await queryInterface.dropTable("ledgers");
  },
};
