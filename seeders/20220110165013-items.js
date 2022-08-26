"use strict";

module.exports = {
  up: async (queryInterface) => {
    const companies = await queryInterface.sequelize.query(`SELECT id from companies;`);
    const companiesRows = companies[0];
    await queryInterface.bulkInsert(
      "items",
      [
        {
          companyId: `${companiesRows[0].id}`,
          itemName: "perfume",
          ratePerLbs: null,
          ratePerKgs: 50,
          ratePerBale: null,
          type: "BIG_BALES",
          uuid: "981290f3-212b-4153-9e0f-88eea5b7693c",
          createdAt: "2022-02-17T15:57:02.082Z",
          updatedAt: "2022-02-17T15:57:02.082Z",
        },
        {
          companyId: `${companiesRows[0].id}`,
          itemName: "testing first inventory",
          ratePerLbs: null,
          ratePerKgs: 30,
          ratePerBale: null,
          type: "BIG_BALES",
          uuid: "1e419d06-3d9c-3374-a182-ef44cd4416a1",
          createdAt: "2021-12-28T11:04:30.162Z",
          updatedAt: "2021-12-28T11:04:46.162Z",
        },
        {
          companyId: `${companiesRows[1].id}`,
          itemName: "beg",
          ratePerLbs: 30,
          ratePerKgs: null,
          ratePerBale: 10,
          type: "SMALL_BALES",
          uuid: "889e0f5b-46b0-4e3c-a2af-d4ec0bcba381",
          createdAt: "2022-02-17T15:56:08.563Z",
          updatedAt: "2022-02-17T15:56:08.563Z",
        },
      ],
      {}
    );
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("items", null, {});
    await queryInterface.bulkDelete("companies", null, {});
  },
};
