"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert("users", [
      {
        id: 1,
        uuid: "56c5d177-0a01-4fcd-aee8-bcd073b664ea",
        firstName: "hammad",
        lastName: "taqir",
        email: "htariq@nisum.com",
        role: "ADMIN",
        password: "$2b$10$Q5Jp968fHNz.svUPhYwYNux.gJ5gWSbcOwYg5l963ddvUqtFAXngK",
        createdAt: "2021-12-20T10:03:17.346Z",
        updatedAt: "2021-12-20T10:03:17.346Z",
      },
      {
        id: 2,
        uuid: "28646bb2-5531-4e98-8af6-d2ad68665d21",
        firstName: "muhammad",
        lastName: "osama",
        email: "muosama@nisum.com",
        role: "EDITOR",
        password: "$2b$10$kSuudGPsqDGBX2kCP739vO6c9Pl/KC/N7pRkoKvlRSGozYd52hfcq",
        createdAt: "2021-12-20T10:04:00.310Z",
        updatedAt: "2021-12-20T10:04:00.310Z",
      },
      {
        id: 3,
        uuid: "4be215df-43d3-4ac7-acd3-597ceb2ef5c2",
        firstName: "daniyal",
        lastName: "kukda",
        email: "dkukda@nisum.com",
        role: "EDITOR",
        password: "$2b$10$O0cOYaSGEDZdHvdWm2YhjuLqfbVFFOQGvOynES4HO4/DA79CHAkYi",
        createdAt: "2021-12-20T10:04:19.703Z",
        updatedAt: "2021-12-20T10:04:19.703Z",
      },
      {
        id: 4,
        uuid: "8f59ac18-0cb0-4c85-819e-1be407a8710e",
        firstName: "rehan",
        lastName: "yahya",
        email: "ryahya@nisum.com",
        role: "EDITOR",
        password: "$2b$10$XM3tMAOI1xi91Bm8F.hCE.EXMEldjWItarKWXEQZ0RD1jqiAtXSNq",
        createdAt: "2021-12-20T10:04:35.978Z",
        updatedAt: "2021-12-20T10:04:35.978Z",
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("users", null, {});
  },
};
