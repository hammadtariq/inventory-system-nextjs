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
          paidAmount: 80,
          purchasedProducts: JSON.stringify([
            {
              bundleCost: 50,
              bundleCount: 60,
              productName: "testing first inventory",
              bundleWeight: 3,
              productLabel: "label 1",
            },
            {
              bundleCost: 500,
              bundleCount: 12,
              productName: "testing secound inventory",
              bundleWeight: 50,
              productLabel: "label 2",
            },
          ]),
          uuid: "1e419d06-3d9c-3374-a182-ef44cd4416d1",
          createdAt: "2021-12-28T11:04:30.162Z",
          updatedAt: "2021-12-28T11:04:46.162Z",
        },
        {
          companyId: `${companiesRows[0].id}`,
          totalAmount: 500,
          paidAmount: 450,
          purchasedProducts: JSON.stringify([
            {
              bundleCost: 250,
              bundleCount: 20,
              productName: "inventory product",
              bundleWeight: 5,
              productLabel: "test label",
            },
            {
              bundleCost: 400,
              bundleCount: 38,
              productName: "test inventory",
              bundleWeight: 10,
              productLabel: "label 2",
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
