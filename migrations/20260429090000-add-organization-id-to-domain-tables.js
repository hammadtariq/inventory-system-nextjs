"use strict";

const TABLES = [
  "customers",
  "companies",
  "inventories",
  "purchases",
  "purchase_histories",
  "sales",
  "saleReturns",
  "items",
  "ledgers",
  "cheques",
];

async function columnExists(queryInterface, tableName, columnName) {
  const table = await queryInterface.describeTable(tableName);
  return Boolean(table[columnName]);
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (const table of TABLES) {
      if (await columnExists(queryInterface, table, "organizationId")) continue;

      await queryInterface.addColumn(table, "organizationId", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "organizations",
          key: "id",
        },
      });
    }
  },

  down: async (queryInterface) => {
    for (const table of [...TABLES].reverse()) {
      if (!(await columnExists(queryInterface, table, "organizationId"))) continue;

      await queryInterface.removeColumn(table, "organizationId");
    }
  },
};
