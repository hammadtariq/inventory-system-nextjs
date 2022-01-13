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
      paymentDate: {
        allowNull: true,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "ledger",
    }
  );
  return ledger;
};
