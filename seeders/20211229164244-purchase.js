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
          totalAmount: 2000,
          surCharge: null,
          invoiceNumber: 101,
          purchasedProducts: JSON.stringify([
            { id: 6, itemName: "perfume", noOfBales: 2, ratePerKgs: 50, ratePerBale: null },
          ]),
          status: "PENDING",
          baleType: "BIG_BALES",
          purchaseDate: "2022-02-17T16:00:31.396Z",
          uuid: "a4b38615-5c95-4a00-80d8-2fd32b287502",
          createdAt: "2022-02-17T16:00:51.538Z",
          updatedAt: "2022-02-17T16:00:51.538Z",
        },
        {
          companyId: `${companiesRows[0].id}`,
          totalAmount: 150,
          surCharge: 250,
          invoiceNumber: null,
          purchasedProducts: JSON.stringify([
            { id: 6, itemName: "perfume", noOfBales: 5, ratePerKgs: 50, ratePerBale: null },
          ]),
          status: "APPROVED",
          baleType: "BIG_BALES",
          purchaseDate: "2022-02-17T15:57:43.495Z",
          uuid: "9c1e2491-0339-458d-ab6e-7e2ce85360a1",
          createdAt: "2022-02-17T15:58:03.224Z",
          updatedAt: "2022-02-17T16:00:26.034Z",
        },
        {
          companyId: `${companiesRows[1].id}`,
          totalAmount: 100,
          surCharge: 100,
          invoiceNumber: 110001,
          purchasedProducts: JSON.stringify([
            { id: 5, itemName: "beg", noOfBales: 10, ratePerLbs: 50, ratePerBale: 10 },
          ]),
          status: "CANCEL",
          baleType: "SMALL_BALES",
          purchaseDate: "2022-02-17T15:57:11.864Z",
          uuid: "067a3f84-7402-434c-89ae-76fe4b168c8c",
          createdAt: "2022-02-17T15:57:40.964Z",
          updatedAt: "2022-02-17T16:00:16.873Z",
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
