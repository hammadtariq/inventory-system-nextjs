"use strict";

module.exports = {
  up: async (queryInterface) => {
    const companies = await queryInterface.sequelize.query(`SELECT id from companies;`);
    const companiesRows = companies[0];
    await queryInterface.bulkInsert(
      "inventories",
      [
        {
          companyId: `${companiesRows[0].id}`,
          itemName: "perfume",
          noOfBales: 5,
          baleWeightLbs: null,
          baleWeightKgs: 50,
          ratePerLbs: null,
          ratePerKgs: 10,
          ratePerBale: null,
          onHand: 5,
          uuid: "d0510e9d-dcc6-44ae-8f36-dc62060e6446",
          createdAt: "2022-02-17T16:00:26.025Z",
          updatedAt: "2022-02-17T16:00:26.025Z",
        },
        {
          companyId: `${companiesRows[1].id}`,
          itemName: "beg",
          noOfBales: 2,
          baleWeightLbs: 50,
          baleWeightKgs: null,
          ratePerLbs: 50,
          ratePerKgs: null,
          ratePerBale: 10,
          onHand: 2,
          uuid: "7b625b16-c23e-4ee7-9414-dad9444c77b6",
          createdAt: "2022-02-17T15:59:04.890Z",
          updatedAt: "2022-02-17T15:59:04.890Z",
        },
        {
          companyId: `${companiesRows[1].id}`,
          itemName: "testing first inventory",
          noOfBales: 2,
          baleWeightLbs: null,
          baleWeightKgs: 50,
          ratePerLbs: null,
          ratePerKgs: 50,
          ratePerBale: null,
          onHand: 30,
          uuid: "7b625b16-c23e-4ee7-9414-dad9444c7788",
          createdAt: "2022-02-17T15:59:04.890Z",
          updatedAt: "2022-02-17T15:59:04.890Z",
        },
      ],
      {}
    );
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("inventories", null, {});
  },
};
