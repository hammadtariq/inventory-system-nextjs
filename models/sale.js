"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class sale extends Model {
    static associate({ Customer, SaleReturn }) {
      this.belongsTo(Customer, { foreignKey: "customerId" });
      this.hasMany(SaleReturn, { foreignKey: "saleId" });
    }
    toJSON() {
      return { ...this.get(), customerId: undefined };
    }
  }
  sale.init(
    {
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      laborCharge: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      totalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      soldProducts: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      status: DataTypes.ENUM(["PENDING", "APPROVED", "CANCEL"]),
      soldDate: {
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
      modelName: "sale",
    }
  );
  return sale;
};
