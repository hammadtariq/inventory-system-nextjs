"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "companies",
      [
        {
          companyName: "test company",
          email: "test@gmail.com",
          phone: "11122211122",
          address: "test address for a company",
          uuid: "15eaa40e-a441-486e-a119-1e006bb5f7b0",
          createdAt: "2021-12-16T12:56:05.643Z",
          updatedAt: "2021-12-16T12:56:05.643Z",
        },
        {
          companyName: "test company 1",
          email: "test1@company.com",
          phone: "11111111111111",
          address: "COMPANY ONE test Address",
          uuid: "1d257a5e-76c0-4245-b48c-37096ee37334",
          createdAt: "2021-12-20T09:09:31.070Z",
          updatedAt: "2021-12-20T09:09:31.070Z",
        },
        {
          companyName: "test company 2",
          email: "test2@company.com",
          phone: "1111111111222",
          address: "Test company 2 address",
          uuid: "75fa9d26-f6e0-4ce8-a587-0e35593cccfc",
          createdAt: "2021-12-20T09:10:48.381Z",
          updatedAt: "2021-12-20T09:10:48.381Z",
        },
        {
          companyName: "test company 3",
          email: "test3@company.com",
          phone: "55544433322",
          address: "test company 3 address",
          uuid: "d52f76d5-70bc-475c-a265-e4ed161eea68",
          createdAt: "2021-12-20T09:11:34.526Z",
          updatedAt: "2021-12-20T09:11:34.526Z",
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("companies", null, {});
  },
};
