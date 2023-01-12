"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ledger extends Model {
    static associate({ Company, Customer }) {
      this.belongsTo(Company, { foreignKey: "companyId" });
      this.belongsTo(Customer, { foreignKey: "customerId" });
    }
    toJSON() {
      return { ...this.get(), companyId: undefined, customerId: undefined };
    }
  }
  ledger.init(
    {
      paymentType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      otherName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      spendType: {
        type: DataTypes.ENUM(["CREDIT", "DEBIT"]),
        allowNull: false,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      paymentDate: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      totalBalance: {
        type: DataTypes.FLOAT,
      },
      companyTotal: {
        allowNull: true,
        type: DataTypes.FLOAT,
      },
      customerTotal: {
        allowNull: true,
        type: DataTypes.FLOAT,
      },
      transactionId: {
        type: DataTypes.INTEGER,
      },
    },
    {
      sequelize,
      modelName: "ledger",
    }
  );
  return ledger;
};
