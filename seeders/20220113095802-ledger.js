"use strict";

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert(
      "ledgers",
      [
        {
          companyId: 1,
          spendType: "CREDIT",
          amount: 2500,
          invoiceNumber: 223,
          createdAt: "2021-12-28T11:04:30.162Z",
          updatedAt: "2021-12-28T11:04:46.162Z",
        },
        {
          companyId: 2,
          customerId: 3,
          spendType: "DEBIT",
          paymentType: "ONLINE",
          paymentDate: "2022-01-12 00:00:00+00",
          amount: 1000,
          customerTotal: 100,
          companyTotal: 100,
          createdAt: "2021-12-28T11:04:30.162Z",
          updatedAt: "2021-12-28T11:04:46.162Z",
        },
        {
          customerId: 3,
          spendType: "DEBIT",
          paymentType: "CASH",
          paymentDate: "2022-01-12 00:00:00+00",
          amount: 3000,
          customerTotal: 100,
          companyTotal: 100,
          otherName: "P&G",
          createdAt: "2021-12-28T11:04:30.162Z",
          updatedAt: "2021-12-28T11:04:46.162Z",
        },
      ],
      {}
    );
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("ledgers", null, {});
  },
};
