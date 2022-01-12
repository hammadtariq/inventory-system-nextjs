"use strict";

module.exports = {
  up: async (queryInterface) => {
    const companies = await queryInterface.sequelize.query(`SELECT id from companies;`);
    const companiesRows = companies[0];
    await queryInterface.bulkInsert(
      "inventories",
      [
        {
          companyId: `${companiesRows[1].id}`,
          ratePerLbs: 50,
          ratePerKgs: null,
          ratePerBale: 5,
          noOfBales: 60,
          itemName: "testing first inventory",
          baleWeightLbs: 3,
          baleWeightKgs: null,
          onHand: 60,
          uuid: "5f6c7239-d826-4e9e-98ed-4477253bce10",
          createdAt: "2021-12-28T11:04:26.142Z",
          updatedAt: "2021-12-28T11:04:55.070Z",
        },
        {
          companyId: `${companiesRows[0].id}`,
          ratePerLbs: null,
          ratePerKgs: 900,
          ratePerBale: 80,
          noOfBales: 50,
          itemName: "inventory product",
          baleWeightLbs: null,
          baleWeightKgs: 50,
          onHand: 50,
          uuid: "590c7239-d826-4e9e-98ed-4477253bce10",
          createdAt: "2021-12-29T12:04:26.142Z",
          updatedAt: "2021-12-29T12:04:55.070Z",
        },
        {
          companyId: `${companiesRows[1].id}`,
          ratePerKgs: 250,
          ratePerBale: 25,
          ratePerLbs: null,
          noOfBales: 20,
          itemName: "inventory test",
          baleWeightLbs: null,
          baleWeightKgs: 5,
          onHand: 20,
          uuid: "590c7255-d826-4e9e-98ed-4477253bce10",
          createdAt: "2021-12-30T12:04:26.142Z",
          updatedAt: "2021-12-30T12:04:55.070Z",
        },
      ],
      {}
    );
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("inventories", null, {});
  },
};
