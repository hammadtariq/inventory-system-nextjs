"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class purchase extends Model {
    static associate({ Company }) {
      this.belongsTo(Company, { foreignKey: "companyId" });
    }
    toJSON() {
      return { ...this.get(), companyId: undefined };
    }
  }
  purchase.init(
    {
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      totalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      purchasedProducts: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      status: DataTypes.ENUM(["PENDING", "APPROVED"]),
      purchaseDate: {
        type: DataTypes.DATE,
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
      modelName: "purchase",
    }
  );
  return purchase;
};
