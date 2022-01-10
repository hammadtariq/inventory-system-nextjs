"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class items extends Model {
    static associate({ Company }) {
      this.belongsTo(Company, { foreignKey: "companyId" });
    }
    toJSON() {
      return { ...this.get(), companyId: undefined };
    }
  }
  items.init(
    {
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      sNo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
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
      type: DataTypes.ENUM(["SMALL_BALES", "BIG_BALES"]),
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "items",
    }
  );
  return items;
};
