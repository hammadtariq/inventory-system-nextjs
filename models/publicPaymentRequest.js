"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class publicPaymentRequest extends Model {
    static associate() {}
  }

  publicPaymentRequest.init(
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      packageSlug: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      packageName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amountLabel: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      businessName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contactName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      referenceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      senderAccountNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amountPaid: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      paidAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      proofImage: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
      },
      proofFileName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      proofMimeType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(["PENDING", "APPROVED", "REJECTED"]),
        allowNull: false,
        defaultValue: "PENDING",
      },
      adminNote: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      reviewedByUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "publicPaymentRequest",
    }
  );

  return publicPaymentRequest;
};
