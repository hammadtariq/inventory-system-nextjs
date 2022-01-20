"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class sale extends Model {
    static associate({ Customer }) {
      this.belongsTo(Customer, { foreignKey: "customerId" });
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
