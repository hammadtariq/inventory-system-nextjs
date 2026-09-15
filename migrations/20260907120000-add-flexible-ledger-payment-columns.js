"use strict";

const NEW_COLUMNS = {
  payToCompanyId: { type: "INTEGER", allowNull: true },
  payToCustomerId: { type: "INTEGER", allowNull: true },
  payByCompanyId: { type: "INTEGER", allowNull: true },
  payByCustomerId: { type: "INTEGER", allowNull: true },
  payToTotal: { type: "FLOAT", allowNull: true },
  payByTotal: { type: "FLOAT", allowNull: true },
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable("ledgers");

    for (const [column, { type, allowNull }] of Object.entries(NEW_COLUMNS)) {
      if (!table[column]) {
        await queryInterface.addColumn("ledgers", column, {
          type: Sequelize[type],
          allowNull,
        });
      }
    }
  },

  down: async (queryInterface) => {
    for (const column of Object.keys(NEW_COLUMNS)) {
      await queryInterface.removeColumn("ledgers", column);
    }
  },
};
