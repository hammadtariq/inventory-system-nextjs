"use strict";

module.exports = {
  up: async (queryInterface) => {
    const companies = await queryInterface.sequelize.query(`SELECT id from companies;`);
    const companiesRows = companies[0];
    await queryInterface.bulkInsert(
      "purchases",
      [
        {
          companyId: `${companiesRows[0].id}`,
          totalAmount: 100,
          surCharge: null,
          invoiceNumber: "12345",
          status: "PENDING",
          baleType: "SMALL_BALES",
          purchasedProducts: JSON.stringify([
            {
              ratePerLbs: 50,
              id: 1,
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
              id: 2,
              ratePerBale: 80,
              noOfBales: 50,
              itemName: "inventory product",
              baleWeightLbs: null,
              baleWeightKgs: 50,
            },
          ]),
          uuid: "1e419d06-3d9c-3374-a182-ef44cd4416d1",
          createdAt: "2021-12-28T11:04:30.162Z",
          purchaseDate: "2021-12-28T11:04:30.162Z",
          updatedAt: "2021-12-28T11:04:46.162Z",
        },
        {
          companyId: `${companiesRows[1].id}`,
          totalAmount: 500,
          surCharge: 50,
          invoiceNumber: "901",
          status: "APPROVED",
          baleType: "BIG_BALES",
          purchasedProducts: JSON.stringify([
            {
              ratePerKgs: 250,
              ratePerBale: 25,
              ratePerLbs: null,
              noOfBales: 20,
              id: 3,
              itemName: "inventory product",
              baleWeightLbs: null,
              baleWeightKgs: 5,
            },
            {
              ratePerLbs: 50,
              ratePerKgs: null,
              ratePerBale: 5,
              noOfBales: 60,
              id: 4,
              itemName: "testing first inventory",
              baleWeightLbs: 3,
              baleWeightKgs: null,
            },
          ]),
          uuid: "1e419d06-3d9c-2274-a182-ef44cd4416d1",
          createdAt: "2021-12-29T11:04:26.162Z",
          purchaseDate: "2021-12-29T11:04:26.162Z",
          updatedAt: "2021-12-30T11:04:26.162Z",
        },
        {
          companyId: `${companiesRows[0].id}`,
          totalAmount: 1500,
          surCharge: 0,
          invoiceNumber: "101",
          status: "CANCEL",
          baleType: "SMALL_BALES",
          purchasedProducts: JSON.stringify([
            {
              ratePerKgs: 50,
              ratePerBale: 5,
              ratePerLbs: null,
              noOfBales: 50,
              id: 5,
              itemName: "test item product",
              baleWeightLbs: null,
              baleWeightKgs: 5,
            },
            {
              ratePerLbs: 50,
              ratePerKgs: null,
              ratePerBale: 5,
              noOfBales: 60,
              id: 6,
              itemName: "testing first inventory",
              baleWeightLbs: 3,
              baleWeightKgs: null,
            },
          ]),
          uuid: "6e419d06-3d9c-2274-a182-ef44cd4416d1",
          createdAt: "2021-12-23T11:04:26.162Z",
          purchaseDate: "2021-12-20T11:04:26.162Z",
          updatedAt: "2021-12-31T11:04:26.162Z",
        },
      ],
      {}
    );
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("purchases", null, {});
    await queryInterface.bulkDelete("companies", null, {});
  },
};
