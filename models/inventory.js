"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class inventory extends Model {
    static associate(models) {}
  }
  inventory.init(
    {
      productName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isLowercase: {
            msg: "product name must be lowercase",
          },
        },
      },
      productLabel: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isLowercase: {
            msg: "product label must be lowercase",
          },
        },
        unique: true,
      },
      starting: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      received: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      onHand: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "inventory",
    }
  );
  return inventory;
};
