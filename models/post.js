"use strict";
const { Model } = require("sequelize");

const { sequelize } = require("../lib/dbConnect");
const { DataTypes } = require("sequelize");

const Post = (sequelize, DataTypes) => {
  class post extends Model {
    static associate(models) {
      // define association here
    }
  }
  post.init(
    {
      title: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "post",
    }
  );
  return post;
};

export default Post(sequelize, DataTypes);
