import { createMocks } from "node-mocks-http";

import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
import { uploadExportedFile } from "@/pages/api/export/upload";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  ExportedFile: {
    create: jest.fn(),
  },
}));

describe("POST /api/export/upload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("stores the file scoped to the current tenant and returns a public file link", async () => {
    db.ExportedFile.create.mockResolvedValue({ uuid: "11111111-1111-1111-1111-111111111111" });

    const { req, res } = createMocks({
      method: "POST",
      body: { fileBase64: "JVBERi0xLjQK", fileName: "sale_report_123", fileExtension: "pdf" },
      headers: { host: "localhost:3000" },
    });

    await TenantContext.run(9, async () => uploadExportedFile(req, res));

    expect(db.ExportedFile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 9,
        fileName: "sale_report_123",
        fileExtension: "pdf",
        contentType: "application/pdf",
        data: "JVBERi0xLjQK",
      })
    );
    expect(res._getStatusCode()).toBe(201);
    expect(res._getData().url).toBe("http://localhost:3000/api/export/file/11111111-1111-1111-1111-111111111111");
  });

  it("rejects a request with no organization in context", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { fileBase64: "JVBERi0xLjQK", fileName: "sale_report_123", fileExtension: "pdf" },
      headers: { host: "localhost:3000" },
    });

    await uploadExportedFile(req, res);

    expect(db.ExportedFile.create).not.toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(500);
  });

  it("rejects an unsupported file extension", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { fileBase64: "JVBERi0xLjQK", fileName: "sale_report_123", fileExtension: "exe" },
      headers: { host: "localhost:3000" },
    });

    await TenantContext.run(9, async () => uploadExportedFile(req, res));

    expect(db.ExportedFile.create).not.toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(400);
  });
});
