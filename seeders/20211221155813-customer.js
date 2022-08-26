"use strict";

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert(
      "customers",
      [
        {
          firstName: "test",
          lastName: "customer",
          email: "test@gmail.com",
          uuid: "15eaa40e-a441-486e-a119-1e006bb5f7b0",
          phone: "11122211122",
          address: "test address for a customer 1",
          createdAt: "2021-12-16T12:56:05.643Z",
          updatedAt: "2021-12-16T12:56:05.643Z",
        },
        {
          firstName: "test1",
          lastName: "customer 1",
          email: "test1@gmail.com",
          uuid: "1d257a5e-76c0-4245-b48c-37096ee37334",
          phone: "22446688000",
          address: "test address for a customer 2",
          createdAt: "2021-12-20T09:09:31.070Z",
          updatedAt: "2021-12-20T09:09:31.070Z",
        },
        {
          firstName: "test2",
          lastName: "customer 2",
          email: "test2@gmail.com",
          uuid: "75fa9d26-f6e0-4ce8-a587-0e35593cccfc",
          phone: "113355779999",
          address: "test address for a customer 3",
          createdAt: "2021-12-20T09:10:48.381Z",
          updatedAt: "2021-12-20T09:10:48.381Z",
        },
      ],
      {}
    );
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("customers", null, {});
  },
};
