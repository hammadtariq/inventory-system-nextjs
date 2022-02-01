"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class inventory extends Model {
    static associate({ Company }) {
      this.belongsTo(Company, { foreignKey: "companyId" });
    }
    toJSON() {
      return { ...this.get(), companyId: undefined };
    }
  }
  inventory.init(
    {
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      itemName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isLowercase: {
            msg: "Item Name must be lowercase",
          },
        },
      },
      noOfBales: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      baleWeightLbs: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      baleWeightKgs: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      ratePerLbs: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      ratePerKgs: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      ratePerBale: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      onHand: {
        type: DataTypes.INTEGER,
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
