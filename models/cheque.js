"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class cheque extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  cheque.init(
    {
      chequeId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dueDate: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      status: {
        allowNull: false,
        type: DataTypes.ENUM(["PENDING", "PASS", "RETURN", "CANCEL"]),
      },
    },
    {
      sequelize,
      modelName: "cheque",
    }
  );
  return cheque;
};
