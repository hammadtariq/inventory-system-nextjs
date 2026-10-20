# Purchase Orders Regression Test Plan

## Application Overview

Regression coverage for Purchase Orders (brief: `specs/briefs/purchase-orders.md`) in the Drift Warehouse Demo org on a local DB (http://127.0.0.1:3100). Roles: ADMIN admin@trs.com (default storage state) and EDITOR warehouse@trs.com (log in during test setup with `DEMO_EDITOR_*_PASSWORD`). Out of scope: purchase reports and exports.

TestRail section: "Purchase orders" (id 4), cases C4–C63. All cases are AI drafts until the QA lead approves them (Gate 1). TestRail holds the full steps; this plan mirrors them for the generator.

Confirmed business rules (from the brief):

- Weight is per bale. Weight-priced line amount = bales × weight per bale × rate per unit (kg or lb, used consistently). Bale-priced line amount = bales × rate per bale. Surcharge is added once to the purchase total.
- Duplicate invoice numbers are allowed.
- Posted purchases can be corrected (quantity, rate, items added/removed), also after later sales and payments, and stock and ledger must stay consistent.
- New purchases default to the item's latest cost; historical purchase prices never change because the current cost changed.

Key facts verified against the code and a live run:

- Endpoints: POST/GET /api/purchase, GET/PUT /api/purchase/{id}, PUT /api/purchase/approve/{id}, PUT /api/purchase/cancel/{id}. Inventory: GET /api/inventory (row id equals item id; fields onHand, noOfBales, baleWeightKgs). Ledger: GET /api/ledger/{companyId}?type=company returns {transactions[] (id, amount, spendType, totalBalance, runningBalance, transactionId = purchase id), totalBalance}.
- UI: list /purchase (columns Id, Company Name, Invoice Total Amount (Rs), Bale Type, Invoice Number, Sur Charge (Rs), Purchase Date, Updated At, Status, Action; company search box 'search company'); create /purchase/create; edit /purchase/{id}. The List Type dropdown shows the raw codes SMALL_BALES / BIG_BALES. After choosing company and list type the form lists ALL of that company's items of that type; fill No of Bales (required) and weights/rates via 'Edit All' then 'Save All'; drop rows with Remove / Remove Selected. SMALL_BALES also requires Rate Per Bale. 'Create Purchase' is disabled until company and list type are chosen, at least one row exists and 'Edit All' mode is closed. Server validation errors appear as a toast.
- Permissions (`data/permission.js`, `lib/authz.js`): purchase_approve is ADMIN only; purchase_edit is ADMIN and EDITOR. Approve (check) and cancel (cross) icons show only on PENDING rows for users with purchase_approve; every row has an edit (pencil) icon. Approve/cancel APIs return 403 'Operation not permitted.' for EDITOR.
- Seeded data (ids may differ; resolve by name and read before-values at runtime): company 'Ironwood Garments' (BIG_BALES items 'ladies cotton tops', 'handbags mixed'); a second company with its own BIG_BALES 'ladies cotton tops'; 'Ironwood Imports' (SMALL_BALES 'mixed winter jackets'). Every seeded item already has an inventory row, so "stock row created" needs a new item from POST /api/items ({companyId, itemName, type, ratePerKgs}), which creates no inventory row.
- antd pickers (Company, List Type, 'Add Removed Items', 'search company'): in specs use the helpers in `e2e/support/antd.ts`, e.g. `await antSelect(page, "Company", "Ironwood Garments")` and `antSelect(page, "List Type", "BIG_BALES")`. Don't use `getByRole("option", { name })` (it matches antd's hidden 0×0 listbox and hangs) or `getByLabel("Company")` / `getByLabel("List Type")` (these Form.Items have no `name`, so the label isn't linked). Agents driving the live browser: never click an `option` ref from the snapshot; click the field, type enough of the option text to make it unique, then press Enter. Lists are virtual (~10 rows rendered), so type to reach later options.
- Test data: create your own items/purchases via the API with unique invoice numbers/names (e.g. `QA-PO-<case>-<timestamp>`). Never mutate seeded purchases. No delete endpoint exists, so data accumulates.
- Purchase payload: {companyId, totalAmount, surCharge (nullable), invoiceNumber (nullable), purchaseDate (ISO), baleType 'SMALL_BALES'|'BIG_BALES', purchasedProducts: [{id, itemName (min 3 chars), noOfBales, baleWeightKgs, baleWeightLbs, ratePerKgs, ratePerLbs, ratePerBale}]}. totalAmount is supplied by the client; the server does not recompute it. **In API setup, always send a totalAmount equal to the lines' computed total** (only C33 sends an inconsistent one on purpose), and populate only one unit (kg or lb) per line.
- Check outcomes after a reload or through GET endpoints (saved data, stock, supplier ledger), not only success messages.

## Known risks and discrepancies

- **Pricing (brief, `utils/ui.util.js`):** the form computes weight-priced lines as weight × rate without the bale count. C4, C5, C17, C21, C23, C30–C32 and C47 are expected to fail until fixed.
- **D1 (`pages/api/purchase/[id].js`):** a pending edit only saves when revisionNo is 0, so editing a revised PENDING purchase returns 200 but saves nothing. C26 and C34 are expected to fail.
- **D2:** the API accepts `purchasedProducts: []`. C48 is expected to fail.
- **D5:** the API doesn't enforce the UI's locks on company and bale type. C57 is expected to fail.
- **Client-supplied total:** C33 may fail.
- **Same-date ledger entries:** revision updates select strictly later dates. C44 may fail.
- **Cancel / approve status checks:** cancel only changes status, and approve only rejects APPROVED. Not tested, pending the decisions below.
- D6: the UI shows SMALL_BALES / BIG_BALES rather than "Small/Big bales". Approval also increments the inventory row's baleWeightKgs/Lbs. 404 wording differs between endpoints.

Expected failures must not be weakened: mark the test `test.fixme()` with the reason and draft a `qa:gate-4` bug.

## Left out of this plan

- **Waiting on owner decisions (from the brief), so no expected result is asserted:** cancelling an APPROVED or revised-pending purchase, repeated cancellation, approving a cancelled purchase, editing/reopening a cancelled purchase; whether last approved stock/ledger effects stay in place while a revision is pending (C23 no longer asserts it); a correction removing more stock than remains after sales; lines with both kg and lb filled; currency rounding; zero-price/zero-quantity lines; fractional bale counts; duplicate item lines; the exact meaning and timing of "latest cost" (C45 uses a purchase that is both latest by date and latest approved, which satisfies either meaning).
- **Failure consistency (brief scenario 12):** forcing a failure mid-posting or mid-revision can't be triggered from the UI or API. Cover it with Jest integration tests that inject failures into the transaction.
- **Not in the brief:** company search filter on the list, PO date picker limits, 404/malformed ids, popconfirm "No", read-only view page, ADMIN icon matrix across statuses, unauthenticated access.

## Test Scenarios

**Seed for all suites:** `e2e/seed.spec.ts`

### 1. Create purchase order

#### 1.1. ADMIN creates a purchase in the UI and it is saved as PENDING without touching stock or ledger

**TestRail:** C4 · **Priority:** P1 · **Criterion:** 1, pricing
**File:** `e2e/purchase/create.spec.ts`

**Steps:**

1. Record on-hand stock of 'handbags mixed' and the 'Ironwood Garments' ledger balance. Open /purchase/create as ADMIN.


    - expect: Heading 'Create Purchase Order'; Total Amount and Total Bundle(s) show 0; 'Create Purchase' is disabled

2. Select company 'Ironwood Garments' and List Type BIG_BALES


    - expect: Items table lists only that company's BIG_BALES items

3. Remove 'ladies cotton tops'; Edit All; 'handbags mixed': 4 bales, 100 kg, Rs 2/kg; Save All


    - expect: Total Bundle(s) = 4; Total Amount = 800 (4 × 100 × 2)

4. Enter a unique Invoice No and Sur Charge 50


    - expect: Total Amount = 850

5. Click 'Create Purchase'


    - expect: Redirected to /purchase; new row shows Ironwood Garments, BIG_BALES, the invoice, Sur Charge 50, total 850, PENDING

6. Reload; GET /api/purchase/{id}


    - expect: totalAmount 850, surCharge 50, one line 4 bales / 100 kg / Rs 2; status PENDING

7. GET /api/inventory and the company ledger


    - expect: Unchanged

#### 1.2. Purchase is saved without the optional invoice number and surcharge

**TestRail:** C5 · **Priority:** P2 · **Criterion:** 1
**File:** `e2e/purchase/create.spec.ts`

**Steps:**

1. Create via UI: 'Ironwood Garments', BIG_BALES, one item 2 bales × 10 kg × Rs 2/kg; Invoice No empty, Sur Charge 0


    - expect: Redirected to /purchase with no error toast

2. Reload; GET /api/purchase/{id}


    - expect: PENDING; invoiceNumber null ('N/A' in list); totalAmount 40

#### 1.3. SMALL_BALES purchase prices each line as bales × rate per bale and saves several items

**TestRail:** C6 · **Priority:** P2 · **Criterion:** 1, pricing
**File:** `e2e/purchase/create.spec.ts`

**Steps:**

1. Setup: two SMALL_BALES items for 'Ironwood Imports' via POST /api/items. Select 'Ironwood Imports' and SMALL_BALES


    - expect: 'Rate Per Bale' column; both items listed

2. Keep only the two items; A: 3 bales × Rs 10/bale, B: 2 bales × Rs 20/bale; Save All


    - expect: Total Bundle(s) = 5; Total Amount = 70

3. Create; reload; GET /api/purchase/{id}


    - expect: PENDING, SMALL_BALES, totalAmount 70, exactly the 2 lines

#### 1.4. API rejects a purchase containing an item from another company

**TestRail:** C7 · **Priority:** P1 · **Criterion:** 1
**File:** `e2e/purchase/create-api.spec.ts`

**Steps:**

1. POST for 'Ironwood Garments' with only the other company's 'ladies cotton tops'


    - expect: HTTP 404 'one or more purchased products were not found'

2. POST with one own item plus the other company's item


    - expect: HTTP 404, same message

3. GET /api/purchase


    - expect: Count unchanged

#### 1.5. New purchase belongs to the signed-in user's organization

**TestRail:** C8 · **Priority:** P2 · **Criterion:** isolation
**File:** `e2e/purchase/create-api.spec.ts`

**Steps:**

1. POST a purchase; GET it and the list


    - expect: All have the demo org's organizationId

### 2. Pricing

#### 2.1. Kg-priced line total is bales × kg per bale × rate, in the saved purchase and the ledger

**TestRail:** C30 · **Priority:** P1 · **Brief:** pricing 1
**File:** `e2e/purchase/pricing.spec.ts`

**Steps:**

1. UI: one line 3 bales × 50 kg × Rs 100/kg (no lb values); Save All


    - expect: Total Amount 15,000

2. Create; reload; GET


    - expect: totalAmount 15000

3. Approve; GET ledger


    - expect: DEBIT 15000; balance + 15000

#### 2.2. Lb-priced line total is bales × lb per bale × rate, in the saved purchase and the ledger

**TestRail:** C31 · **Priority:** P1 · **Brief:** pricing 1
**File:** `e2e/purchase/pricing.spec.ts`

**Steps:**

1. UI: one line 2 bales × 100 lb × Rs 40/lb (no kg values); Save All


    - expect: Total Amount 8,000

2. Create; reload; GET


    - expect: totalAmount 8000

3. Approve; GET ledger


    - expect: DEBIT 8000; balance + 8000

#### 2.3. Multi-line purchase with decimal weights and rates totals every line and adds the surcharge once

**TestRail:** C32 · **Priority:** P1 · **Brief:** pricing 1
**File:** `e2e/purchase/pricing.spec.ts`

**Steps:**

1. A: 4 bales × 12.5 kg × Rs 10.4/kg; B: 2 bales × 100 lb × Rs 40/lb; Save All


    - expect: Total 8,520

2. Sur Charge 75


    - expect: Total 8,595

3. Create; reload; GET


    - expect: totalAmount 8595, surCharge 75, decimals saved

4. Approve; GET ledger


    - expect: one DEBIT 8595

#### 2.4. A direct request with an inconsistent total does not post an incorrect supplier liability

**TestRail:** C33 · **Priority:** P1 · **Brief:** pricing 1
**File:** `e2e/purchase/pricing-api.spec.ts`

**Steps:**

1. POST one line 3 × 50 kg × Rs 100 (15000) with totalAmount 1


    - expect: Rejected (4xx, nothing saved) or saved with totalAmount 15000

2. If saved: approve; GET ledger


    - expect: DEBIT 15000, never 1

### 3. Required fields and input integrity

#### 3.1. Create form blocks saving until a company, bale type and at least one product are given

**TestRail:** C9 · **Priority:** P1 · **Criterion:** 2
**File:** `e2e/purchase/validation.spec.ts`

**Steps:**

1. Nothing selected


    - expect: 'Create Purchase' disabled

2. Company only


    - expect: No items table; still disabled

3. Select BIG_BALES, select all rows, Remove Selected


    - expect: Empty table; disabled

#### 3.2. Submitting with item rows left unfilled shows the validation error and saves nothing

**TestRail:** C10 · **Priority:** P2 · **Criterion:** 2
**File:** `e2e/purchase/validation.spec.ts`

**Steps:**

1. Select 'Ironwood Garments', BIG_BALES; fill nothing; Create Purchase


    - expect: Toast 'ValidationError: "purchasedProducts[0].noOfBales" is required'; URL unchanged

2. GET /api/purchase


    - expect: Count unchanged

#### 3.3. API rejects a purchase missing company, purchase date, bale type or products

**TestRail:** C11 · **Priority:** P1 · **Criterion:** 2
**File:** `e2e/purchase/validation-api.spec.ts`

**Steps:**

1. POST without companyId / purchaseDate / baleType / purchasedProducts in turn


    - expect: HTTP 400 naming the missing field each time

2. GET /api/purchase


    - expect: Count unchanged

#### 3.4. API rejects an empty product list on create and on edit

**TestRail:** C48 · **Priority:** P1 · **Criterion:** 2 · **Expected to fail (D2)**
**File:** `e2e/purchase/validation-api.spec.ts`

**Steps:**

1. POST with purchasedProducts []


    - expect: 4xx; count unchanged

2. PUT an existing PENDING purchase with []


    - expect: 4xx; unchanged

#### 3.5. API rejects an edit missing company, purchase date, bale type or products

**TestRail:** C49 · **Priority:** P2 · **Brief:** integrity 8
**File:** `e2e/purchase/validation-api.spec.ts`

**Steps:**

1. PUT without each required field in turn


    - expect: HTTP 400 each; purchase unchanged

#### 3.6. API rejects a weight-priced line missing its weight or rate

**TestRail:** C50 · **Priority:** P2 · **Brief:** integrity 8
**File:** `e2e/purchase/validation-api.spec.ts`

**Steps:**

1. POST a line with rate but no weight, then weight but no rate


    - expect: 4xx each; count unchanged

#### 3.7. API rejects negative quantities, weights, rates and surcharge on create and edit

**TestRail:** C51 · **Priority:** P1 · **Brief:** integrity 8
**File:** `e2e/purchase/validation-api.spec.ts`

**Steps:**

1. POST with noOfBales -1, baleWeightKgs -10, ratePerKgs -5, surCharge -50 in turn


    - expect: HTTP 400 each; count unchanged

2. PUT the same values in turn


    - expect: HTTP 400 each; purchase unchanged

#### 3.8. API rejects a nonexistent item on create and edit

**TestRail:** C52 · **Priority:** P2 · **Brief:** integrity 8
**File:** `e2e/purchase/validation-api.spec.ts`

**Steps:**

1. POST with item id 999999


    - expect: 404 'one or more purchased products were not found'

2. PUT with item id 999999


    - expect: 4xx; unchanged

#### 3.9. API rejects an item of the other bale type on create and edit

**TestRail:** C53 · **Priority:** P2 · **Brief:** integrity 8
**File:** `e2e/purchase/validation-api.spec.ts`

**Steps:**

1. POST a BIG_BALES purchase containing a SMALL_BALES item of the same company


    - expect: 4xx; nothing saved

2. PUT a BIG_BALES purchase adding it


    - expect: 4xx; unchanged

#### 3.10. API rejects an edit that adds another company's item

**TestRail:** C54 · **Priority:** P1 · **Brief:** integrity 8
**File:** `e2e/purchase/validation-api.spec.ts`

**Steps:**

1. PUT a company 2 purchase adding a company 3 item


    - expect: 4xx; unchanged

### 4. Form integrity

#### 4.1. Switching company during creation leaves only the new company's items and recalculates totals

**TestRail:** C55 · **Priority:** P2 · **Brief:** form 9
**File:** `e2e/purchase/form.spec.ts`

**Steps:**

1. Company A, BIG_BALES, fill a row


    - expect: Total reflects it

2. Switch to company B


    - expect: Only B's items; totals reset

3. Fill a B row; create; reload; GET


    - expect: companyId B; only B's item saved; total matches

#### 4.2. Switching bale type during creation leaves only that type's items and recalculates totals

**TestRail:** C56 · **Priority:** P2 · **Brief:** form 9
**File:** `e2e/purchase/form.spec.ts`

**Steps:**

1. BIG_BALES, fill a row; switch to SMALL_BALES


    - expect: Only SMALL_BALES items; totals reset

2. Fill a row; create; reload; GET


    - expect: baleType SMALL_BALES; only that item saved

#### 4.3. API refuses an edit that changes a purchase's company or bale type

**TestRail:** C57 · **Priority:** P1 · **Brief:** form 9 · **Expected to fail (D5)**
**File:** `e2e/purchase/form-api.spec.ts`

**Steps:**

1. PUT with companyId 3 (and company 3 items); PUT with baleType SMALL_BALES


    - expect: 4xx each

2. GET


    - expect: companyId and baleType unchanged

### 5. Approve and cancel

#### 5.1. ADMIN approving a purchase raises item stock and adds one ledger DEBIT for the total

**TestRail:** C12 · **Priority:** P1 · **Criterion:** 3
**File:** `e2e/purchase/approve.spec.ts`

**Steps:**

1. Setup via API: record stock of both items, ledger balance B, entry count, and another supplier's balance. PENDING purchase P: 'handbags mixed' 5 × 20 kg × Rs 5 (500), 'ladies cotton tops' 3 × 50 kg × Rs 2 (300), total 800. Approve from the list (check icon, 'Yes')


    - expect: APPROVED; approve/cancel icons gone

2. GET /api/inventory


    - expect: 'handbags mixed' + 5; 'ladies cotton tops' + 3 (increased, not replaced)

3. GET company ledger


    - expect: one new DEBIT 800 for P; balance B + 800

4. GET other supplier's ledger


    - expect: Unchanged

#### 5.2. Approving a purchase creates a stock row for an item that had none

**TestRail:** C13 · **Priority:** P1 · **Criterion:** 3
**File:** `e2e/purchase/approve.spec.ts`

**Steps:**

1. Setup: new item via POST /api/items; PENDING purchase 7 × 10 kg × Rs 10 (700). GET inventory


    - expect: No row for the item

2. Approve


    - expect: HTTP 200

3. GET inventory and ledger


    - expect: Row with on-hand 7; one DEBIT 700

#### 5.3. Approving an already approved purchase is refused and changes nothing

**TestRail:** C14 · **Priority:** P1 · **Criterion:** 4
**File:** `e2e/purchase/approve-api.spec.ts`

**Steps:**

1. Approve a purchase, record stock/balance/entry count, approve again


    - expect: HTTP 400 'Purchase order already approved'

2. GET inventory and ledger


    - expect: Equal to the recorded values

#### 5.4. ADMIN cancelling a never-approved PENDING purchase sets status CANCEL without changing stock or ledger

**TestRail:** C15 · **Priority:** P1 · **Criterion:** 6
**File:** `e2e/purchase/cancel.spec.ts`

**Steps:**

1. Setup: PENDING purchase 5 × 16 kg × Rs 10 (800); record stock, balance, entry count. Cancel from the list (cross icon, 'Yes')


    - expect: CANCEL; icons gone

2. GET purchase


    - expect: status CANCEL

3. GET inventory and ledger


    - expect: Unchanged

### 6. Permissions and isolation

#### 6.1. EDITOR sees no approve or cancel actions on the purchase list

**TestRail:** C16 · **Priority:** P1 · **Criterion:** 5
**File:** `e2e/purchase/permissions.spec.ts`

**Steps:**

1. PENDING purchase via API as ADMIN; log in as EDITOR; open /purchase


    - expect: Row listed with only the pencil icon

#### 6.2. EDITOR creates a purchase and it is saved as PENDING

**TestRail:** C17 · **Priority:** P1 · **Criterion:** 5
**File:** `e2e/purchase/permissions.spec.ts`

**Steps:**

1. As EDITOR create 'Ironwood Garments', BIG_BALES, 3 × 10 kg × Rs 2


    - expect: PENDING, total 60

2. GET inventory and ledger


    - expect: Unchanged

#### 6.3. EDITOR edits a PENDING purchase and it stays PENDING

**TestRail:** C18 · **Priority:** P1 · **Criterion:** 5, 7
**File:** `e2e/purchase/permissions.spec.ts`

**Steps:**

1. As EDITOR edit: Sur Charge 25, change bales; Update Purchase


    - expect: Sur Charge 25, new total, PENDING

#### 6.4. API refuses approve and cancel requests from an EDITOR

**TestRail:** C19 · **Priority:** P1 · **Criterion:** 5
**File:** `e2e/purchase/permissions-api.spec.ts`

**Steps:**

1. As EDITOR PUT approve, then cancel


    - expect: 403 'Operation not permitted.' each

2. As ADMIN GET purchase, inventory, ledger


    - expect: PENDING; unchanged

#### 6.5. EDITOR can revise an APPROVED purchase but cannot re-approve it

**TestRail:** C20 · **Priority:** P2 · **Criterion:** 5, 8
**File:** `e2e/purchase/permissions-api.spec.ts`

**Steps:**

1. As EDITOR PUT changed bales/total on an APPROVED purchase


    - expect: 200; PENDING, revisionNo 1

2. As EDITOR approve


    - expect: 403; stays PENDING

#### 6.6. Another organization's purchases cannot be listed, viewed, edited, approved or cancelled

**TestRail:** C58 · **Priority:** P1 · **Brief:** isolation 10
**File:** `e2e/purchase/isolation-api.spec.ts`

**Steps:**

1. Precondition: a second org with PENDING purchase Z. As demo ADMIN: list, GET, PUT, approve, cancel Z


    - expect: Not listed; 404 for each

2. Check Z as the other org


    - expect: Z, its stock and ledger unchanged

#### 6.7. Injecting another organization's company or item ids into a purchase is rejected without side effects

**TestRail:** C59 · **Priority:** P1 · **Brief:** isolation 10
**File:** `e2e/purchase/isolation-api.spec.ts`

**Steps:**

1. POST with the other org's companyId; POST with its item id; PUT adding its item


    - expect: 404/4xx each; nothing saved or changed

### 7. Edit and revisions

#### 7.1. Editing a PENDING purchase saves the changes and keeps it PENDING

**TestRail:** C21 · **Priority:** P1 · **Criterion:** 7
**File:** `e2e/purchase/edit.spec.ts`

**Steps:**

1. Setup: never-approved purchase 'handbags mixed' 5 × 20 kg × Rs 10 (1000). Open its edit page


    - expect: 'Update Purchase Order'; prefilled (total 1000, 5 bundles)

2. Bales 8; Sur Charge 40; new invoice


    - expect: Total 1640

3. Update Purchase


    - expect: Row shows new invoice, Sur Charge 40, total 1640, PENDING

4. Reload; GET


    - expect: PENDING, revisionNo 0, 8 bales, 1640

5. GET inventory and ledger


    - expect: Unchanged

#### 7.2. Removing and restoring items while editing a PENDING purchase saves only the kept items

**TestRail:** C22 · **Priority:** P2 · **Criterion:** 7
**File:** `e2e/purchase/edit.spec.ts`

**Steps:**

1. Remove 'ladies cotton tops'


    - expect: Row gone; bundles drop; 'Add Removed Items' enabled

2. Restore it via 'Add Removed Items' + Apply


    - expect: Row back; bundles restored

3. Remove again; Update; GET


    - expect: Only 'handbags mixed'; PENDING

#### 7.3. Editing an APPROVED purchase records a revision and returns it to PENDING

**TestRail:** C23 · **Priority:** P1 · **Criterion:** 8
**File:** `e2e/purchase/edit-approved.spec.ts`

**Steps:**

1. Setup: new item X; P approved: X 10 × 10 kg × Rs 5 (500), 'handbags mixed' 5 × 10 kg × Rs 10 (500), total 1000. Edit: X 15, 'handbags mixed' 3


    - expect: Total 1050

2. Update Purchase


    - expect: PENDING; approve/cancel icons back

3. Reload; GET


    - expect: revisionNo 1, total 1050; revisionDetails X +5, 'handbags mixed' -2, previous 10 and 5

- Does not assert stock/ledger while pending (open decision).

#### 7.4. Re-approving a revised purchase applies only the stock difference and adjusts the existing ledger entry

**TestRail:** C24 · **Priority:** P1 · **Criterion:** 8
**File:** `e2e/purchase/edit-approved.spec.ts`

**Steps:**

1. Record S_X, S_H, B0 before setup. Same setup as 7.3, revised (1050). Approve from the list


    - expect: APPROVED, revisionNo 1

2. GET inventory


    - expect: X = S_X + 15; 'handbags mixed' = S_H + 3

3. GET ledger


    - expect: Entry count unchanged; P's entry 1050; balance B0 + 1050

#### 7.5. Re-approving a revised purchase shifts later ledger balances by the change in total

**TestRail:** C25 · **Priority:** P1 · **Criterion:** 8
**File:** `e2e/purchase/edit-approved.spec.ts`

**Steps:**

1. P (3 days ago, 10 × 10 kg × Rs 10 = 1000) and Q (today, 400) approved; record T_Q, B. Revise P to 13 bales (1300), approve


    - expect: P 1300; Q T_Q + 300; balance B + 300; no new entries

2. Revise P to 9 bales (900), approve


    - expect: P 900; Q T_Q - 100; balance B - 100

#### 7.6. Editing a previously revised PENDING purchase saves the changes

**TestRail:** C26 · **Priority:** P1 · **Criterion:** 7 · **Expected to fail (D1)**
**File:** `e2e/purchase/edit-approved.spec.ts`

**Steps:**

1. Approved 10 × 10 kg × Rs 10 (1000), revised to 16 bales / 1600. Open edit page


    - expect: 16 bales

2. Change to 20 bales (2000); Update


    - expect: Row total 2000

3. GET


    - expect: 20 bales, 2000, PENDING

#### 7.7. A second revision applies only the new difference on re-approval

**TestRail:** C27 · **Priority:** P2 · **Criterion:** 8
**File:** `e2e/purchase/edit-approved.spec.ts`

**Steps:**

1. Record S_X, B. Approved X 10 × 10 kg × Rs 10 (1000); revised to 15 (1500) and approved. Revise to 12 (1200)


    - expect: PENDING, revisionNo 2

2. Approve


    - expect: APPROVED, revisionNo 2

3. GET inventory and ledger


    - expect: X = S_X + 12; one entry, 1200; balance B + 1200

#### 7.8. Approve, revise, edit again while pending, approve: latest values persist and stock moves relative to the last approved version

**TestRail:** C34 · **Priority:** P1 · **Brief:** revision cycle 3 · **Expected to fail (D1)**
**File:** `e2e/purchase/revision-cycle.spec.ts`

**Steps:**

1. Record S, B. Approved X 10 × 10 kg × Rs 10 (1000). Revise to 15 (1500)


    - expect: PENDING, revisionNo 1

2. Edit to 12 (1200); reload GET


    - expect: 12 bales, 1200

3. Approve; GET inventory and ledger


    - expect: X = S + 12; one entry 1200; balance B + 1200

4. Cycle: revise to 8 (800), edit to 9 (900), approve


    - expect: X = S + 9; entry 900; balance B + 900

5. Revision history


    - expect: Latest revision records -3 from the last approved version (12 → 9)

### 8. Revision matrix

All start from an approved purchase priced at 10 kg × Rs 10/kg per bale unless stated; record stock and balance B after the first approval.

#### 8.1. Re-approving a rate-only change adjusts the ledger and does not move stock

**TestRail:** C35 · **Priority:** P1 · **File:** `e2e/purchase/revision-matrix.spec.ts`

1. X 5 bales (500) → rate Rs 12/kg (600); approve


    - expect: X stock unchanged; entry 600; balance B + 100; no new entry

#### 8.2. Re-approving a surcharge-only change adjusts the ledger and does not move stock

**TestRail:** C36 · **Priority:** P2 · **File:** `e2e/purchase/revision-matrix.spec.ts`

1. X 5 bales, surcharge 0 (500) → surcharge 50 (550); approve


    - expect: Stock unchanged; entry 550; balance B + 50

#### 8.3. Re-approving a weight-only change adjusts the ledger and does not change on-hand bales

**TestRail:** C37 · **Priority:** P2 · **File:** `e2e/purchase/revision-matrix.spec.ts`

1. X 5 bales (500) → 12 kg per bale (600); approve


    - expect: On-hand unchanged; entry 600; balance B + 100

#### 8.4. Re-approving after adding an item posts stock only for the added item

**TestRail:** C38 · **Priority:** P1 · **File:** `e2e/purchase/revision-matrix.spec.ts`

1. X 5 (500) → add Y 4 bales (900); approve


    - expect: X unchanged; Y + 4; entry 900; balance B + 400

#### 8.5. Re-approving after removing an item reverses that item's posted stock

**TestRail:** C39 · **Priority:** P1 · **File:** `e2e/purchase/revision-matrix.spec.ts`

1. X 5 + Y 4 (900) → remove Y (500); approve


    - expect: Y - 4; X unchanged; entry 500; balance B - 400

#### 8.6. Re-approving with unchanged lines in a different order changes neither stock nor ledger

**TestRail:** C40 · **Priority:** P2 · **File:** `e2e/purchase/revision-matrix.spec.ts`

1. [X 5, Y 4] (900) → PUT [Y 4, X 5] (900); approve


    - expect: Stock unchanged; entry 900; balance B

### 9. Downstream activity and ledger reconciliation

#### 9.1. Correcting a purchase after some bales were sold keeps the sale and applies only the correction

**TestRail:** C41 · **Priority:** P1 · **File:** `e2e/purchase/downstream.spec.ts`

1. Approved X 10 bales (1000); sale of 2 bales of X created and approved via the sales API; record S (after sale), sale, customer ledger. Revise to 7 bales (700); approve


    - expect: X = S - 3; sale and customer ledger unchanged; purchase entry 700; supplier balance - 300

#### 9.2. Correcting a purchase after a supplier payment keeps the payment and shifts balances by the correction

**TestRail:** C42 · **Priority:** P1 · **File:** `e2e/purchase/downstream.spec.ts`

1. P approved (1000); supplier payment 300 dated after P via the ledger payment API (confirm payload against the ledger API/tests); record payment running balance T and B. Revise P to 12 bales (1200); approve


    - expect: Payment still 300 with running balance T + 200; P 1200; balance B + 200; no new entries

#### 9.3. Approving a backdated purchase updates the running balances of all later entries

**TestRail:** C43 · **Priority:** P1 · **File:** `e2e/purchase/ledger-reconcile.spec.ts`

1. Company with entries dated today; record running balances, B, and another supplier's balance. Approve a purchase dated 5 days ago (500)


    - expect: DEBIT 500 before later entries; each later running balance + 500; balance B + 500; every running balance = previous ± amount; other supplier unchanged

#### 9.4. Revising an older purchase reconciles running balances of entries on the same date

**TestRail:** C44 · **Priority:** P1 · **File:** `e2e/purchase/ledger-reconcile.spec.ts` · **May fail (same-date risk)**

1. P and Q same date, P approved first then Q (1000 each); record B. Revise P to 12 bales (1200); approve


    - expect: P 1200; Q running balance + 200; every running balance = previous ± amount; balance B + 200

### 10. Latest cost

#### 10.1. A new purchase defaults to the item's latest cost

**TestRail:** C45 · **Priority:** P2 · **File:** `e2e/purchase/latest-cost.spec.ts`

1. Item X at Rs 10/kg; purchase dated today at Rs 14/kg approved. Open /purchase/create and select X's company and type


    - expect: X defaults to Rs 14/kg

#### 10.2. Older purchases keep their recorded rates when the item cost changes

**TestRail:** C46 · **Priority:** P1 · **File:** `e2e/purchase/latest-cost.spec.ts`

1. A at Rs 10/kg approved; later B at Rs 14/kg approved. GET A and its view page and ledger entry


    - expect: A still Rs 10/kg, original total and ledger amount

#### 10.3. An explicitly entered purchase rate survives saving and reloading

**TestRail:** C47 · **Priority:** P2 · **File:** `e2e/purchase/latest-cost.spec.ts`

1. X default Rs 10/kg; create 2 × 10 kg at Rs 13/kg


    - expect: Total 260

2. Reload; edit page; GET


    - expect: Rs 13/kg, 260

### 11. Retry and concurrency

#### 11.1. Two simultaneous approvals of the same purchase post it exactly once

**TestRail:** C60 · **Priority:** P1 · **File:** `e2e/purchase/concurrency-api.spec.ts`

1. PENDING 5 bales (500); record S, B. Approve from two ADMIN contexts in parallel


    - expect: One 200, one 'already approved'; stock S + 5; one entry; balance B + 500

#### 11.2. Retrying an approval whose response was lost does not post it twice

**TestRail:** C61 · **Priority:** P2 · **File:** `e2e/purchase/concurrency.spec.ts`

1. Approve from the list with a route that forwards the request (route.fetch) and then aborts the response


    - expect: UI shows failure or no update

2. Reload; approve again


    - expect: Refused as already approved, or shows APPROVED

3. GET inventory and ledger


    - expect: S + 5; one entry; B + 500

#### 11.3. Approving two purchases for the same supplier and item at the same time keeps both postings

**TestRail:** C62 · **Priority:** P1 · **File:** `e2e/purchase/concurrency-api.spec.ts`

1. Two PENDING purchases of X: 5 bales (500), 3 bales (300); record S, B. Approve both in parallel


    - expect: 200 each; X = S + 8; two entries; B + 800; running balances reconcile

#### 11.4. An edit racing an approval never leaves an approved state that differs from the saved purchase

**TestRail:** C63 · **Priority:** P2 · **File:** `e2e/purchase/concurrency-api.spec.ts`

1. Never-approved P: 5 bales (500); record S, B. In parallel: PUT 8 bales (800) and approve


    - expect: If APPROVED, stock and ledger match P's saved values; if PENDING, nothing posted; the edit is saved or explicitly refused, never silently lost

### 12. Empty states

#### 12.1. Selecting a company with no items shows an empty items table and creation stays disabled

**TestRail:** C28 · **Priority:** P3 · **File:** `e2e/purchase/empty-states.spec.ts`

1. New company with no items; select it and BIG_BALES


    - expect: No rows; 'Create Purchase' disabled

#### 12.2. Searching a company with no purchases shows the empty list state

**TestRail:** C29 · **Priority:** P3 · **File:** `e2e/purchase/empty-states.spec.ts`

1. New company with no purchases; search it on /purchase


    - expect: 'No data' empty state, no error
