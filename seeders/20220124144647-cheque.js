"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "cheques",
      [
        {
          chequeId: "123abbc",
          dueDate: "2021-12-28T11:04:30.162Z",
          status: "PENDING",
          createdAt: "2021-12-28T11:04:30.162Z",
          updatedAt: "2021-12-28T11:04:46.162Z",
        },
        {
          chequeId: "123ABCD",
          dueDate: "2022-1-10T11:04:30.162Z",
          status: "PENDING",
          createdAt: "2021-12-28T11:04:30.162Z",
          updatedAt: "2021-12-28T11:04:46.162Z",
        },
        {
          chequeId: "ABCD12333",
          dueDate: "2022-1-12T11:04:30.162Z",
          status: "PENDING",
          createdAt: "2021-12-28T11:04:30.162Z",
          updatedAt: "2021-12-28T11:04:46.162Z",
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
