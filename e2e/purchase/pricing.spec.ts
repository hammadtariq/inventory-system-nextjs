import { test, expect, tr } from "../fixtures";
import { antSelect } from "../support/antd";
import * as po from "../support/purchase-api";

const I = po.FORM_INPUT;

type FormLine = {
  bales: number;
  kgs?: number;
  ratePerKgs?: number;
  lbs?: number;
  ratePerLbs?: number;
  ratePerBale?: number;
};
type Row = {
  name: string;
  type: po.BaleType;
  lines: FormLine[];
  surCharge: number;
  expected: number;
  knownBug?: string;
};

const rows: Row[] = [
  {
    name: "per bale",
    type: "SMALL_BALES",
    lines: [
      { bales: 3, ratePerBale: 10 },
      { bales: 2, ratePerBale: 20 },
    ],
    surCharge: 0,
    expected: 70,
  },
  {
    name: "kg",
    type: "BIG_BALES",
    lines: [{ bales: 3, kgs: 50, ratePerKgs: 100 }],
    surCharge: 0,
    expected: 15000,
    knownBug: "#222",
  },
  {
    name: "lb",
    type: "BIG_BALES",
    lines: [{ bales: 2, lbs: 100, ratePerLbs: 40 }],
    surCharge: 0,
    expected: 8000,
    knownBug: "#222",
  },
  {
    name: "mixed, decimals",
    type: "BIG_BALES",
    lines: [
      { bales: 4, kgs: 12.5, ratePerKgs: 10.4 },
      { bales: 2, lbs: 100, ratePerLbs: 40 },
    ],
    surCharge: 75,
    expected: 8595,
    knownBug: "#222",
  },
];

test(
  "Every pricing method gives the same total on screen, in the saved purchase and in the supplier ledger",
  { annotation: tr("C30"), tag: "@smoke" },
  async ({ page, request }) => {
    for (const row of rows) {
      await test.step(row.name, async () => {
        if (row.knownBug && !po.knownBug(row.knownBug, `${row.name} row: weight-priced line omits the bale count`))
          return;
        // Each row gets its own supplier: parallel tests post to the seeded ones and would move the balance.
        const { id: supplier, name: supplierName } = await po.newSupplier(request, "c30-supplier");
        const items = [];
        for (const _ of row.lines) items.push(await po.createItem(request, supplier, row.type, { tag: "c30" }));
        const invoice = po.uid("c30-inv");
        const before = await po.ledger(request, supplier);

        await page.goto("/purchase/create");
        await antSelect(page, "Company", supplierName);
        await antSelect(page, "List Type", row.type);
        await page.getByRole("button", { name: "Edit All" }).click();
        for (const [i, l] of row.lines.entries()) {
          const inputs = page.getByRole("row").filter({ hasText: items[i].itemName }).getByRole("spinbutton");
          await inputs.nth(I.bales).fill(String(l.bales));
          if (l.lbs !== undefined) await inputs.nth(I.lbs).fill(String(l.lbs));
          if (l.kgs !== undefined) await inputs.nth(I.kgs).fill(String(l.kgs));
          if (l.ratePerLbs !== undefined) await inputs.nth(I.ratePerLbs).fill(String(l.ratePerLbs));
          if (l.ratePerKgs !== undefined) await inputs.nth(I.ratePerKgs).fill(String(l.ratePerKgs));
          if (l.ratePerBale !== undefined) await inputs.nth(I.ratePerBale).fill(String(l.ratePerBale));
        }
        await page.getByRole("button", { name: "Save All" }).click();
        await page.getByLabel("Invoice No").fill(invoice);
        await page.getByLabel("Sur Charge (RS)").fill(String(row.surCharge));
        await expect
          .soft(page.getByLabel("Total Amount (RS)"), `${row.name}: on-screen total`)
          .toHaveValue(String(row.expected));

        await page.getByRole("button", { name: "Create Purchase" }).click();
        await expect(page).toHaveURL(/\/purchase$/);
        const saved = await po.findByInvoice(request, invoice);
        expect.soft(Number(saved.totalAmount), `${row.name}: saved total`).toBe(row.expected);

        await po.approveOk(request, saved.id);
        const after = await po.ledger(request, supplier);
        expect
          .soft(
            po.entriesFor(after.rows, saved.id).map((e) => e.amount),
            `${row.name}: ledger DEBIT`
          )
          .toEqual([row.expected]);
        expect.soft(after.balance, `${row.name}: supplier balance`).toBeCloseTo(before.balance + row.expected, 2);
      });
    }
  }
);
