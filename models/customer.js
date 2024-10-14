"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class customer extends Model {
    static associate({ Ledger }) {
      this.hasMany(Ledger, { foreignKey: "customerId" });
    }
  }
  customer.init(
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isLowercase: {
              msg: "First name must be lowercase",
            },
          len: {
            args: [3, 12],
            msg: "First name must be between 3 to 12 characters",
          },
        },
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isLowercase: { msg: "Last name must be lowercase" },
          len: {
            args: [3, 12], // Validates string length between 3 and 12 characters
            msg: "Last name must be between 3 to 12 characters",
          },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: { msg: "Provide valid email address" },
          isLowercase: { msg: "Email should be lowercase" },
        },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true,
        min: 10,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "customer",
    }
  );
  return customer;
};
