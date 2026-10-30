# Purchase approval: batch inventory updates (#257)

## Overview

Approving a purchase used to run 4-5 queries per line, all inside the transaction holding the purchase lock.
On large purchases this went over Vercel's 10 s limit in production (purchases 1207-1209, 2026-10-30).
Branch `perf/batch-approve-inventory-257` locks every affected stock row in one read (in id order), applies
the lines in memory, then writes each stocked row once and inserts all never-stocked items in one batch. The
business rules don't change: this plan guards the batch path where it differs from the old one (many lines,
stocked and never-stocked items in one approval, revisions, overlapping approvals, failure mid-way).

Explored 2026-10-30 on the local Drift Warehouse Demo org (http://127.0.0.1:3100, admin@trs.com). Test
supplier company 117, purchases 1527-1531.

## Key facts (observed)

- 50-line approval from the list: 200 in 258 ms; re-approval after a revision: 117 ms. A local database
  can't reproduce Supabase latency, so E2E timing isn't a meaningful guard. The query-count test in
  `__tests__/api/purchase/approve-inventory-pg.test.js` and the benchmark (`approve-inventory.bench.js`) are.
- Every one of the 50 lines landed: stocked items rose by their bales, never-stocked items got a row equal
  to their bales, one DEBIT of Rs 40,698, balance 25,000 → 65,698.
- The create form sends weights and unused rates as `0`, not null, for a bale-priced line. Approving it
  leaves the stored weight unchanged (20 kg). The null-weight path only comes from direct API requests and is
  covered by the pg unit tests.
- A weight-priced approval adds the line's per-bale kg to the stored kg (20 + 15 = 35). This was the same
  before #257 (Q2).

## Open questions

- **Q1 (unconfirmed defect):** while revising the 50-line purchase, the planner removed item 49 (2 bales).
  After re-approval it read item 49 as still 2 on hand. That contradicts PO-20's "item removed" row, which
  passed on this branch on 2026-10-30. It also contradicts a simulation of `calculateDifferences` +
  `buildRevisionInventoryAdjustments`, which yields −2 for the removed line. PAB-02 asserts the business
  rule (back to 0) and is marked "May fail" until a QA engineer reproduces it. If it reproduces, raise a
  `qa:gate-4` issue.
- **Q2 (owner):** stock stores `baleWeightKgs` as a running sum of each approval's per-bale weight, not a
  per-bale weight or a total weight (5 bales × 20 kg then 2 bales × 15 kg gives 35). What should the stock
  weight mean? Weight assertions are left out of PAB-01/02 until this is answered.
- **Q3 (cosmetic):** approving a bale-priced line stores the per-lb rate as 0 where it was blank, so the
  inventory row shows 0 instead of N/A.

## Already covered elsewhere (run these as the regression set for #257)

PO-09 (approve adds stock incl. a never-stocked item, one DEBIT), PO-11 (double approve / retry), PO-12
(same item, same moment, D11 ledger race), PO-13 (EDITOR can't approve), PO-15 (other organization),
PO-18/PO-20/PO-23 (revisions, incl. removed lines and after sales), PO-24 (rates on approval).
Developer tests on this branch: duplicate lines of one item, quantities sent as strings, null/missing
weights, mixed stocked/new, other organization's stock, query count per product.

## Left out of this plan

- Same item on two lines of one purchase: whether duplicate lines are allowed is still waiting on the owner
  (`specs/purchase-orders.md`). The approval adds both lines (pg unit test), so stock matches what the
  ledger charges.
- A correction removing more bales than remain after sales: waiting on the owner (`specs/purchase-orders.md`).
- Production-like latency: needs a staging database. Use the benchmark with simulated latency instead.

## Test Scenarios

<!-- cases:start (generated from the cases CSV by .qa/scripts/cases.mjs; edit the CSV, not this block) -->

### 1. Large purchases

#### 1.1. Approving a 50-line purchase adds every line's bales and charges once

**TestRail:** — (not pushed yet) · **Key:** PAB-01 · **Priority:** P1 · **Type:** Regression · **Risks:** 2, 1 · **Source:** #257 Done when; business context rule 'Approving a purchase'
**File:** `e2e/purchase/approval-batch.spec.ts`
**Why it matters:** Large supplier invoices are where approvals timed out in production (purchases 1207-1209); a half-applied or missing line leaves stock and the supplier balance wrong.

```gherkin
Given supplier "Ridgeway Textiles" has 25 items in stock at 5 bales each and a balance of Rs 25,000
  And a pending purchase of 50 lines totalling Rs 40,698: those 25 items plus 25 items never stocked
When the owner approves the purchase from the purchase list
Then the purchase shows APPROVED
  And each stocked item rises by its bales (item 00: 5 to 7, item 01: 5 to 8) and each new item shows exactly its bales (item 25: 6)
  And the supplier statement has one new DEBIT of Rs 40,698 and a balance of Rs 65,698
```

- Explored 2026-10-30 on the local demo org (company 117, purchase 1528): approve PUT /api/purchase/approve/{id} returned 200 in 258 ms.
- Data: 50 BIG_BALES items; items 00-24 stocked first by an approved purchase of 5 bales x 20 kg x Rs 10/kg (Rs 25,000). Line i: bales = (i mod 7) + 2; even i weight-priced (15 + i mod 5 kg, Rs 12/kg), odd i bale-priced (Rs 100 + i per bale). Compute expected values with lineTotal/purchaseTotal in e2e/support/purchase-api.ts.
- Assert all 50 stock rows (GET /api/inventory), not only the samples; check the Inventory screen for item 01 (On Hand 8) and the Ledger screen balance 65,698.00.
- Weight checks are left out on purpose: stored kg is summed per approval (20 + 15 = 35), see open question Q2.
- A local database answers in ~1 ms, so this case can't show the production slowdown; the query-count test in __tests__/api/purchase/approve-inventory-pg.test.js guards that. Keep a loose ceiling (approve answers within 10 s) as a smoke signal only.

#### 1.2. Re-approving a revised large purchase applies only the differences

**TestRail:** — (not pushed yet) · **Key:** PAB-02 · **Priority:** P1 · **Type:** Regression · **Risks:** 2, 1, 5 · **Source:** #257 Done when (revision path); business context rule 'Revising an approved purchase' · **May fail (Q1): the planner saw item 49 stay at 2 bales after re-approval; PO-20's removed-line row passes and the diff code subtracts removed lines, so this is unconfirmed**
**File:** `e2e/purchase/approval-batch.spec.ts`
**Why it matters:** Supplier invoices for big loads are corrected after approval; counting the whole purchase again, or keeping removed bales, inflates stock and the amount owed.

```gherkin
Given the 50-line purchase from PAB-01 is approved and the supplier balance is Rs 65,698
When the owner revises it: 3 more bales on items 00-02, 1 fewer on items 03-04, item 49 removed, new item 50 with 4 bales
Then the purchase is PENDING at revision 1 and stock and the balance are unchanged
When the owner approves it again from the purchase list
Then items 00-02 rise by 3 (item 00: 7 to 10), items 03-04 fall by 1 (item 03: 10 to 9), item 50 shows 4 and every other item is unchanged
  And item 49 goes back to 0 and the purchase still has one supplier entry, now Rs 42,316, with a balance of Rs 67,316
```

- Explored 2026-10-30 (purchase 1528): revise via PUT /api/purchase/{id}, re-approve 200 in 117 ms; values above are from the run.
- Assert item 49 in its own test.step after the other checks so a failure there doesn't hide them.
- Existing PO-18/PO-20 cover each kind of correction on 1-2 lines; this case adds the batch path with a mix of increases, decreases, a removal and a never-stocked item in one approval.

### 2. Approving together

#### 2.1. Two purchases sharing items, approved at the same moment, both reach stock

**TestRail:** — (not pushed yet) · **Key:** PAB-03 · **Priority:** P2 · **Type:** Regression · **Level:** api · **Risks:** 2 · **Source:** Lock-ordering change in #257 (commit 555fed9)
**File:** `e2e/purchase/concurrency.spec.ts`
**Why it matters:** The owner approves staff's purchases in batches and two admins can approve at once; if one approval fails or overwrites the other, bales go missing from stock.

```gherkin
Given items A and B of supplier "Ridgeway Textiles" each have 10 bales in stock
  And pending purchase P1 lists A 3 bales then B 2 bales, and pending purchase P2 lists B 4 bales then A 5 bales
When the owner approves P1 and P2 at the same moment
Then both purchases show APPROVED
  And A shows 18 bales and B shows 16 bales
```

- Send both PUT /api/purchase/approve/{id} in parallel (Promise.all) and run with --repeat-each=5. The opposite line order is the point: approval locks stock rows in id order so overlapping approvals can't deadlock; a deadlock shows up as one 500.
- Don't assert the ledger balance here: two approvals for one supplier race on the balance (D11, #220, PO-12). Assert only that each purchase has one DEBIT for its own total.
- Not explored in the browser.

### For developers

Checks best placed in unit tests. Not pushed to TestRail.

#### A failed approval leaves stock, ledger and status as they were

**TestRail:** — (not pushed yet) · **Key:** PAB-04 · **Priority:** P1 · **Type:** Regression · **Level:** unit · **Section:** For developers · **Risks:** 2, 1 · **Source:** #256/#257 production incident
**File:** `__tests__/api/purchase/approve-inventory-pg.test.js`
**Why it matters:** The production timeouts cut approvals off mid-way; if part of a batch had been written, retrying would count those bales twice.

```gherkin
Given a pending 50-line purchase where 25 items are already stocked
When its approval fails after the stock rows are written but before it finishes
Then every stock row has its previous bales and no new stock row exists
  And the purchase is still PENDING with no supplier entry
When the owner approves it again
Then each stocked item shows its previous bales plus its line's bales, once (5 + 2 = 7 for item 00)
```

- Real Postgres via __tests__/api/purchase/pg-harness.js: make updateLedger (or the bulkCreate) throw after the saves and check the rollback. The mocked "should handle DB error and rollback" test in approve.test.js only checks that rollback() was called.

<!-- cases:end -->

## Merged / dropped

- Bale-priced purchase on a weighted item (planner scenario 3): dropped as an E2E case. The form sends 0, which
  was never at risk; the null-weight path is a direct-API edge already in the pg unit tests.
- Re-approving an already approved purchase, double approval, EDITOR approving: covered by PO-09, PO-11, PO-13.
- Another organization's stock: covered by PO-15 and the branch's unit tests.
- Weight sums and per-lb rate 0 on stock: moved to open questions Q2 and Q3, not asserted.
- Response-time assertion as its own case: dropped. A local DB can't reproduce the slowdown; it's a note on PAB-01.
