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
      received: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      onHand: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      bundleCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      bundleWeight: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      bundleCost: {
        type: DataTypes.FLOAT,
        allowNull: false,
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
