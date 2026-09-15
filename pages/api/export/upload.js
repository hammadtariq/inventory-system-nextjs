import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";
import { getAppOrigin } from "@/lib/org-onboarding";

const apiSchema = Joi.object({
  fileBase64: Joi.string().required(),
  fileName: Joi.string().trim().min(1).max(120).required(),
  fileExtension: Joi.string().valid("pdf").required(),
});

const CONTENT_TYPES = {
  pdf: "application/pdf",
};

export const uploadExportedFile = async (req, res) => {
  const { error, value } = apiSchema.validate(req.body);
  if (error) {
    return res.status(400).send({ message: error.toString() });
  }

  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();

    const record = await db.ExportedFile.create({
      organizationId,
      fileName: value.fileName,
      fileExtension: value.fileExtension,
      contentType: CONTENT_TYPES[value.fileExtension],
      data: value.fileBase64,
    });

    const url = `${getAppOrigin(req)}/api/export/file/${record.uuid}`;
    return res.status(201).send({ url });
  } catch (error) {
    console.log("Upload exported file error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

const handler = nextConnect().use(auth).post(uploadExportedFile);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default handler;
