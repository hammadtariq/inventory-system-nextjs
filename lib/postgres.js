import Sequelize from "sequelize";

// import models
import User from "../models/user";
import Customer from "../models/customer";

// to select env (development | test | production) for db config
const env = process.env.NODE_ENV || "development";

// import db config
const config = require("../config/config.js")[env];

// sequelize instance
const sequelize = new Sequelize(
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
    await db.sequelize.authenticate();
    console.log("🚀 Database connected successfully");
  } catch (error) {
    console.log(error);
  }
};

// models
db.User = User(sequelize, Sequelize);
db.Customer = Customer(sequelize, Sequelize);

// pass db object to models for associations
db.User.associate(db);
db.Customer.associate(db);

export default db;
