"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("purchase_histories", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      purchaseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "purchases", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      companyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      totalAmount: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      surCharge: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      invoiceNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      purchasedProducts: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      revisionDetails: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      revisionNo: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM("PENDING", "APPROVED", "CANCEL"),
        allowNull: true,
      },
      baleType: {
        type: Sequelize.ENUM("SMALL_BALES", "BIG_BALES"),
        allowNull: true,
      },
      purchaseDate: {
        type: Sequelize.DATE,
        allowNull: false,
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
    await queryInterface.dropTable("purchase_histories");
  },
};
