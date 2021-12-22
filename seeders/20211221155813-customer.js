"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "customers",
      [
        {
          firstName: "test",
          lastName: "customer",
          email: "test@gmail.com",
          role: "customer",
          uuid: "15eaa40e-a441-486e-a119-1e006bb5f7b0",
          createdAt: "2021-12-16T12:56:05.643Z",
          updatedAt: "2021-12-16T12:56:05.643Z",
        },
        {
          firstName: "test",
          lastName: "customer 1",
          email: "test1@gmail.com",
          role: "customer",
          uuid: "1d257a5e-76c0-4245-b48c-37096ee37334",
          createdAt: "2021-12-20T09:09:31.070Z",
          updatedAt: "2021-12-20T09:09:31.070Z",
        },
        {
          firstName: "test",
          lastName: "customer 2",
          email: "test1@gmail.com",
          role: "customer",
          uuid: "75fa9d26-f6e0-4ce8-a587-0e35593cccfc",
          createdAt: "2021-12-20T09:10:48.381Z",
          updatedAt: "2021-12-20T09:10:48.381Z",
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("customers", null, {});
  },
};
