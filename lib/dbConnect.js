import Sequelize from "sequelize";
import User from "../models/user";

// to select config for development or production
const env = process.env.NODE_ENV || "development";

const config = require("../config/config.js")[env];

// sequelize instance
export const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// db connection
db.dbConnect = async (sequelize) => {
  try {
    await sequelize.authenticate();
    console.log("🚀 Database connected successfully");
  } catch (error) {
    console.log(error);
  }
};

// models

// associations

export default db;
