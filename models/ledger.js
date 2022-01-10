"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ledger extends Model {
    static associate({ Company, User }) {
      this.belongsTo(Company, { foreignKey: "companyId" });
      this.belongsTo(User, { foreignKey: "userId" });
    }
    toJSON() {
      return { ...this.get(), companyId: undefined, userId: undefined };
    }
  }
  ledger.init(
    {
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      spendType: {
        type: DataTypes.ENUM(["CREDIT", "DEBIT"]),
        allowNull: false,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "ledger",
    }
  );
  return ledger;
};
