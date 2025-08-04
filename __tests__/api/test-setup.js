// test/test-setup.js
const { Sequelize, DataTypes, Model } = require("sequelize");
const inventoryModel = require("@/models/inventory"); // adjust path
const saleModel = require("@/models/sale"); // adjust path
const customerModel = require("@/models/customer"); // adjust path
const ledgerModel = require("@/models/ledger"); // adjust path

const sequelize = new Sequelize("sqlite::memory:", { logging: false });

class Company extends Model {} // ✅ mock valid Sequelize model
Company.init({}, { sequelize, modelName: "company" });

const Inventory = inventoryModel(sequelize, DataTypes);
const Sale = saleModel(sequelize, DataTypes);
const Customer = customerModel(sequelize, DataTypes);
const Ledger = ledgerModel(sequelize, DataTypes);

// ✅ Setup associations with mock Company model
if (typeof Inventory.associate === "function") {
  Inventory.associate({ Company });
}
if (typeof Sale.associate === "function") {
  Sale.associate({ Customer });
}
if (typeof Ledger.associate === "function") {
  Ledger.associate({ Customer, Company });
}
console.log("Associations set up successfully inventoryModel---> ", inventoryModel(sequelize, DataTypes));
module.exports = {
  sequelize,
  Inventory,
  Company,
  Customer,
  Sale,
  Ledger,
};
