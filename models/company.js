"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class company extends Model {
    static associate({ Purchase, Ledger }) {
      this.hasMany(Purchase, { foreignKey: "companyId" });
      this.hasMany(Ledger, { foreignKey: "companyId" });
    }
  }
  company.init(
    {
      companyName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          // isLowercase: {
          //   msg: "company name must be lowercase",
          // },
          len: {
            args: [3],
            msg: "First name must be greater than 3 characters",
          },
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
      organizationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "company",
      indexes: [
        {
          unique: true,
          fields: ["organizationId", "companyName"],
          name: "companies_organization_id_company_name_unique",
        },
      ],
    }
  );
  return company;
};
