"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const companies = await queryInterface.sequelize.query(`SELECT id from companies;`);
    const companiesRows = companies[0];
    await queryInterface.bulkInsert(
      "items",
      [
        {
          companyId: `${companiesRows[0].id}`,
          sNo: 1,
          itemName: "testing first inventory",
          ratePerKgs: 50,
          ratePerLbs: null,
          ratePerBale: null,
          type: "BIG_BALES",
          uuid: "1e419d06-3d9c-3374-a182-ef44cd4416a1",
          createdAt: "2021-12-28T11:04:30.162Z",
          updatedAt: "2021-12-28T11:04:46.162Z",
        },
        {
          companyId: `${companiesRows[0].id}`,
          sNo: 2,
          itemName: "test product",
          ratePerKgs: null,
          ratePerLbs: 50,
          ratePerBale: null,
          type: "BIG_BALES",
          uuid: "1e419d06-3d9c-3374-a182-ef44cd4416d1",
          createdAt: "2021-12-28T11:04:30.162Z",
          updatedAt: "2021-12-28T11:04:46.162Z",
        },
        {
          companyId: `${companiesRows[0].id}`,
          sNo: 3,
          itemName: "test item",
          ratePerKgs: null,
          ratePerLbs: 50,
          ratePerBale: 500,
          type: "SMALL_BALES",
          uuid: "1e419d06-3d9c-3374-a182-ef44cd441690",
          createdAt: "2021-12-28T11:04:30.162Z",
          updatedAt: "2021-12-28T11:04:46.162Z",
        },
        {
          companyId: `${companiesRows[1].id}`,
          sNo: 4,
          itemName: "test item",
          ratePerKgs: null,
          ratePerLbs: 50,
          ratePerBale: 500,
          type: "SMALL_BALES",
          uuid: "3d419d06-3d9c-3374-a182-ef44cd4416d1",
          createdAt: "2021-12-28T11:04:30.162Z",
          updatedAt: "2021-12-28T11:04:46.162Z",
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("items", null, {});
    await queryInterface.bulkDelete("companies", null, {});
  },
};
