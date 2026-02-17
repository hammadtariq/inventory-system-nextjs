"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = { tableName: "ledgers", schema: "public" };
    const columnName = "reference";

    const results = await queryInterface.sequelize.query(
      `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = :table 
          AND column_name = :column;
      `,
      {
        replacements: { table: table.tableName, column: columnName },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (results.length === 0) {
      await queryInterface.addColumn(table, columnName, {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const table = { tableName: "ledgers", schema: "public" };
    const columnName = "reference";

    const results = await queryInterface.sequelize.query(
      `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = :table 
          AND column_name = :column;
      `,
      {
        replacements: { table: table.tableName, column: columnName },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (results.length > 0) {
      await queryInterface.removeColumn(table, columnName);
    }
  },
};
