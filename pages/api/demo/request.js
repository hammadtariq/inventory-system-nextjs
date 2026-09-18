import Joi from "joi";
import nextConnect from "next-connect";

import { sendDemoRequestEmails } from "@/lib/invite-email";

const SUBMISSION_WINDOW_MS = 60 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 5;
const submissionsByEmail = new Map();

const withinRateLimit = (email) => {
  const now = Date.now();
  const recent = (submissionsByEmail.get(email) || []).filter((timestamp) => now - timestamp < SUBMISSION_WINDOW_MS);
  if (recent.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    return false;
  }

  recent.push(now);
  submissionsByEmail.set(email, recent);
  return true;
};

const apiSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(255).required(),
  email: Joi.string().email().trim().lowercase().required(),
  companyName: Joi.string().trim().min(2).max(255).required(),
  teamSize: Joi.string().valid("1-10", "11-50", "51-200", "200+").required(),
});

export const createDemoRequest = async (req, res) => {
  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  if (!withinRateLimit(value.email)) {
    return res.status(429).send({ message: "Too many requests. Please try again later." });
  }

  try {
    await sendDemoRequestEmails(value);
    return res.status(201).send({
      success: true,
      message: "Demo request received. We'll reach out within 24 hours.",
    });
  } catch (error) {
    console.error("Create demo request error:", error);
    return res.status(500).send({ message: "Something went wrong. Please try again." });
  }
};

export default nextConnect().post(createDemoRequest);
