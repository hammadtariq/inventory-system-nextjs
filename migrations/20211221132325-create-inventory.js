"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("inventories", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      productName: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isLowercase: {
            msg: "Product Name must be lowercase",
          },
        },
      },
      productLabel: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isLowercase: {
            msg: "Product Label must be lowercase",
          },
        },
      },
      starting: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      received: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      onHand: {
        type: Sequelize.INTEGER,
        allowNull: true,
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
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("inventories");
  },
};
