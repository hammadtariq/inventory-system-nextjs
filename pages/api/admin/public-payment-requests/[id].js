import nextConnect from "next-connect";
import Joi from "joi";

import db from "@/lib/postgres";
import { sendPaymentConfirmedEmail } from "@/lib/invite-email";
import { auth } from "@/middlewares/auth";

const apiSchema = Joi.object({
  status: Joi.string().valid("APPROVED", "REJECTED").required(),
  adminNote: Joi.string().trim().max(4000).allow("", null),
});

const requireAdmin = (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    res.status(403).send({ message: "Operation not permitted." });
    return false;
  }
  return true;
};

export const reviewPublicPaymentRequest = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  try {
    await db.dbConnect();
    const request = await db.PublicPaymentRequest.findByPk(req.query.id);
    if (!request) {
      return res.status(404).send({ message: "Payment request not found" });
    }

    if (request.status !== "PENDING") {
      return res.status(409).send({ message: "Payment request has already been reviewed" });
    }

    await request.update({
      status: value.status,
      adminNote: value.adminNote,
      reviewedAt: new Date(),
      reviewedByUserId: req.user.id,
    });

    if (value.status === "APPROVED") {
      try {
        await sendPaymentConfirmedEmail({
          to: request.email,
          businessName: request.businessName,
          packageName: request.packageName,
        });
      } catch (emailError) {
        console.error("Send payment confirmation email error:", emailError);
      }
    }

    return res.send({
      success: true,
      message:
        value.status === "APPROVED"
          ? "Payment confirmed. Create the customer account and send onboarding credentials."
          : "Payment request rejected.",
      request,
    });
  } catch (error) {
    console.log("Review public payment request error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).put(reviewPublicPaymentRequest);
