"use strict";
const { Model } = require("sequelize");
const { createHash } = require("@/lib/bcrypt");

module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    static associate(models) {
      // define association here
    }
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
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isLowercase: { msg: "Last name must lowercase" },
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
  user.beforeCreate(async (user, _) => {
    const hashPassword = await createHash(user.password);
    user.password = hashPassword;
  });

  user.beforeUpdate(async (user, _) => {
    const hashPassword = await createHash(user.password);
    user.password = hashPassword;
  });

  return user;
};
