"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class company extends Model {
    static associate({ Purchase }) {
      this.hasMany(Purchase, { foreignKey: "companyId" });
    }
  }
  company.init(
    {
      companyName: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          isLowercase: {
            msg: "company name must be lowercase",
          },
          min: 3,
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
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
      modelName: "company",
    }
  );
  return company;
};
