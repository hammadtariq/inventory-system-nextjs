"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class saleReturn extends Model {
    static associate({ Sale, Customer }) {
      this.belongsTo(Sale, { foreignKey: "saleId" });
      this.belongsTo(Customer, { foreignKey: "customerId" });
    }

    toJSON() {
      return { ...this.get() };
    }
  }

  saleReturn.init(
    {
      saleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      totalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      returnedProducts: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      reference: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      returnDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      ledgerId: {
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
      modelName: "saleReturn",
    }
  );

  return saleReturn;
};
