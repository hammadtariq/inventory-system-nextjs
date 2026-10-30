import Sequelize from "sequelize";
import pg from "pg";

// import models
import User from "@/models/user";
import Customer from "@/models/customer";
import Company from "@/models/company";
import Inventory from "@/models/inventory";
import Purchase from "@/models/purchase";
import PurchaseHistory from "@/models/purchasing_history.js";
import Sale from "@/models/sale";
import SaleReturn from "@/models/saleReturn";
import Items from "@/models/items";
import Ledger from "@/models/ledger";
import Cheque from "@/models/cheque";
import Organization from "@/models/organization";
import PublicPaymentRequest from "@/models/publicPaymentRequest";
import ExportedFile from "@/models/exportedFile";
import { applyTenantWriteHooks, TENANT_MODELS } from "@/lib/tenant-write-hooks";
import TenantContext from "@/lib/tenant-context";

const sequelizeUseCLS = Sequelize.useCLS;
sequelizeUseCLS(TenantContext.namespace);

// to select env (development | test | production) for db config
const env = process.env.NODE_ENV || "development";

// import db config
const config = require("../config/config.js")[env];

// Vercel freezes a timed-out function without closing its connection, so its open transaction keeps its row
// locks and every retry of the same approval waits on them. Fail fast instead, and let Postgres end abandoned
// transactions. Set here rather than in config/config.js so migrations and scripts, which read that file
// directly, keep running without limits. Values in ms.
const APP_TIMEOUTS = {
  statement_timeout: 30000,
  lock_timeout: 10000,
  idle_in_transaction_session_timeout: 30000,
};

// sequelize instance
const sequelize = new Sequelize(config.database, config.username, config.password, {
  ...config,
  dialectOptions: { ...config.dialectOptions, ...APP_TIMEOUTS },
  dialectModule: pg,
});

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
db.Organization = Organization(sequelize, Sequelize);
db.PublicPaymentRequest = PublicPaymentRequest(sequelize, Sequelize);
db.ExportedFile = ExportedFile(sequelize, Sequelize);
db.Customer = Customer(sequelize, Sequelize);
db.Company = Company(sequelize, Sequelize);
db.Inventory = Inventory(sequelize, Sequelize);
db.Purchase = Purchase(sequelize, Sequelize);
db.PurchaseHistory = PurchaseHistory(sequelize, Sequelize);
db.Sale = Sale(sequelize, Sequelize);
db.SaleReturn = SaleReturn(sequelize, Sequelize);
db.Items = Items(sequelize, Sequelize);
db.Ledger = Ledger(sequelize, Sequelize);
db.Cheque = Cheque(sequelize, Sequelize);

// pass db object to models for associations
db.User.associate(db);
db.Organization.associate(db);
db.PublicPaymentRequest.associate(db);
db.ExportedFile.associate(db);
db.Customer.associate(db);
db.Company.associate(db);
db.Inventory.associate(db);
db.Purchase.associate(db);
db.PurchaseHistory.associate(db);
db.Sale.associate(db);
db.SaleReturn.associate(db);
db.Items.associate(db);
db.Ledger.associate(db);
db.Cheque.associate(db);

TENANT_MODELS.forEach((modelName) => {
  applyTenantWriteHooks(db[modelName]);
});

export default db;
