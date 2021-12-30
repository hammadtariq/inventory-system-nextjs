"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "inventories",
      [
        {
          bundleCost: 50,
          bundleCount: 60,
          productName: "testing first inventory",
          bundleWeight: 3,
          productLabel: "label 1",
          onHand: 60,
          uuid: "5f6c7239-d826-4e9e-98ed-4477253bce10",
          createdAt: "2021-12-28T11:04:26.142Z",
          updatedAt: "2021-12-28T11:04:55.070Z",
        },
        {
          bundleCost: 900,
          bundleCount: 50,
          productName: "testing secound inventory",
          bundleWeight: 50,
          onHand: 50,
          productLabel: "label 2",
          uuid: "590c7239-d826-4e9e-98ed-4477253bce10",
          createdAt: "2021-12-29T12:04:26.142Z",
          updatedAt: "2021-12-29T12:04:55.070Z",
        },
        {
          bundleCost: 250,
          bundleCount: 20,
          productName: "inventory product",
          bundleWeight: 5,
          productLabel: "test label",
          onHand: 20,
          uuid: "590c7255-d826-4e9e-98ed-4477253bce10",
          createdAt: "2021-12-30T12:04:26.142Z",
          updatedAt: "2021-12-30T12:04:55.070Z",
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("inventories", null, {});
  },
};
