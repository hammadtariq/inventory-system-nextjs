import { test, expect, tr } from "../fixtures";
import * as po from "../support/purchase-api";

const DAY = 24 * 60 * 60 * 1000;

/** Supplier statement in date order (owner decision 2026-10-21), entry order within a timestamp. */
const statement = (rows: po.LedgerRow[]) =>
  [...rows].sort((a, b) => +new Date(a.paymentDate) - +new Date(b.paymentDate) || a.id - b.id);

/** A purchase DEBIT raises what we owe the supplier; a payment lowers it. */
const delta = (r: po.LedgerRow) => (r.paymentType ? -r.amount : r.amount);

/** Every running balance = the previous one ± its amount (the first one: its own amount, on a fresh supplier). */
function expectChain(rows: po.LedgerRow[], label: string) {
  let previous = 0;
  for (const r of statement(rows)) {
    expect.soft(r.partyBalance, `${label}: running balance of entry ${r.id}`).toBeCloseTo(previous + delta(r), 2);
    previous = r.partyBalance;
  }
}

const bales = (item: po.Item, n: number) => [po.line(item, n, { kg: 10, perKg: 10 })]; // n × 100

test(
  "Running balances stay correct when a purchase is backdated or revised before later purchases and payments",
  { annotation: tr("C43"), tag: "@smoke" },
  async ({ request }) => {
    const supplier = await po.createCompany(request, "c43");
    const x = await po.createItem(request, supplier, "BIG_BALES", { tag: "c43", ratePerKgs: 10 });
    const garments = await po.companyId(request, "Ironwood Garments");
    const otherSupplierBefore = (await po.ledger(request, garments)).balance;
    const buy = async (n: number, purchaseDate: Date) => {
      const p = await po.createPurchase(request, {
        companyId: supplier,
        baleType: "BIG_BALES",
        lines: bales(x, n),
        purchaseDate,
      });
      await po.approveOk(request, p.id);
      return p;
    };
    // Entries dated today, before the backdated one is recorded.
    const today1 = await buy(2, new Date());
    const today2 = await buy(1, new Date());
    const start = await po.ledger(request, supplier);
    const todayBalances = new Map(start.rows.map((r) => [r.id, r.partyBalance]));
    expect(start.balance).toBe(300);

    let p!: po.Purchase;
    await test.step("Approve a purchase dated 5 days ago (500)", async () => {
      p = await buy(5, new Date(Date.now() - 5 * DAY));
      const now = await po.ledger(request, supplier);
      expect(po.entriesFor(now.rows, p.id).map((e) => e.amount)).toEqual([500]);
      expect(now.balance).toBeCloseTo(start.balance + 500, 2);
      expect((await po.ledger(request, garments)).balance).toBeCloseTo(otherSupplierBefore, 2);
      if (po.knownBug("#219", "a backdated purchase doesn't take its date position or shift later balances")) {
        const ordered = statement(now.rows);
        expect.soft(ordered[0].transactionId, "backdated DEBIT is first in date order").toBe(p.id);
        for (const t of [today1, today2]) {
          const row = po.entriesFor(now.rows, t.id)[0];
          expect
            .soft(row.partyBalance, `later entry ${row.id} shifted by 500`)
            .toBeCloseTo(todayBalances.get(row.id)! + 500, 2);
        }
        expectChain(now.rows, "after the backdated purchase");
      }
    });

    let q!: po.Purchase;
    let tQ = 0;
    await test.step("Approve Q dated today (400)", async () => {
      const before = await po.ledger(request, supplier);
      q = await buy(4, new Date());
      const now = await po.ledger(request, supplier);
      const qRow = po.entriesFor(now.rows, q.id)[0];
      expect(qRow.partyBalance).toBeCloseTo(before.balance + 400, 2);
      tQ = qRow.partyBalance;
    });

    let tPay = 0;
    let paymentId = 0;
    await test.step("Record a supplier payment of 300 dated today, after Q", async () => {
      const before = await po.ledger(request, supplier);
      await po.payCompany(request, supplier, 300);
      const now = await po.ledger(request, supplier);
      const payment = now.rows.find((r) => r.paymentType && !before.rows.some((b) => b.id === r.id));
      expect(payment?.amount).toBe(300);
      expect(now.balance).toBeCloseTo(before.balance - 300, 2);
      tPay = payment!.partyBalance;
      paymentId = payment!.id;
    });

    await test.step("Revise P to a total 300 higher and approve: later balances shift by +300", async () => {
      const before = await po.ledger(request, supplier);
      await po.revise(request, await po.getPurchase(request, p.id), bales(x, 8));
      await po.approveOk(request, p.id);
      const now = await po.ledger(request, supplier);
      expect(now.entries).toBe(before.entries);
      expect(po.entriesFor(now.rows, p.id).map((e) => e.amount)).toEqual([800]);
      expect(po.entriesFor(now.rows, q.id)[0].partyBalance).toBeCloseTo(tQ + 300, 2);
      const payment = now.rows.find((r) => r.id === paymentId)!;
      expect(payment.amount).toBe(300);
      expect(payment.partyBalance).toBeCloseTo(tPay + 300, 2);
      expect(now.balance).toBeCloseTo(before.balance + 300, 2);
      if (po.knownBug("#219", "running balances in date order")) expectChain(now.rows, "after +300");
    });

    await test.step("Revise P to a total 400 lower and approve: later balances drop by 400", async () => {
      const before = await po.ledger(request, supplier);
      await po.revise(request, await po.getPurchase(request, p.id), bales(x, 4));
      await po.approveOk(request, p.id);
      const now = await po.ledger(request, supplier);
      expect(po.entriesFor(now.rows, q.id)[0].partyBalance).toBeCloseTo(tQ + 300 - 400, 2);
      expect(now.rows.find((r) => r.id === paymentId)!.partyBalance).toBeCloseTo(tPay + 300 - 400, 2);
      expect(now.balance).toBeCloseTo(before.balance - 400, 2);
      if (po.knownBug("#219", "running balances in date order")) expectChain(now.rows, "after -400");
    });
  }
);

test(
  "Revising an older purchase reconciles running balances of entries on the same date",
  { annotation: tr("C44"), tag: "@smoke" },
  async ({ request }) => {
    test.fixme(
      !po.runKnownBugs,
      "Known bug #227: a revision shifts only entries dated strictly after the purchase, so same-date entries keep stale balances."
    );
    const supplier = await po.createCompany(request, "c44");
    const x = await po.createItem(request, supplier, "BIG_BALES", { tag: "c44", ratePerKgs: 10 });
    // Month-end style: both entered for the same date (the date picker sends the day, not a time).
    const sameDate = new Date(Date.now() - 3 * DAY);
    sameDate.setUTCHours(0, 0, 0, 0);
    const p = await po.createPurchase(request, {
      companyId: supplier,
      baleType: "BIG_BALES",
      lines: bales(x, 10),
      purchaseDate: sameDate,
    });
    await po.approveOk(request, p.id);
    const q = await po.createPurchase(request, {
      companyId: supplier,
      baleType: "BIG_BALES",
      lines: bales(x, 10),
      purchaseDate: sameDate,
    });
    await po.approveOk(request, q.id);
    const before = await po.ledger(request, supplier);
    const qBefore = po.entriesFor(before.rows, q.id)[0].partyBalance;

    await test.step("Revise P to 12 bales (1200) and approve: Q's balance rises by 200", async () => {
      await po.revise(request, await po.getPurchase(request, p.id), bales(x, 12));
      await po.approveOk(request, p.id);
      const now = await po.ledger(request, supplier);
      expect.soft(po.entriesFor(now.rows, p.id).map((e) => e.amount)).toEqual([1200]);
      expect.soft(po.entriesFor(now.rows, q.id)[0].partyBalance, "Q's running balance").toBeCloseTo(qBefore + 200, 2);
      expectChain(now.rows, "same-date entries");
      expect(now.balance).toBeCloseTo(before.balance + 200, 2);
    });
  }
);
