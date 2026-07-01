import Joi from "joi";
import nextConnect from "next-connect";
import sharp from "sharp";

import db from "@/lib/postgres";
import { getPublicPaymentPackage } from "@/lib/public-payment-packages";

const SUBMISSION_WINDOW_MS = 60 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 5;

const IMAGE_FORMAT_BY_MIME = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpeg",
  "image/webp": "webp",
};

const apiSchema = Joi.object({
  packageSlug: Joi.string().valid("monthly", "quarterly", "annual").required(),
  businessName: Joi.string().trim().min(2).max(255).required(),
  contactName: Joi.string().trim().min(2).max(255).required(),
  email: Joi.string().email().trim().lowercase().required(),
  phone: Joi.string().trim().max(32).allow("", null),
  referenceNumber: Joi.string().trim().min(2).max(255).required(),
  senderAccountNumber: Joi.string().trim().min(2).max(255).required(),
  amountPaid: Joi.number().positive().required(),
  paidAt: Joi.date().iso().max("now").required(),
  proofImage: Joi.string()
    .pattern(/^data:image\/(png|jpe?g|webp);base64,/)
    .max(6_500_000)
    .required(),
  proofFileName: Joi.string().trim().max(255).allow("", null),
  proofMimeType: Joi.string().valid("image/png", "image/jpeg", "image/jpg", "image/webp").allow("", null),
  note: Joi.string().trim().max(2000).allow("", null),
});

export const createPublicPaymentRequest = async (req, res) => {
  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  try {
    await db.dbConnect();

    const recentSubmissions = await db.PublicPaymentRequest.count({
      where: {
        email: value.email,
        createdAt: { [db.Sequelize.Op.gte]: new Date(Date.now() - SUBMISSION_WINDOW_MS) },
      },
    });
    if (recentSubmissions >= MAX_SUBMISSIONS_PER_WINDOW) {
      return res.status(429).send({ message: "Too many submissions. Please try again later." });
    }

    const [, base64Data] = value.proofImage.split(",");
    const imageBuffer = Buffer.from(base64Data, "base64");
    let detectedFormat;
    try {
      const metadata = await sharp(imageBuffer).metadata();
      detectedFormat = metadata.format;
    } catch (decodeError) {
      return res.status(400).send({ message: "Uploaded file is not a valid image." });
    }

    const declaredFormat = IMAGE_FORMAT_BY_MIME[value.proofMimeType];
    if (declaredFormat && detectedFormat !== declaredFormat) {
      return res.status(400).send({ message: "Uploaded image does not match its declared type." });
    }

    const selectedPackage = getPublicPaymentPackage(value.packageSlug);
    const request = await db.PublicPaymentRequest.create({
      packageSlug: value.packageSlug,
      packageName: selectedPackage.name,
      amountLabel: `${selectedPackage.price}${selectedPackage.period}`,
      businessName: value.businessName,
      contactName: value.contactName,
      email: value.email,
      phone: value.phone,
      referenceNumber: value.referenceNumber,
      senderAccountNumber: value.senderAccountNumber,
      amountPaid: value.amountPaid,
      paidAt: value.paidAt,
      proofImage: value.proofImage,
      proofFileName: value.proofFileName,
      proofMimeType: value.proofMimeType,
      note: value.note,
      status: "PENDING",
    });

    return res.status(201).send({
      success: true,
      message: "Payment proof submitted. We will verify your payment and send onboarding credentials by email.",
      request: {
        id: request.id,
        uuid: request.uuid,
        status: request.status,
      },
    });
  } catch (error) {
    console.error("Create public payment request error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "8mb",
    },
  },
};

export default nextConnect().post(createPublicPaymentRequest);
