import Sequelize from "sequelize";

// to select config for development or production
const env = process.env.NODE_ENV || "development";

const config = require("../config/config.js")[env];

export const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

const dbConnect = async () => {
  try {
    await sequelize.sync();
    console.log("🚀 Database connected successfully");
  } catch (error) {
    console.log(error);
  }
};

export default dbConnect;
