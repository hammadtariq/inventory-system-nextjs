import { createMocks } from "node-mocks-http";

import db from "@/lib/postgres";
import { getExportedFile } from "@/pages/api/export/file/[uuid]";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  ExportedFile: {
    findOne: jest.fn(),
  },
}));

describe("GET /api/export/file/[uuid]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("streams the file back for a valid uuid, with no auth required", async () => {
    db.ExportedFile.findOne.mockResolvedValue({
      uuid: "11111111-1111-1111-1111-111111111111",
      fileName: "sale_report_123",
      fileExtension: "pdf",
      contentType: "application/pdf",
      data: Buffer.from("hello pdf").toString("base64"),
    });

    const { req, res } = createMocks({
      method: "GET",
      query: { uuid: "11111111-1111-1111-1111-111111111111" },
    });

    await getExportedFile(req, res);

    expect(db.ExportedFile.findOne).toHaveBeenCalledWith({
      where: { uuid: "11111111-1111-1111-1111-111111111111" },
    });
    expect(res._getStatusCode()).toBe(200);
    expect(res._getHeaders()["content-type"]).toBe("application/pdf");
    expect(res._getData().toString()).toBe("hello pdf");
  });

  it("returns 404 for an unknown uuid instead of leaking existence via other codes", async () => {
    db.ExportedFile.findOne.mockResolvedValue(null);

    const { req, res } = createMocks({
      method: "GET",
      query: { uuid: "00000000-0000-0000-0000-000000000000" },
    });

    await getExportedFile(req, res);

    expect(res._getStatusCode()).toBe(404);
  });
});
