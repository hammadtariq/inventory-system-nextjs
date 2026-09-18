"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class organization extends Model {
    static associate({ User }) {
      this.hasMany(User, { foreignKey: "organizationId" });
    }
  }

  organization.init(
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: {
            args: [3, 255],
            msg: "Organization name must be between 3 and 255 characters",
          },
        },
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          is: {
            args: /^[a-z0-9]+(?:-[a-z0-9]+)*$/i,
            msg: "Organization slug must contain only letters, numbers, and hyphens",
          },
          len: {
            args: [3, 64],
            msg: "Organization slug must be between 3 and 64 characters",
          },
        },
      },
      plan: {
        type: DataTypes.ENUM(["STARTER", "PRO", "ENTERPRISE"]),
        defaultValue: "STARTER",
      },
      status: {
        type: DataTypes.ENUM(["ACTIVE", "SUSPENDED", "CANCELLED"]),
        defaultValue: "ACTIVE",
      },
      maxUsers: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
      },
    },
    {
      sequelize,
      modelName: "organization",
    }
  );

  return organization;
};
