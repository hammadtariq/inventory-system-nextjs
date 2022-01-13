"use strict";
const { Model } = require("sequelize");
const { createHash } = require("@/lib/bcrypt");

module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    static associate() {}
  }
  user.init(
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isLowercase: {
            msg: "First name must be lowercase",
          },
        },
        min: 3,
        max: 12,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isLowercase: { msg: "Last name must lowercase" },
        },
        min: 3,
        max: 12,
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
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: DataTypes.ENUM(["ADMIN", "EDITOR"]),
    },
    {
      sequelize,
      modelName: "user",
    }
  );

  // define hooks here
  user.beforeCreate(async (user) => {
    const hashPassword = await createHash(user.password);
    user.password = hashPassword;
  });

  user.beforeUpdate(async (user) => {
    if (user.password) {
      const hashPassword = await createHash(user.password);
      user.password = hashPassword;
    }
  });

  return user;
};
