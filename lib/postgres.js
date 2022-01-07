import Sequelize from "sequelize";

// import models
import User from "@/models/user";
import Customer from "@/models/customer";
import Company from "@/models/company";
import Inventory from "@/models/inventory";
import Purchase from "@/models/purchase";
import Ledger from "@/models/ledger";

// to select env (development | test | production) for db config
const env = process.env.NODE_ENV || "development";

// import db config
const config = require("../config/config.js")[env];

// sequelize instance
const sequelize = new Sequelize(config.database, config.username, config.password, config);

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// db connection
db.dbConnect = async () => {
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
db.Company = Company(sequelize, Sequelize);
db.Inventory = Inventory(sequelize, Sequelize);
db.Purchase = Purchase(sequelize, Sequelize);
db.Ledger = Ledger(sequelize, Sequelize);

// pass db object to models for associations
db.User.associate(db);
db.Customer.associate(db);
db.Company.associate(db);
db.Inventory.associate(db);
db.Purchase.associate(db);
db.Ledger.associate(db);

export default db;
