"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("items", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      sNo: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
      },
      itemName: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isLowercase: {
            msg: "Item Name must be lowercase",
          },
        },
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
        allowNull: true,
      },
      type: Sequelize.ENUM(["SMALL_BALES", "BIG_BALES"]),
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
    await queryInterface.dropTable("items");
  },
};
