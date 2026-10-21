import { test, expect, tr } from "../fixtures";
import * as po from "../support/purchase-api";

// Fields of a purchase that an invalid request must leave untouched.
const snapshot = (p: po.Purchase) => ({
  companyId: p.companyId,
  baleType: p.baleType,
  status: p.status,
  totalAmount: Number(p.totalAmount),
  surCharge: p.surCharge,
  invoiceNumber: p.invoiceNumber,
  purchaseDate: p.purchaseDate,
  purchasedProducts: p.purchasedProducts,
});

test(
  "The API rejects an incomplete purchase or another supplier's item on create, and saves nothing",
  { annotation: tr("C11"), tag: "@smoke" },
  async ({ request }) => {
    const garments = await po.companyId(request, "Ironwood Garments");
    const wholesale = await po.companyId(request, "Ironwood Wholesale");
    const own = await po.seededItem(request, garments, "BIG_BALES", "handbags mixed");
    const foreign = await po.seededItem(request, wholesale, "BIG_BALES", "ladies cotton tops");
    const valid = po.purchaseBody({
      companyId: garments,
      baleType: "BIG_BALES",
      lines: [po.line(own, 2, { kg: 10, perKg: 5 })],
    });
    const notFound = "one or more purchased products were not found";

    const rows: { name: string; body: Record<string, unknown>; status: number; message: string | RegExp }[] = [
      ...(["companyId", "purchaseDate", "baleType", "purchasedProducts"] as const).map((field) => {
        const body: Record<string, unknown> = { ...valid, invoiceNumber: po.uid("c11") };
        delete body[field];
        return { name: `missing ${field}`, body, status: 400, message: new RegExp(`"${field}" is required`) };
      }),
      {
        name: "item doesn't exist",
        body: {
          ...valid,
          invoiceNumber: po.uid("c11"),
          purchasedProducts: [{ ...valid.purchasedProducts[0], id: 999999 }],
        },
        status: 404,
        message: notFound,
      },
      {
        name: "item of another company",
        body: {
          ...valid,
          invoiceNumber: po.uid("c11"),
          purchasedProducts: [po.line(foreign, 2, { kg: 10, perKg: 5 })],
        },
        status: 404,
        message: notFound,
      },
      {
        name: "own item plus another company's item",
        body: {
          ...valid,
          invoiceNumber: po.uid("c11"),
          purchasedProducts: [po.line(own, 2, { kg: 10, perKg: 5 }), po.line(foreign, 1, { kg: 10, perKg: 5 })],
        },
        status: 404,
        message: notFound,
      },
    ];

    for (const row of rows) {
      await test.step(row.name, async () => {
        const before = await po.purchaseCount(request);
        const res = await request.post("/api/purchase", { data: row.body });
        expect.soft(res.status(), row.name).toBe(row.status);
        expect.soft((await res.json()).message, row.name).toMatch(row.message);
        expect.soft(await po.purchaseCount(request), `${row.name}: nothing saved`).toBe(before);
      });
    }
  }
);

test(
  "The API rejects a malformed purchase on create and on edit",
  { annotation: tr("C48"), tag: "@smoke" },
  async ({ request }) => {
    test.fixme(
      !po.runKnownBugs,
      "Known bug #217 (D2, D8): the API accepts empty product lists, negative values, unpriced weight lines and edits missing required fields."
    );
    const garments = await po.companyId(request, "Ironwood Garments");
    const own = await po.seededItem(request, garments, "BIG_BALES", "handbags mixed");
    const goodLine = po.line(own, 2, { kg: 10, perKg: 5 });
    const p = await po.createPurchase(request, { companyId: garments, baleType: "BIG_BALES", lines: [goodLine] });
    const full = po.purchaseBody({
      companyId: garments,
      baleType: "BIG_BALES",
      lines: [goodLine],
      invoiceNumber: p.invoiceNumber,
      purchaseDate: new Date(p.purchaseDate),
    });

    const malformed: { name: string; change: Record<string, unknown>; status: number | "4xx" }[] = [
      { name: "empty product list", change: { purchasedProducts: [] }, status: "4xx" },
      { name: "negative noOfBales", change: { purchasedProducts: [{ ...goodLine, noOfBales: -1 }] }, status: 400 },
      {
        name: "negative baleWeightKgs",
        change: { purchasedProducts: [{ ...goodLine, baleWeightKgs: -10 }] },
        status: 400,
      },
      { name: "negative ratePerKgs", change: { purchasedProducts: [{ ...goodLine, ratePerKgs: -5 }] }, status: 400 },
      { name: "negative surCharge", change: { surCharge: -50 }, status: 400 },
      {
        name: "weight line without weight",
        change: { purchasedProducts: [{ ...goodLine, baleWeightKgs: null }] },
        status: "4xx",
      },
      {
        name: "weight line without rate",
        change: { purchasedProducts: [{ ...goodLine, ratePerKgs: null }] },
        status: "4xx",
      },
    ];
    const expectRejected = (status: number, expected: number | "4xx", name: string) =>
      expected === "4xx"
        ? expect.soft(status >= 400 && status < 500, `${name}: got ${status}`).toBe(true)
        : expect.soft(status, name).toBe(expected);

    for (const row of malformed) {
      await test.step(`${row.name} (create and edit)`, async () => {
        const count = await po.purchaseCount(request);
        const created = await request.post("/api/purchase", {
          data: { ...full, invoiceNumber: po.uid("c48"), ...row.change },
        });
        expectRejected(created.status(), row.status, `create, ${row.name}`);
        expect.soft(await po.purchaseCount(request), `create, ${row.name}: nothing saved`).toBe(count);

        const before = snapshot(await po.getPurchase(request, p.id));
        const edited = await po.editPurchase(request, p.id, { ...full, ...row.change });
        expectRejected(edited.status(), row.status, `edit, ${row.name}`);
        expect.soft(snapshot(await po.getPurchase(request, p.id)), `edit, ${row.name}: P unchanged`).toEqual(before);
      });
    }

    for (const field of ["companyId", "purchaseDate", "baleType", "purchasedProducts"]) {
      await test.step(`edit without required ${field}`, async () => {
        const before = snapshot(await po.getPurchase(request, p.id));
        const body: Record<string, unknown> = { ...full, surCharge: 7 };
        delete body[field];
        const res = await po.editPurchase(request, p.id, body);
        expect.soft(res.status(), `edit without ${field}`).toBe(400);
        expect
          .soft((await res.json()).message ?? "", `edit without ${field}`)
          .toMatch(new RegExp(`"${field}" is required`));
        expect
          .soft(snapshot(await po.getPurchase(request, p.id)), `edit without ${field}: P unchanged`)
          .toEqual(before);
      });
    }

    await test.step("edit without the optional fields (control row)", async () => {
      const body: Record<string, unknown> = {
        ...full,
        purchasedProducts: [{ ...goodLine, noOfBales: 3 }],
        totalAmount: 150,
      };
      delete body.invoiceNumber;
      delete body.surCharge;
      const res = await po.editPurchase(request, p.id, body);
      expect(res.status()).toBe(200);
      const saved = await po.getPurchase(request, p.id);
      expect(Number(saved.totalAmount)).toBe(150);
      expect(saved.purchasedProducts[0].noOfBales).toBe(3);
    });
  }
);
