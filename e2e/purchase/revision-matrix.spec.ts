import { test, expect, tr } from "../fixtures";
import * as po from "../support/purchase-api";

type Row = {
  name: string;
  /** Lines of the approved purchase, and of the correction. x and y are fresh items priced 10 kg × Rs 10/kg. */
  before: (x: po.Item, y: po.Item) => { lines: po.Line[]; surCharge?: number };
  after: (x: po.Item, y: po.Item) => { lines: po.Line[]; surCharge?: number };
  stockChange: { x: number; y: number };
  entry: number;
  balanceChange: number;
};

const kg = (item: po.Item, bales: number, perKg = 10, weight = 10) => po.line(item, bales, { kg: weight, perKg });

const rows: Row[] = [
  {
    name: "rate only",
    before: (x) => ({ lines: [kg(x, 5)] }),
    after: (x) => ({ lines: [kg(x, 5, 12)] }),
    stockChange: { x: 0, y: 0 },
    entry: 600,
    balanceChange: 100,
  },
  {
    name: "surcharge only",
    before: (x) => ({ lines: [kg(x, 5)], surCharge: 0 }),
    after: (x) => ({ lines: [kg(x, 5)], surCharge: 50 }),
    stockChange: { x: 0, y: 0 },
    entry: 550,
    balanceChange: 50,
  },
  {
    name: "weight only",
    before: (x) => ({ lines: [kg(x, 5)] }),
    after: (x) => ({ lines: [kg(x, 5, 10, 12)] }),
    stockChange: { x: 0, y: 0 },
    entry: 600,
    balanceChange: 100,
  },
  {
    name: "item added",
    before: (x) => ({ lines: [kg(x, 5)] }),
    after: (x, y) => ({ lines: [kg(x, 5), kg(y, 4)] }),
    stockChange: { x: 0, y: 4 },
    entry: 900,
    balanceChange: 400,
  },
  {
    name: "item removed",
    before: (x, y) => ({ lines: [kg(x, 5), kg(y, 4)] }),
    after: (x) => ({ lines: [kg(x, 5)] }),
    stockChange: { x: 0, y: -4 },
    entry: 500,
    balanceChange: -400,
  },
  {
    name: "lines reordered",
    before: (x, y) => ({ lines: [kg(x, 5), kg(y, 4)] }),
    after: (x, y) => ({ lines: [kg(y, 4), kg(x, 5)] }),
    stockChange: { x: 0, y: 0 },
    entry: 900,
    balanceChange: 0,
  },
];

test(
  "Every kind of correction moves stock and ledger by exactly what changed",
  { annotation: tr("C35"), tag: "@smoke" },
  async ({ request }) => {
    // An own supplier: parallel tests post to the seeded ones and would move its balance.
    const garments = (await po.newSupplier(request, "c35-supplier")).id;

    for (const row of rows) {
      await test.step(row.name, async () => {
        const x = await po.createItem(request, garments, "BIG_BALES", { tag: "c35x", ratePerKgs: 10 });
        const y = await po.createItem(request, garments, "BIG_BALES", { tag: "c35y", ratePerKgs: 10 });
        const before = row.before(x, y);
        const p = await po.createPurchase(request, {
          companyId: garments,
          baleType: "BIG_BALES",
          lines: before.lines,
          surCharge: before.surCharge ?? null,
        });
        await po.approveOk(request, p.id);
        const stockX = (await po.stockOf(request, x.id)) ?? 0;
        const stockY = (await po.stockOf(request, y.id)) ?? 0;
        const ledgerBefore = await po.ledger(request, garments);

        const change = row.after(x, y);
        await po.revise(request, await po.getPurchase(request, p.id), change.lines, change.surCharge ?? 0);
        await po.approveOk(request, p.id);

        expect.soft(await po.stockOf(request, x.id), `${row.name}: stock of x`).toBe(stockX + row.stockChange.x);
        expect.soft((await po.stockOf(request, y.id)) ?? 0, `${row.name}: stock of y`).toBe(stockY + row.stockChange.y);
        const after = await po.ledger(request, garments);
        expect.soft(after.entries, `${row.name}: no new ledger entry`).toBe(ledgerBefore.entries);
        expect
          .soft(
            po.entriesFor(after.rows, p.id).map((e) => e.amount),
            `${row.name}: entry adjusted`
          )
          .toEqual([row.entry]);
        expect.soft(after.balance, `${row.name}: balance`).toBeCloseTo(ledgerBefore.balance + row.balanceChange, 2);
      });
    }
  }
);
