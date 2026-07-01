"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("publicPaymentRequests", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      packageSlug: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      packageName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amountLabel: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      businessName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      contactName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      referenceNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      senderAccountNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amountPaid: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      paidAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      proofImage: {
        type: Sequelize.TEXT("long"),
        allowNull: false,
      },
      proofFileName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      proofMimeType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("PENDING", "APPROVED", "REJECTED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      adminNote: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      reviewedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      reviewedByUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex("publicPaymentRequests", ["status", "createdAt"], {
      name: "public_payment_requests_status_created_at",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("publicPaymentRequests");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_publicPaymentRequests_status";');
  },
};
