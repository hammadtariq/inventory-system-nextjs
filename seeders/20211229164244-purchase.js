"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const companies = await queryInterface.sequelize.query(`SELECT id from companies;`);
    const companiesRows = companies[0];
    await queryInterface.bulkInsert(
      "purchases",
      [
        {
          companyId: `${companiesRows[0].id}`,
          totalAmount: 100,
          purchasedProducts: JSON.stringify([
            {
              ratePerLbs: 50,
              ratePerKgs: null,
              ratePerBale: 5,
              noOfBales: 60,
              itemName: "testing first inventory",
              baleWeightLbs: 3,
              baleWeightKgs: null,
            },
            {
              ratePerLbs: null,
              ratePerKgs: 900,
              ratePerKgs: 80,
              noOfBales: 50,
              itemName: "inventory product",
              baleWeightLbs: null,
              baleWeightKgs: 50,
            },
          ]),
          uuid: "1e419d06-3d9c-3374-a182-ef44cd4416d1",
          createdAt: "2021-12-28T11:04:30.162Z",
          updatedAt: "2021-12-28T11:04:46.162Z",
        },
        {
          companyId: `${companiesRows[1].id}`,
          totalAmount: 500,
          purchasedProducts: JSON.stringify([
            {
              ratePerKgs: 250,
              ratePerBale: 25,
              ratePerLbs: null,
              noOfBales: 20,
              itemName: "inventory product",
              baleWeightLbs: null,
              baleWeightKgs: 5,
            },
            {
              ratePerLbs: 50,
              ratePerKgs: null,
              ratePerBale: 5,
              noOfBales: 60,
              itemName: "testing first inventory",
              baleWeightLbs: 3,
              baleWeightKgs: null,
            },
          ]),
          uuid: "1e419d06-3d9c-2274-a182-ef44cd4416d1",
          createdAt: "2021-12-29T11:04:26.162Z",
          updatedAt: "2021-12-30T11:04:26.162Z",
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("purchases", null, {});
    await queryInterface.bulkDelete("companies", null, {});
  },
};
