import nextConnect from "next-connect";

import db from "@/lib/postgres";

// Public by design: this is the link shared via WhatsApp, opened by whoever
// receives it, with no login. Access control is the unguessable uuid, not auth.
export const getExportedFile = async (req, res) => {
  try {
    await db.dbConnect();
    const { uuid } = req.query;

    const record = await db.ExportedFile.findOne({ where: { uuid } });
    if (!record) {
      return res.status(404).send({ message: "File not found" });
    }

    const buffer = Buffer.from(record.data, "base64");
    res.setHeader("Content-Type", record.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${record.fileName}.${record.fileExtension}"`);
    return res.status(200).send(buffer);
  } catch (error) {
    console.log("Get exported file error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().get(getExportedFile);
