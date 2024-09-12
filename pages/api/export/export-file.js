import { exportToPDF, exportToCSV } from "@/lib/export-utils";

export const exportHandler = async (fileInfo) => {
  const { fileName, type, data, headData } = fileInfo;
  try {
    let buffer;
    let contentType;

    switch (type) {
      case "pdf":
        buffer = exportToPDF(data, headData);
        contentType = "application/pdf";
        break;
      case "csv":
        buffer = exportToCSV(data);
        contentType = "text/csv";
        break;
      default:
        throw new Error("Invalid export type");
    }

    const headers = {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
    };
    return { headers, fileBlob: Buffer.from(buffer) };
  } catch (error) {
    throw new Error(error.message);
  }
};
