"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("sales", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      laborCharge: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      totalAmount: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      soldProducts: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      status: Sequelize.ENUM(["PENDING", "APPROVED", "CANCEL"]),
      soldDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
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
    await queryInterface.dropTable("sales");
  },
};
