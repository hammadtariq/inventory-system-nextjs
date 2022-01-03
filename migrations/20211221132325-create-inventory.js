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
      itemName: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isLowercase: {
            msg: "Item Name must be lowercase",
          },
        },
      },
      noOfBales: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      baleWeightLbs: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      baleWeightKgs: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      ratePerLbs: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      ratePerKgs: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      ratePerBale: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      onHand: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      companyId: {
        type: Sequelize.INTEGER,
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
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("inventories");
  },
};
