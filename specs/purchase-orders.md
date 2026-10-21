# Purchase Orders Regression Test Plan

## Application Overview

Regression coverage for Purchase Orders (brief: `specs/briefs/purchase-orders.md`) in the Drift Warehouse Demo org on a local DB (http://127.0.0.1:3100). Roles: ADMIN admin@trs.com (default storage state) and EDITOR warehouse@trs.com (log in during test setup with `DEMO_EDITOR_*_PASSWORD`). Out of scope: purchase reports and exports.

TestRail section: "Purchase orders" (id 4). **24 cases**, consolidated on 2026-10-21 from the original 60 (C4–C63) and revised the same day by a case review (`/qa-kit:review-cases`) against the code: each case is one business outcome, written as a journey with checkpoints or a data table. The 36 merged or dropped ids are listed under "Retired cases" at the end and are moved to a "Retired" section in TestRail, not deleted. Rewritten cases go back to "AI draft" for Gate 1.

Confirmed business rules (from the brief):

- Weight is per bale. Weight-priced line amount = bales × weight per bale × rate per unit (kg or lb, used consistently). Bale-priced line amount = bales × rate per bale. Surcharge is added once to the purchase total.
- Duplicate invoice numbers are allowed.
- Posted purchases can be corrected (quantity, rate, items added/removed), also after later sales and payments, and stock and ledger must stay consistent.
- New purchases default to the item's latest cost; historical purchase prices never change because the current cost changed.

Key facts verified against the code and a live run:

- Endpoints: POST/GET /api/purchase, GET/PUT /api/purchase/{id}, PUT /api/purchase/approve/{id}, PUT /api/purchase/cancel/{id}. Inventory: GET /api/inventory (row id equals item id; fields onHand, noOfBales, baleWeightKgs). Ledger: GET /api/ledger/{companyId}?type=company returns {transactions[] (id, amount, spendType, totalBalance, runningBalance, transactionId = purchase id), totalBalance}.
- UI: list /purchase (columns Id, Company Name, Invoice Total Amount (Rs), Bale Type, Invoice Number, Sur Charge (Rs), Purchase Date, Updated At, Status, Action; company search box 'search company'); create /purchase/create; edit /purchase/{id}. The List Type dropdown shows the raw codes SMALL_BALES / BIG_BALES. After choosing company and list type the form lists ALL of that company's items of that type; fill No of Bales (required) and weights/rates via 'Edit All' then 'Save All'; drop rows with Remove / Remove Selected. SMALL_BALES also requires Rate Per Bale. 'Create Purchase' is disabled until company and list type are chosen, at least one row exists and 'Edit All' mode is closed. Server validation errors appear as a toast.
- Permissions (`data/permission.js`, `lib/authz.js`): purchase_approve is ADMIN only; purchase_edit is ADMIN and EDITOR. Approve (check) and cancel (cross) icons show only on PENDING rows for users with purchase_approve; every row has an edit (pencil) icon. Approve/cancel APIs return 403 'Operation not permitted.' for EDITOR. **Owner rule (2026-10-21): staff can only view an APPROVED purchase, not change it.** The code still lets an EDITOR edit one (see D9, C20).
- Seeded data (ids may differ; resolve by name and read before-values at runtime): company 'Ironwood Garments' (BIG_BALES items 'ladies cotton tops', 'handbags mixed'); a second company with its own BIG_BALES 'ladies cotton tops'; 'Ironwood Imports' (SMALL_BALES 'mixed winter jackets'). Every seeded item already has an inventory row, so "stock row created" needs a new item from POST /api/items ({companyId, itemName, type, ratePerKgs}), which creates no inventory row.
- antd pickers (Company, List Type, 'Add Removed Items', 'search company'): in specs use the helpers in `e2e/support/antd.ts`, e.g. `await antSelect(page, "Company", "Ironwood Garments")` and `antSelect(page, "List Type", "BIG_BALES")`. Don't use `getByRole("option", { name })` (it matches antd's hidden 0×0 listbox and hangs) or `getByLabel("Company")` / `getByLabel("List Type")` (these Form.Items have no `name`, so the label isn't linked). Agents driving the live browser: never click an `option` ref from the snapshot; click the field, type enough of the option text to make it unique, then press Enter. Lists are virtual (~10 rows rendered), so type to reach later options.
- Test data: create your own items/purchases via the API with unique invoice numbers/names (e.g. `QA-PO-<case>-<timestamp>`). Never mutate seeded purchases. No delete endpoint exists, so data accumulates.
- Purchase payload: {companyId, totalAmount, surCharge (nullable), invoiceNumber (nullable), purchaseDate (ISO), baleType 'SMALL_BALES'|'BIG_BALES', purchasedProducts: [{id, itemName (min 3 chars), noOfBales, baleWeightKgs, baleWeightLbs, ratePerKgs, ratePerLbs, ratePerBale}]}. totalAmount is supplied by the client; the server does not recompute it. **In API setup, always send a totalAmount equal to the lines' computed total** (only C33 sends an inconsistent one on purpose), and populate only one unit (kg or lb) per line.
- Check outcomes after a reload or through GET endpoints (saved data, stock, supplier ledger), not only success messages.

How to write these tests:

- **One test per case.** Journeys use one `test.step` per numbered step, each with its own assertions. Data-table cases loop over their rows inside one test, one `test.step` per row named after the row, so a failure names the row.
- **Known bugs stay in their own case** (C48, C57, C59, C20, C34, C44, C43 step 1, C62, and the weight-pricing rows of C30). Mark the test `test.fixme()` with the reason so it doesn't block the healthy rows. When a bug is fixed, fold its rows into the related table (C48, C57 and C59's same-org rows into C11; C59's cross-org row into C58; C20 into C16) and retire the id.
- **The weight-pricing bug should fail one place, not ten.** Only C30 checks weight-priced totals in the form. Other UI journeys use SMALL_BALES lines priced per bale (fill No of Bales and Rate Per Bale, leave weights and per-kg/lb rates empty; the form uses kg/lb first when filled), or create their data through the API.

## Known risks and discrepancies

- **Weight pricing (brief, `utils/ui.util.js`, #222):** the form computes weight-priced lines as weight × rate without the bale count. The kg and lb rows of C30 are expected to fail until fixed.
- **D1 (`pages/api/purchase/[id].js`, #223):** a pending edit only saves when revisionNo is 0, so editing a revised PENDING purchase returns 200 but saves nothing. C34 is expected to fail.
- **D2 (#217):** the API accepts `purchasedProducts: []`. C48 is expected to fail.
- **D8 (review, 2026-10-21, #217):** the Joi schemas accept negative bales, weights, rates and surcharge, and a weight line with no weight or no rate. The PUT schema also makes company, date, bale type and products optional. The owner says only the optional fields (invoice number, surcharge) may be left out of an edit. C48 is expected to fail.
- **D8b (#218):** PUT `/api/purchase/{id}` never looks up the items it saves, and create checks the item's company but not its bale type. An edit can attach a nonexistent item, another supplier's item, an item of the other bale type, or another organization's item. Approving such a purchase then creates a stock row in this org keyed by a foreign item id. C59 is expected to fail.
- **D9 (#216):** an EDITOR can PUT an APPROVED purchase, which reopens it as PENDING with a new revision. The owner's rule is view-only for staff. C20 is expected to fail.
- **D10 (#219):** approving a new (revisionNo 0) backdated purchase stores its balance as the sum of all entries + its total, and later-dated rows aren't shifted. The ledger screen and PDF show these stored balances in entry (id) order, not date order. C43 step 1 is expected to fail. Owner decision (2026-10-21): the statement follows date order.
- **D11 (#220):** approval locks only the purchase being approved. `balanceQuery` reads the supplier's balance outside the approval transaction, so two purchases for one supplier approved at the same moment can store overlapping balances (10,500 and 10,300 instead of 10,500 and 10,800). C62 is likely to fail; it's a race, so run it with `--repeat-each`.
- **D5 (#224):** the API doesn't enforce the UI's locks on company and bale type. C57 is expected to fail.
- **D7 (new, 2026-10-21):** approval writes the latest rates to the inventory row (`pages/api/purchase/approve/[id].js`), but the create form takes its defaults from the item (`/api/items`), so a new purchase may not default to the latest cost. C46 may fail on its first step; confirm with the owner which rate "latest cost" means.
- **Client-supplied total:** C33 may fail.
- **Same-date ledger entries:** revision updates select strictly later dates. C44 may fail.
- **Cancel / approve status checks:** cancel only changes status, and approve only rejects APPROVED. Not tested, pending the decisions below.
- D6: the UI shows SMALL_BALES / BIG_BALES rather than "Small/Big bales". Approval also increments the inventory row's baleWeightKgs/Lbs. 404 wording differs between endpoints.

Expected failures must not be weakened: mark the test `test.fixme()` with the reason and draft a `qa:gate-4` bug.

## Left out of this plan

- **Waiting on owner decisions (from the brief), so no expected result is asserted:** cancelling an APPROVED or revised-pending purchase, repeated cancellation, approving a cancelled purchase, editing/reopening a cancelled purchase; whether last approved stock/ledger effects stay in place while a revision is pending (C23 doesn't assert it); a correction removing more stock than remains after sales; lines with both kg and lb filled; currency rounding; zero-price/zero-quantity lines; fractional bale counts; duplicate item lines; the exact meaning and timing of "latest cost" (see D7); whether staff are also view-only on a CANCEL purchase (C20 covers APPROVED only).
- **Moved to Jest integration tests** (they need fault injection or a guaranteed race, which E2E can't produce reliably): failure consistency (brief scenario 12), and an edit racing an approval (brief scenario 11, formerly C63).
- **Not in the brief:** company search filter and its empty state, PO date picker limits, 404/malformed ids, popconfirm "No", read-only view page, ADMIN icon matrix across statuses, unauthenticated access.

## Test Scenarios

**Seed for all suites:** `e2e/seed.spec.ts`

### 1. Create and price a purchase

#### 1.1. Staff record a purchase in the form and it is saved as PENDING with the right total, without touching stock or ledger

**TestRail:** C4 · **Priority:** P1 · **Criterion:** 1, posting boundary 2
**File:** `e2e/purchase/create.spec.ts`
**Why it matters:** a purchase is a draft until the owner approves it; if saving alone moved stock or the supplier balance, every unapproved draft would distort the books.

**Steps:**

1. Setup: two SMALL_BALES items A and B for 'Ironwood Imports' via POST /api/items. Record their on-hand stock and the 'Ironwood Imports' ledger balance and entry count. Open /purchase/create as ADMIN.
   - expect: Heading 'Create Purchase Order'; Total Amount and Total Bundle(s) show 0; 'Create Purchase' is disabled
2. Select company 'Ironwood Imports' and List Type SMALL_BALES
   - expect: 'Rate Per Bale' column; only that company's SMALL_BALES items are listed, including A and B
3. Keep only A and B; Edit All; A: 3 bales × Rs 10/bale, B: 2 bales × Rs 20/bale; type the rates over the defaults; Save All
   - expect: Total Bundle(s) = 5; Total Amount = 70
4. Enter a unique Invoice No and Sur Charge 50
   - expect: Total Amount = 120
5. Click 'Create Purchase'
   - expect: Redirected to /purchase; new row shows Ironwood Imports, SMALL_BALES, the invoice, Sur Charge 50, total 120, PENDING
6. Reload; GET /api/purchase/{id}
   - expect: totalAmount 120, surCharge 50, exactly the 2 lines with the typed bales and rates; status PENDING
7. GET /api/inventory and the company ledger
   - expect: Stock, balance and entry count unchanged
8. Create a second purchase the same way with one line (A: 2 bales × Rs 10/bale), Invoice No empty and Sur Charge 0; reload; GET
   - expect: No error toast; PENDING; invoiceNumber null ('N/A' in the list); totalAmount 20

#### 1.2. Every pricing method gives the same total on screen, in the saved purchase and in the supplier ledger

**TestRail:** C30 · **Priority:** P1 · **Brief:** pricing 1
**File:** `e2e/purchase/pricing.spec.ts`
**Why it matters:** the purchase total becomes what the business owes the supplier; a wrong multiplier means paying the wrong amount.

**Steps:** for each row, create the purchase in the UI, check the on-screen total, create, reload and GET, then approve via the API and GET the company ledger. Use multiple bales so a missing bale multiplier can't pass.

| Row             | Company / type                 | Lines                                                       | Sur Charge | Expected total = saved total = ledger DEBIT  |
| --------------- | ------------------------------ | ----------------------------------------------------------- | ---------- | -------------------------------------------- |
| kg              | 'Ironwood Garments' BIG_BALES  | 3 bales × 50 kg × Rs 100/kg                                 | 0          | 15,000                                       |
| lb              | 'Ironwood Garments' BIG_BALES  | 2 bales × 100 lb × Rs 40/lb                                 | 0          | 8,000                                        |
| per bale        | 'Ironwood Imports' SMALL_BALES | 3 bales × Rs 10/bale, 2 bales × Rs 20/bale                  | 0          | 70                                           |
| mixed, decimals | 'Ironwood Garments' BIG_BALES  | 4 bales × 12.5 kg × Rs 10.4/kg, 2 bales × 100 lb × Rs 40/lb | 75         | 8,595 (surcharge added once; decimals saved) |

- expect (each row): on-screen Total Amount, saved totalAmount and the single new ledger DEBIT all equal the expected total; balance rises by exactly that amount
- The kg, lb and mixed rows are expected to fail (weight-pricing bug). Keep them in a separate `test.fixme()` test from the per-bale row.

#### 1.3. A direct request with an inconsistent total does not post an incorrect supplier liability

**TestRail:** C33 · **Priority:** P1 · **Brief:** pricing 1 · **May fail (client-supplied total)**
**File:** `e2e/purchase/pricing-api.spec.ts`
**Why it matters:** anyone with an API session could understate a supplier liability; the books must follow the lines, not the client's arithmetic.

**Steps:**

1. POST one line 3 × 50 kg × Rs 100 (15000) with totalAmount 1
   - expect: Rejected (4xx, nothing saved) or saved with totalAmount 15000
2. If saved: approve; GET ledger
   - expect: DEBIT 15000, never 1

### 2. Input integrity

#### 2.1. The create form only submits a complete purchase

**TestRail:** C9 · **Priority:** P1 · **Criterion:** 2
**File:** `e2e/purchase/validation.spec.ts`
**Why it matters:** an incomplete purchase saved by mistake becomes a record someone may approve.

**Steps:**

1. Open /purchase/create with nothing selected
   - expect: 'Create Purchase' disabled
2. Select a company only
   - expect: No items table; still disabled
3. Select BIG_BALES, select all rows, Remove Selected
   - expect: Empty table; disabled
4. Select a new company created via the API with no items, and BIG_BALES
   - expect: No rows; disabled
5. Select 'Ironwood Garments' and BIG_BALES; fill nothing; Create Purchase
   - expect: Toast 'ValidationError: "purchasedProducts[0].noOfBales" is required'; URL unchanged
6. GET /api/purchase
   - expect: Count unchanged from before step 1

#### 2.2. Switching company or bale type while creating leaves only the new selection's items and recalculates totals

**TestRail:** C55 · **Priority:** P2 · **Brief:** form 9
**File:** `e2e/purchase/form.spec.ts`
**Why it matters:** a stale line from the first selection would put stock and cost against the wrong supplier.

**Steps:**

1. Company A, SMALL_BALES, fill a row
   - expect: Total reflects it
2. Switch to company B
   - expect: Only B's items; totals reset
3. Fill a B row, then switch List Type to BIG_BALES
   - expect: Only B's BIG_BALES items; totals reset
4. Switch back to SMALL_BALES, fill a B row; create; reload; GET
   - expect: companyId B, baleType SMALL_BALES; only that B item saved; total matches the row

#### 2.3. The API rejects an incomplete purchase or another supplier's item on create, and saves nothing

**TestRail:** C11 · **Priority:** P1 · **Criterion:** 1, 2 · **Brief:** integrity 8
**File:** `e2e/purchase/validation-api.spec.ts`
**Why it matters:** the form isn't the only way in; a bad request must never create a purchase that later posts stock and money against the wrong supplier.

**Steps:** for each row, POST the request, then check the purchase count is unchanged. Rows that fail today live in C48 and C59 and fold in here once fixed.

| Row                                                             | Request                                       | Expected                                            |
| --------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------- |
| missing companyId / purchaseDate / baleType / purchasedProducts | one field omitted at a time                   | 400 naming the field                                |
| item doesn't exist                                              | item id 999999                                | 404 'one or more purchased products were not found' |
| item of another company                                         | only the other company's 'ladies cotton tops' | 404, same message                                   |
| own item plus another company's item                            | one of each                                   | 404, same message                                   |

#### 2.4. The API rejects a malformed purchase on create and on edit

**TestRail:** C48 · **Priority:** P1 · **Criterion:** 2 · **Expected to fail (D2, D8)**
**File:** `e2e/purchase/validation-api.spec.ts`
**Why it matters:** an approved purchase with no lines, negative quantities or an unpriced weight line posts a supplier liability that doesn't match the goods received.

**Steps:** setup one PENDING 'Ironwood Garments' BIG_BALES purchase P. For each row, send the request on create (POST) and on edit (PUT P), then check the purchase count is unchanged and P is unchanged (GET).

| Row                                                      | Request                                                                        | Expected             |
| -------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------- |
| empty product list                                       | purchasedProducts []                                                           | 4xx                  |
| negative values                                          | noOfBales -1, baleWeightKgs -10, ratePerKgs -5, surCharge -50, one at a time   | 400                  |
| weight line without weight                               | rate set, no weight                                                            | 4xx                  |
| weight line without rate                                 | weight set, no rate                                                            | 4xx                  |
| edit without a required field (PUT only)                 | companyId / purchaseDate / baleType / purchasedProducts omitted, one at a time | 400 naming the field |
| edit without the optional fields (PUT only, control row) | invoiceNumber and surCharge omitted, everything else sent                      | 200; P saved as sent |

- Owner rule (2026-10-21): an edit may leave out only the optional fields (invoice number, surcharge).

#### 2.5. The API refuses an edit that changes a purchase's company or bale type

**TestRail:** C57 · **Priority:** P1 · **Brief:** form 9 · **Expected to fail (D5)**
**File:** `e2e/purchase/form-api.spec.ts`
**Why it matters:** moving a purchase to another supplier silently rewrites whose balance it affects.

**Steps:**

1. PUT with another company's id (and that company's items); PUT with baleType SMALL_BALES
   - expect: 4xx each
2. GET
   - expect: companyId and baleType unchanged

### 3. Approve and cancel

#### 3.1. Approving a purchase adds its bales to stock and posts one DEBIT, exactly once

**TestRail:** C12 · **Priority:** P1 · **Criterion:** 3, 4 · **Brief:** posting boundary 2
**File:** `e2e/purchase/approve.spec.ts`
**Why it matters:** approval is the moment goods and money enter the books; replacing stock instead of adding, missing a new item, or posting twice all give wrong numbers.

**Steps:**

1. Setup via API: a new item N (POST /api/items, no stock row yet). Record stock of 'handbags mixed', the 'Ironwood Garments' ledger balance B and entry count, and another supplier's balance. PENDING purchase P: 'handbags mixed' 5 × 20 kg × Rs 5 (500), N 7 × 10 kg × Rs 10 (700), total 1200. GET /api/inventory
   - expect: No row for N
2. Approve P from the list (check icon, 'Yes')
   - expect: APPROVED; approve/cancel icons gone
3. GET /api/inventory
   - expect: 'handbags mixed' + 5 (increased, not replaced); a row for N with on-hand 7
4. GET company ledger
   - expect: one new DEBIT 1200 for P; balance B + 1200
5. GET the other supplier's ledger
   - expect: Unchanged
6. Approve P again via the API
   - expect: HTTP 400 'Purchase order already approved'; stock, balance and entry count equal step 3 and 4 values

#### 3.2. Cancelling a never-approved PENDING purchase sets CANCEL without changing stock or ledger

**TestRail:** C15 · **Priority:** P1 · **Criterion:** 6
**File:** `e2e/purchase/cancel.spec.ts`
**Why it matters:** a cancelled order must leave no trace in stock or what is owed.

**Steps:**

1. Setup: PENDING purchase 5 × 16 kg × Rs 10 (800); record stock, balance, entry count. Cancel from the list (cross icon, 'Yes')
   - expect: CANCEL; icons gone
2. GET purchase
   - expect: status CANCEL
3. GET inventory and ledger
   - expect: Unchanged

#### 3.3. An approval posts exactly once, whether sent twice at the same time or retried after a lost response

**TestRail:** C60 · **Priority:** P1 · **Brief:** retry 11
**File:** `e2e/purchase/concurrency.spec.ts`
**Why it matters:** the owner approves in batches, double-clicks and retries on slow connections; a second posting doubles the stock and the debt.

**Steps:**

1. PENDING P1: 5 bales (500); record S, B. Approve from two ADMIN contexts in parallel (API)
   - expect: One 200, one 'already approved'; stock S + 5; one entry; balance B + 500
2. PENDING P2: 5 bales (500); record S, B. Approve from the list with a route that forwards the request (route.fetch) and then aborts the response
   - expect: UI shows failure or no update
3. Reload; approve P2 again
   - expect: Refused as already approved, or shows APPROVED
4. GET inventory and ledger
   - expect: S + 5; one entry for P2; B + 500

#### 3.4. Approving two purchases for the same supplier and item at the same time keeps both postings

**TestRail:** C62 · **Priority:** P1 · **Brief:** concurrency 11 · **Likely to fail (D11, race)**
**File:** `e2e/purchase/concurrency.spec.ts`
**Why it matters:** a lost update loses real stock and real debt without any error.

**Steps:**

1. Two PENDING purchases of X: 5 bales (500), 3 bales (300); record S, B. Approve both in parallel
   - expect: 200 each; X = S + 8; two entries; B + 800; every running balance = previous ± amount

- The stored balances can overlap only when both approvals read the balance before either commits, so the test may pass on some runs. Run it with `--repeat-each` before trusting a pass.

### 4. Permissions and isolation

#### 4.1. Staff (EDITOR) prepare and correct purchases, but only the owner can approve or cancel them

**TestRail:** C16 · **Priority:** P1 · **Criterion:** 5, 7, 8
**File:** `e2e/purchase/permissions.spec.ts`
**Why it matters:** staff prepare the work and the owner commits it; a button hidden in the UI is not a control if the API still accepts the request.

**Steps:** log in as EDITOR in the test's setup.

1. As EDITOR create 'Ironwood Imports', SMALL_BALES, 3 bales × Rs 20/bale in the UI
   - expect: PENDING, total 60; stock and ledger unchanged
2. Open /purchase
   - expect: The row shows only the pencil icon, no approve or cancel
3. Edit it: Sur Charge 25, 4 bales; Update Purchase
   - expect: Sur Charge 25, total 105, still PENDING
4. As EDITOR PUT approve, then cancel, on it
   - expect: 403 'Operation not permitted.' each; as ADMIN: still PENDING, stock and ledger unchanged

- Staff on an APPROVED purchase is C20 (known bug D9); fold it in here once fixed.

#### 4.2. Staff can view an approved purchase but can't change it

**TestRail:** C20 · **Priority:** P1 · **Criterion:** 5, 8 · **Expected to fail (D9)**
**File:** `e2e/purchase/permissions.spec.ts`
**Why it matters:** an approved purchase is the owner's commitment. If staff can edit it, they reopen it as PENDING and change what the business owes and holds without the owner approving anything.

**Steps:** setup via the API as ADMIN: an APPROVED 'Ironwood Imports' SMALL_BALES purchase P, 3 bales × Rs 20/bale (60). Record P (status, revisionNo, lines, total), X's stock, the supplier balance and entry count. Log in as EDITOR in the test's setup.

1. As EDITOR open /purchase
   - expect: P's row shows APPROVED with no edit, approve or cancel action; P can be opened to view it
2. As EDITOR open /purchase/{P}
   - expect: P's values are shown and can't be changed or saved (no 'Update Purchase')
3. As EDITOR PUT /api/purchase/{P} with 5 bales and total 100
   - expect: 403 'Operation not permitted.'
4. As ADMIN GET P, inventory and the supplier ledger
   - expect: Still APPROVED, revisionNo and lines as recorded, total 60; no PurchaseHistory revision; stock, balance and entry count unchanged

- Open decision: whether staff are also view-only on a CANCEL purchase. Not asserted.

#### 4.3. Another organization's purchases, companies and items can't be seen or touched

**TestRail:** C58 · **Priority:** P1 · **Brief:** isolation 10
**File:** `e2e/purchase/isolation-api.spec.ts`
**Why it matters:** one business seeing or changing another's purchases ends the product.

**Steps:**

1. POST a purchase as the demo ADMIN; GET it and the list
   - expect: Every row carries the demo org's organizationId
2. Precondition: a second org with PENDING purchase Z, its company and item. As demo ADMIN: list, GET, PUT, approve and cancel Z
   - expect: Z not listed; 404 for each
3. POST with the other org's companyId; POST with its item id
   - expect: 404 each; nothing saved
4. Check Z, its stock and ledger as the other org
   - expect: Unchanged

- Injecting the other org's item through an edit is C59 (known bug D8b); fold it in here once fixed.

#### 4.4. An edit can only attach this supplier's items of this bale type, never another organization's or a nonexistent one

**TestRail:** C59 · **Priority:** P1 · **Type:** Security · **Brief:** integrity 8, isolation 10 · **Expected to fail (D8b)**
**File:** `e2e/purchase/isolation-api.spec.ts`
**Why it matters:** an edit that attaches a foreign item posts stock and cost against the wrong supplier. If the item belongs to another organization, approving the purchase writes a stock row keyed by that org's item into this one.

**Steps:** setup one PENDING 'Ironwood Garments' BIG_BALES purchase P (via the API) and record it; a second org with an item W (as in C58). For each row, PUT P with the product list changed as shown, then GET P, the purchase count, and as the other org GET W's stock.

| Row                                  | PUT purchasedProducts                                    | Expected                                 |
| ------------------------------------ | -------------------------------------------------------- | ---------------------------------------- |
| item doesn't exist                   | P's lines plus item id 999999                            | 404; P unchanged                         |
| item of another company              | P's lines plus the other company's 'ladies cotton tops'  | 404; P unchanged                         |
| item of the other bale type          | P's lines plus a SMALL_BALES item of 'Ironwood Garments' | 4xx; P unchanged                         |
| item of the other bale type (create) | POST a BIG_BALES purchase with that SMALL_BALES item     | 4xx; count unchanged                     |
| another organization's item          | P's lines plus W                                         | 404; P unchanged; W's org data untouched |

### 5. Edit and revise

#### 5.1. Editing a PENDING purchase saves only the kept items and values, and still posts nothing

**TestRail:** C21 · **Priority:** P1 · **Criterion:** 7 · **Brief:** form 9
**File:** `e2e/purchase/edit.spec.ts`
**Why it matters:** suppliers' final invoices differ from the order; corrections before approval must stick exactly as entered.

**Steps:**

1. Setup: never-approved SMALL_BALES purchase with A 5 bales × Rs 10/bale and B 2 bales × Rs 20/bale (90). Open its edit page
   - expect: 'Update Purchase Order'; prefilled (total 90, 7 bundles)
2. Remove B
   - expect: Row gone; bundles 5; 'Add Removed Items' enabled
3. Restore B via 'Add Removed Items' + Apply
   - expect: Row back; bundles 7
4. Remove B again; A to 8 bales; Sur Charge 40; new invoice
   - expect: Total 120
5. Update Purchase
   - expect: Row shows the new invoice, Sur Charge 40, total 120, PENDING
6. Reload; GET; GET /api/purchase
   - expect: PENDING, revisionNo 0, only A with 8 bales, 120; purchase count unchanged since step 1 and exactly one purchase carries the new invoice (regression for `bug/edit-purchase-duplicate`)
7. GET inventory and ledger
   - expect: Unchanged

#### 5.2. Revising an approved purchase records the change and re-approval moves stock and ledger by the difference only

**TestRail:** C23 · **Priority:** P1 · **Criterion:** 8 · **Brief:** revision cycle 3
**File:** `e2e/purchase/edit-approved.spec.ts`
**Why it matters:** corrections after approval are routine; re-posting the full purchase would double stock and debt, and the history is what the accountant checks.

**Steps:**

1. Setup: new item X; record S_X, S_H and balance B0. P approved via the API: X 10 × 10 kg × Rs 5 (500), 'handbags mixed' 5 × 10 kg × Rs 10 (500), total 1000. Edit P in the UI: X 15, 'handbags mixed' 3; Update Purchase
   - expect: PENDING; approve/cancel icons back
2. Reload; GET
   - expect: revisionNo 1, total 1050; revisionDetails X +5, 'handbags mixed' -2, previous 10 and 5
3. Approve from the list
   - expect: APPROVED, revisionNo 1
4. GET inventory and ledger
   - expect: X = S_X + 15; 'handbags mixed' = S_H + 3; entry count unchanged since the first approval; P's entry 1050; balance B0 + 1050
5. Revise again via the API: X 12, 'handbags mixed' 3 (total 900); approve
   - expect: revisionNo 2; X = S_X + 12; 'handbags mixed' still S_H + 3; still one entry for P, 900; balance B0 + 900

- Does not assert stock/ledger while a revision is pending (open decision).
- The UI totals in step 1 are weight-priced; assert the saved values via GET, not the on-screen total, so the weight-pricing bug (C30) doesn't fail this case.

#### 5.3. Editing a revised purchase again while pending keeps the latest values, and re-approval is relative to the last approved version

**TestRail:** C34 · **Priority:** P1 · **Criterion:** 7 · **Brief:** revision cycle 3 · **Expected to fail (D1)**
**File:** `e2e/purchase/revision-cycle.spec.ts`
**Why it matters:** an edit that reports success but saves nothing means the owner approves numbers nobody entered.

**Steps:**

1. Record S, B. Approved X 10 × 10 kg × Rs 10 (1000). Revise to 15 (1500)
   - expect: PENDING, revisionNo 1
2. Edit to 12 (1200) on the edit page; Update; reload; GET
   - expect: 12 bales, 1200
3. Approve; GET inventory and ledger
   - expect: X = S + 12; one entry 1200; balance B + 1200
4. Cycle: revise to 8 (800), edit to 9 (900), approve
   - expect: X = S + 9; entry 900; balance B + 900
5. Revision history
   - expect: Latest revision records -3 from the last approved version (12 → 9)

#### 5.4. Every kind of correction moves stock and ledger by exactly what changed

**TestRail:** C35 · **Priority:** P1 · **Brief:** revision matrix 4
**File:** `e2e/purchase/revision-matrix.spec.ts`
**Why it matters:** a price fix must not add stock, and a removed item must give its stock back; each mistake shows up as wrong stock or a wrong supplier balance.

**Steps:** for each row, set up via the API an approved purchase priced at 10 kg × Rs 10/kg per bale, record stock and balance B after that first approval, PUT the change, approve, then GET inventory and ledger. Match lines by item id.

| Row             | Before (total)               | Change (total)       | Expected stock          | Expected ledger    |
| --------------- | ---------------------------- | -------------------- | ----------------------- | ------------------ |
| rate only       | X 5 bales (500)              | rate Rs 12/kg (600)  | X unchanged             | entry 600; B + 100 |
| surcharge only  | X 5 bales, surcharge 0 (500) | surcharge 50 (550)   | unchanged               | entry 550; B + 50  |
| weight only     | X 5 bales (500)              | 12 kg per bale (600) | on-hand bales unchanged | entry 600; B + 100 |
| item added      | X 5 (500)                    | add Y 4 bales (900)  | X unchanged; Y + 4      | entry 900; B + 400 |
| item removed    | X 5 + Y 4 (900)              | remove Y (500)       | Y - 4; X unchanged      | entry 500; B - 400 |
| lines reordered | [X 5, Y 4] (900)             | [Y 4, X 5] (900)     | unchanged               | entry 900; B       |

- expect (each row): no new ledger entry; the purchase's existing entry is adjusted

### 6. Ledger reconciliation and downstream activity

#### 6.1. Running balances stay correct when a purchase is backdated or revised before later purchases and payments

**TestRail:** C43 · **Priority:** P1 · **Criterion:** 8 · **Brief:** ledger reconciliation 6, downstream 5 · **Step 1 expected to fail (D10, #219)**
**File:** `e2e/purchase/ledger-reconcile.spec.ts`
**Why it matters:** the supplier statement is read line by line; one wrong running balance makes every later line wrong.

**Steps:**

1. Company with entries dated today; record their running balances, B, and another supplier's balance. Approve a purchase P dated 5 days ago (500)
   - expect: DEBIT 500 ordered before the later entries; each later running balance + 500; balance B + 500; every running balance = previous ± amount; other supplier unchanged
2. Approve Q dated today (400); record T_Q and B
   - expect: Q's running balance = previous + 400
3. Record a supplier payment of 300 dated today, after Q, via the ledger payment API (confirm the payload against the ledger API and its tests); record its running balance T_pay
   - expect: Payment row present; balance B - 300
4. Revise P to a total 300 higher; approve
   - expect: P's entry +300; Q T_Q + 300; payment still 300 with T_pay + 300; no new entries; every running balance = previous ± amount
5. Revise P to a total 400 lower than step 4; approve
   - expect: Q and payment running balances each drop by 400; final balance = previous final balance - 400

- "Running balance" means the Balance column the supplier statement shows: each row's `partyBalance` from GET /api/ledger/{companyId}?type=company (the stored balance), not the recomputed `runningBalance` field.
- The statement follows date order (owner decision, 2026-10-21). Today rows are listed in entry order and a new backdated purchase doesn't shift later rows (D10, #219), so step 1 is expected to fail. Keep it in its own `test.step` so steps 2–5 still report.

#### 6.2. Revising an older purchase reconciles running balances of entries on the same date

**TestRail:** C44 · **Priority:** P1 · **Brief:** ledger reconciliation 6 · **May fail (same-date risk)**
**File:** `e2e/purchase/ledger-reconcile.spec.ts`
**Why it matters:** month-end entries often share a date; skipping same-date entries leaves the statement inconsistent.

**Steps:**

1. P and Q on the same date, P approved first then Q (1000 each); record B. Revise P to 12 bales (1200); approve
   - expect: P 1200; Q running balance + 200; every running balance = previous ± amount; balance B + 200

#### 6.3. Correcting a purchase after some bales were sold keeps the sale and applies only the correction

**TestRail:** C41 · **Priority:** P1 · **Brief:** downstream 5
**File:** `e2e/purchase/downstream.spec.ts`
**Why it matters:** goods are often sold before the supplier's final invoice arrives; the correction must not undo or duplicate the sale.

**Steps:**

1. Approved X 10 bales (1000); a sale of 2 bales of X created and approved via the sales API; record S (after the sale), the sale and the customer ledger. Revise the purchase to 7 bales (700); approve
   - expect: X = S - 3; the sale and customer ledger unchanged; purchase entry 700; supplier balance - 300

### 7. Latest cost

#### 7.1. New purchases default to the latest cost, a typed rate is kept, and older purchases keep their recorded rates

**TestRail:** C46 · **Priority:** P1 · **Brief:** latest cost 7 · **Step 1 may fail (D7)**
**File:** `e2e/purchase/latest-cost.spec.ts`
**Why it matters:** costs change; a stale default leads to wrong orders, and rewriting old purchases would change what was already owed and paid.

**Steps:**

1. Item X at Rs 10/kg. Purchase A at Rs 10/kg approved, then purchase B dated today at Rs 14/kg approved. Open /purchase/create and select X's company and type
   - expect: X defaults to Rs 14/kg
2. GET A, its view page and its ledger entry
   - expect: A still Rs 10/kg, original total and ledger amount
3. Create a purchase with X at a typed Rs 13/kg; reload; open its edit page; GET
   - expect: Rs 13/kg saved and shown (assert the rate, not the weight-priced total)

## Retired cases

Moved to the "Retired" section in TestRail on consolidation (2026-10-21). The case review the same day restored C20 and C59 as known-bug cases. Merged cases' steps live on in the case named; nothing here is generated.

| Retired                 | Now covered by | Note                                                                                  |
| ----------------------- | -------------- | ------------------------------------------------------------------------------------- |
| C5                      | C4             | step 8                                                                                |
| C6, C31, C32            | C30            | rows of the pricing table                                                             |
| C10, C28                | C9             | steps 4–5                                                                             |
| C56                     | C55            | step 3                                                                                |
| C7                      | C11            | row: item of another company                                                          |
| C49, C50, C51           | C48            | rows: edit without a required field, weight line without weight/rate, negative values |
| C52                     | C11, C59       | nonexistent item: create row in C11, edit row in C59                                  |
| C53, C54                | C59            | rows: other bale type, another company's item on edit                                 |
| C13, C14                | C12            | steps 1, 3 and 6                                                                      |
| C61                     | C60            | steps 2–4                                                                             |
| C17, C18, C19           | C16            | EDITOR journey                                                                        |
| C8                      | C58            | step 1                                                                                |
| C22                     | C21            | steps 2–4                                                                             |
| C24, C27                | C23            | steps 3–5                                                                             |
| C26                     | C34            | duplicate                                                                             |
| C36, C37, C38, C39, C40 | C35            | rows of the revision table                                                            |
| C25, C42                | C43            | steps 2–5                                                                             |
| C45, C47                | C46            | steps 1 and 3                                                                         |
| C29                     | —              | dropped: empty search result protects nothing the owner would lose                    |
| C63                     | —              | dropped from E2E: edit racing approval moves to a Jest integration test               |
