"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PurchaseHistory extends Model {
    static associate(db) {
      this.belongsTo(db.Company, { foreignKey: "companyId" });
      this.belongsTo(db.Purchase, { foreignKey: "purchaseId" });
    }

    toJSON() {
      return { ...this.get(), id: undefined };
    }
  }

  PurchaseHistory.init(
    {
      purchaseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      totalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      surCharge: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      purchasedProducts: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      revisionDetails: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      revisionNo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      status: DataTypes.ENUM(["PENDING", "APPROVED", "CANCEL"]),
      baleType: DataTypes.ENUM(["SMALL_BALES", "BIG_BALES"]),
      purchaseDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "purchaseHistory",
      tableName: "purchase_histories",
    }
  );

  return PurchaseHistory;
};
