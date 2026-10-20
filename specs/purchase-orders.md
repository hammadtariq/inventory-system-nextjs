# Purchase Orders Regression Test Plan

## Application Overview

Regression coverage for Purchase Orders (brief: `specs/briefs/purchase-orders.md`) in the Drift Warehouse Demo org on a local DB (http://127.0.0.1:3100). Roles: ADMIN admin@trs.com (default storage state) and EDITOR warehouse@trs.com (log in during test setup with `DEMO_EDITOR_*_PASSWORD`). Out of scope: purchase reports/exports and cancelling an APPROVED purchase (open question with the QA lead).

TestRail section: "Purchase orders" (id 4). All cases are AI drafts until the QA lead approves them (Gate 1).

Key facts verified against the code and a live run:

- Endpoints: POST/GET /api/purchase, GET/PUT /api/purchase/{id}, PUT /api/purchase/approve/{id}, PUT /api/purchase/cancel/{id}. Inventory: GET /api/inventory (row id equals item id; fields onHand, noOfBales, baleWeightKgs). Ledger: GET /api/ledger/{companyId}?type=company returns {transactions[] (id, amount, spendType, totalBalance, runningBalance, transactionId = purchase id), totalBalance}.
- UI: list /purchase (columns Id, Company Name, Invoice Total Amount (Rs), Bale Type, Invoice Number, Sur Charge (Rs), Purchase Date, Updated At, Status, Action; company search box 'search company'); create /purchase/create; edit /purchase/{id}. The List Type dropdown shows the raw codes SMALL_BALES / BIG_BALES. After choosing company and list type the form lists ALL of that company's items of that type; fill No of Bales (required) and weights/rates via 'Edit All' then 'Save All'; drop rows with Remove / Remove Selected. SMALL_BALES also requires Rate Per Bale. 'Create Purchase' is disabled until company and list type are chosen, at least one row exists and 'Edit All' mode is closed. Server validation errors appear as a toast.
- Permissions (`data/permission.js`, `lib/authz.js`): purchase_approve is ADMIN only; purchase_edit is ADMIN and EDITOR. Approve (check) and cancel (cross) icons show only on PENDING rows for users with purchase_approve; every row has an edit (pencil) icon. Approve/cancel APIs return 403 'Operation not permitted.' for EDITOR.
- Seeded data (ids may differ; resolve by name and read before-values at runtime): company 'Ironwood Garments' (BIG_BALES items 'ladies cotton tops', 'handbags mixed'); a second company with its own BIG_BALES 'ladies cotton tops'; 'Ironwood Imports' (SMALL_BALES 'mixed winter jackets'). Every seeded item already has an inventory row, so "stock row created" needs a new item from POST /api/items ({companyId, itemName, type, ratePerKgs}), which creates no inventory row.
- antd pickers (Company, List Type, 'Add Removed Items', 'search company'): in specs use the helpers in `e2e/support/antd.ts`, e.g. `await antSelect(page, "Company", "Ironwood Garments")` and `antSelect(page, "List Type", "BIG_BALES")`. Don't use `getByRole("option", { name })` (it matches antd's hidden 0×0 listbox and hangs) or `getByLabel("Company")` / `getByLabel("List Type")` (these Form.Items have no `name`, so the label isn't linked). Agents driving the live browser: never click an `option` ref from the snapshot; click the field, type enough of the option text to make it unique, then press Enter. Lists are virtual (~10 rows rendered), so type to reach later options.
- Test data: create your own items/purchases via the API with unique invoice numbers/names (e.g. `QA-PO-<case>-<timestamp>`). Never mutate seeded purchases. No delete endpoint exists, so data accumulates.
- Purchase payload: {companyId, totalAmount, surCharge (nullable), invoiceNumber (nullable), purchaseDate (ISO), baleType 'SMALL_BALES'|'BIG_BALES', purchasedProducts: [{id, itemName (min 3 chars), noOfBales, baleWeightKgs, baleWeightLbs, ratePerKgs, ratePerLbs, ratePerBale}]}. totalAmount is supplied by the client; the server does not recompute it.

## Discrepancies found during exploration

- **D1 (bug against criterion 7):** editing a PENDING purchase that was previously revised (revisionNo > 0) returns 200 but saves nothing (`pages/api/purchase/[id].js` only updates when revisionNo is 0). Covered by C26, which is expected to fail. Draft a qa:gate-4 bug if it does.
- **D2:** the API accepts `purchasedProducts: []` and creates an empty PENDING purchase; only the UI blocks it. Not turned into a case (see below).
- **D3:** the API approves a CANCEL purchase (200; stock and ledger applied). The UI never offers it. Not turned into a case.
- **D4:** editing a CANCEL purchase is allowed and reopens it as PENDING. Not turned into a case.
- **D5:** the UI locks Invoice No and PO Date on APPROVED purchases, and Company and List Type on any edit; the PUT API enforces none of these.
- **D6:** criterion 1 says "Small or Big bales"; the UI shows SMALL_BALES / BIG_BALES.
- Approval also increments the inventory row's baleWeightKgs/Lbs; the criteria mention only on-hand stock.
- 404 messages differ in wording ('Purchase order does not exist' for approve/PUT, 'purchase order not exist' for GET/cancel).

## Left out of this plan

- **Need a decision from the QA lead first:** D2 (should the API reject an empty product list?), D3 (should approving a CANCEL purchase be refused?), D4 (should a CANCEL purchase be editable?), and cancelling an APPROVED purchase. Cases asserting current behaviour would lock in rules nobody has confirmed.
- **Not in the acceptance criteria:** company search filter on the list, PO date picker limits, item shape validation, 404/malformed ids, popconfirm "No", read-only view page, ADMIN icon matrix across statuses, zero-bale approval, unauthenticated access, UI field locks on edit.

## Test Scenarios

### 1. Create purchase order

**Seed:** `e2e/seed.spec.ts`

#### 1.1. ADMIN creates a purchase in the UI and it is saved as PENDING without touching stock or ledger

**TestRail:** C4 · **Priority:** P1 · **Criterion:** 1
**File:** `e2e/purchase/create.spec.ts`

**Steps:**

1. Record on-hand stock of 'handbags mixed' (GET /api/inventory) and the 'Ironwood Garments' ledger balance (GET /api/ledger/{companyId}?type=company). Open /purchase/create as ADMIN.

   - expect: Heading 'Create Purchase Order'; Total Amount and Total Bundle(s) show 0; 'Create Purchase' is disabled

2. Select company 'Ironwood Garments' and List Type BIG_BALES

   - expect: Items table lists only that company's BIG_BALES items ('handbags mixed', 'ladies cotton tops')

3. Remove 'ladies cotton tops'; Edit All; for 'handbags mixed' enter No of Bales 4, Bale Weight (KGS) 100, Rate Per (KGS) 2; Save All

   - expect: One row remains; Total Bundle(s) = 4; Total Amount equals the row total

4. Enter Invoice No 'QA-PO-C4-<ts>' and Sur Charge 50

   - expect: Total Amount rises by 50

5. Click 'Create Purchase'

   - expect: Redirected to /purchase; the new row shows Ironwood Garments, BIG_BALES, the invoice number, Sur Charge 50, Status PENDING

6. GET /api/inventory and GET /api/ledger/{companyId}?type=company

   - expect: Stock of 'handbags mixed' and the ledger balance are unchanged

#### 1.2. Purchase is saved without the optional invoice number and surcharge

**TestRail:** C5 · **Priority:** P2 · **Criterion:** 1
**File:** `e2e/purchase/create.spec.ts`

**Steps:**

1. On /purchase/create select 'Ironwood Garments', BIG_BALES, one item with 2 bales, 10 kgs, rate 2; leave Invoice No empty and Sur Charge at 0; click 'Create Purchase'

   - expect: Redirected to /purchase with no error toast

2. Check the new row and GET /api/purchase/{id}

   - expect: Status PENDING; invoiceNumber is null (list shows 'N/A')

#### 1.3. SMALL_BALES purchase is saved with several items and their rate per bale

**TestRail:** C6 · **Priority:** P2 · **Criterion:** 1
**File:** `e2e/purchase/create.spec.ts`

**Steps:**

1. Setup: create two SMALL_BALES items for 'Ironwood Imports' via POST /api/items (unique names). Open /purchase/create, select 'Ironwood Imports' and SMALL_BALES

   - expect: Items table has a 'Rate Per Bale' column and lists both new items

2. Remove the other rows; Edit All; item A: 3 bales, rate per bale 10; item B: 2 bales, rate per bale 20; Save All

   - expect: Total Bundle(s) = 5

3. Click 'Create Purchase', then GET /api/purchase/{id}

   - expect: Status PENDING, baleType SMALL_BALES; purchasedProducts has exactly the 2 items with the entered bales and ratePerBale

#### 1.4. API rejects a purchase containing an item from another company

**TestRail:** C7 · **Priority:** P1 · **Criterion:** 1
**File:** `e2e/purchase/create-api.spec.ts`

**Steps:**

1. Record the purchase count. POST /api/purchase for 'Ironwood Garments', BIG_BALES, with only the other company's 'ladies cotton tops'

   - expect: HTTP 404, message 'one or more purchased products were not found'

2. POST with one 'Ironwood Garments' item plus the other company's item

   - expect: HTTP 404 with the same message

3. GET /api/purchase

   - expect: Purchase count unchanged

#### 1.5. New purchase belongs to the signed-in user's organization

**TestRail:** C8 · **Priority:** P2 · **Criterion:** tenant safety (CLAUDE.md)
**File:** `e2e/purchase/create-api.spec.ts`

**Steps:**

1. Create a purchase via POST /api/purchase

   - expect: HTTP 200

2. GET /api/purchase/{id} and GET /api/purchase

   - expect: The new purchase and every listed purchase have the demo org's organizationId

### 2. Required fields and validation

**Seed:** `e2e/seed.spec.ts`

#### 2.1. Create form blocks saving until a company, bale type and at least one product are given

**TestRail:** C9 · **Priority:** P1 · **Criterion:** 2
**File:** `e2e/purchase/validation.spec.ts`

**Steps:**

1. Open /purchase/create with nothing selected

   - expect: 'Create Purchase' is disabled

2. Select only a company

   - expect: No items table; 'Create Purchase' still disabled

3. Select List Type BIG_BALES, then select all rows and click Remove Selected

   - expect: Items table is empty; 'Create Purchase' is disabled

#### 2.2. Submitting with item rows left unfilled shows the validation error and saves nothing

**TestRail:** C10 · **Priority:** P2 · **Criterion:** 2
**File:** `e2e/purchase/validation.spec.ts`

**Steps:**

1. Record the purchase count. On /purchase/create select 'Ironwood Garments' and BIG_BALES, fill no rows, click 'Create Purchase'

   - expect: Error toast 'ValidationError: "purchasedProducts[0].noOfBales" is required'; URL stays /purchase/create

2. GET /api/purchase

   - expect: Purchase count unchanged

#### 2.3. API rejects a purchase missing company, purchase date, bale type or products

**TestRail:** C11 · **Priority:** P1 · **Criterion:** 2
**File:** `e2e/purchase/validation-api.spec.ts`

**Steps:**

1. Record the purchase count. POST /api/purchase without companyId

   - expect: HTTP 400, message contains '"companyId" is required'

2. POST without purchaseDate

   - expect: HTTP 400, message contains '"purchaseDate" is required'

3. POST without baleType

   - expect: HTTP 400, message contains '"baleType" is required'

4. POST without purchasedProducts

   - expect: HTTP 400, message contains '"purchasedProducts" is required'

5. GET /api/purchase

   - expect: Purchase count unchanged

### 3. Approve and cancel

**Seed:** `e2e/seed.spec.ts`

#### 3.1. ADMIN approving a purchase raises item stock and adds one ledger DEBIT for the total

**TestRail:** C12 · **Priority:** P1 · **Criterion:** 3
**File:** `e2e/purchase/approve.spec.ts`

**Steps:**

1. Setup via API: record on-hand stock of 'handbags mixed' and 'ladies cotton tops', the 'Ironwood Garments' ledger balance B and entry count. Create PENDING purchase P for that company (BIG_BALES): 'handbags mixed' 5 bales, 'ladies cotton tops' 3 bales, totalAmount 1000. Open /purchase as ADMIN

   - expect: P's row is PENDING with approve, cancel and edit icons

2. Click P's approve (check) icon and confirm 'Yes' in 'Are you sure you want to approve?'

   - expect: Status becomes APPROVED; approve and cancel icons disappear

3. GET /api/inventory

   - expect: 'handbags mixed' on-hand = before + 5; 'ladies cotton tops' on-hand = before + 3

4. GET /api/ledger/{companyId}?type=company

   - expect: Exactly one new entry: transactionId = P, DEBIT, amount 1000; company balance = B + 1000

#### 3.2. Approving a purchase creates a stock row for an item that had none

**TestRail:** C13 · **Priority:** P1 · **Criterion:** 3
**File:** `e2e/purchase/approve.spec.ts`

**Steps:**

1. Setup via API: POST /api/items {companyId: 'Ironwood Garments', itemName: 'qa new item <ts>', type: 'BIG_BALES', ratePerKgs: 2}; create a PENDING purchase with that item, 7 bales, totalAmount 500. GET /api/inventory

   - expect: No row exists for the new item

2. PUT /api/purchase/approve/{id}

   - expect: HTTP 200

3. GET /api/inventory

   - expect: A row exists for the new item with on-hand 7

#### 3.3. Approving an already approved purchase is refused and changes nothing

**TestRail:** C14 · **Priority:** P1 · **Criterion:** 4
**File:** `e2e/purchase/approve-api.spec.ts`

**Steps:**

1. Setup via API: create and approve a purchase; record its item's stock and the company ledger balance and entry count. PUT /api/purchase/approve/{id} again

   - expect: HTTP 400, message 'Purchase order already approved'

2. GET /api/inventory and GET /api/ledger/{companyId}?type=company

   - expect: Stock, balance and entry count equal the recorded values

#### 3.4. ADMIN cancelling a PENDING purchase sets status CANCEL without changing stock or ledger

**TestRail:** C15 · **Priority:** P1 · **Criterion:** 6
**File:** `e2e/purchase/cancel.spec.ts`

**Steps:**

1. Setup via API: PENDING purchase for 'Ironwood Garments' ('handbags mixed', 5 bales, total 800); record that item's stock and the ledger balance. On /purchase click the row's cancel (cross) icon and confirm 'Yes' in 'Are you sure for cancel?'

   - expect: Status becomes CANCEL; approve and cancel icons disappear

2. GET /api/purchase/{id}

   - expect: status CANCEL

3. GET /api/inventory and the company ledger

   - expect: Stock and ledger balance unchanged

### 4. Permissions per role

**Seed:** `e2e/seed.spec.ts`

#### 4.1. EDITOR sees no approve or cancel actions on the purchase list

**TestRail:** C16 · **Priority:** P1 · **Criterion:** 5
**File:** `e2e/purchase/permissions.spec.ts`

**Steps:**

1. Setup: PENDING purchase created via API as ADMIN. Log in as warehouse@trs.com (EDITOR) and open /purchase

   - expect: The PENDING purchase is listed

2. Look at the row's Action cell

   - expect: Only the edit (pencil) icon; no approve (check) or cancel (cross) icon

#### 4.2. EDITOR creates a purchase and it is saved as PENDING

**TestRail:** C17 · **Priority:** P1 · **Criterion:** 5
**File:** `e2e/purchase/permissions.spec.ts`

**Steps:**

1. As EDITOR, on /purchase/create select 'Ironwood Garments', BIG_BALES, one item with 3 bales, 10 kgs, rate 2; Save All; click 'Create Purchase'

   - expect: Redirected to /purchase; new row Status PENDING

2. GET /api/inventory and the company ledger

   - expect: Stock and ledger unchanged

#### 4.3. EDITOR edits a PENDING purchase and it stays PENDING

**TestRail:** C18 · **Priority:** P1 · **Criterion:** 5, 7
**File:** `e2e/purchase/permissions.spec.ts`

**Steps:**

1. Setup: PENDING purchase via API. As EDITOR click the row's pencil icon; set Sur Charge 25 and change an item's bales; Save All; click 'Update Purchase'

   - expect: Redirected to /purchase; row shows Sur Charge 25 and the new total; Status PENDING

#### 4.4. API refuses approve and cancel requests from an EDITOR

**TestRail:** C19 · **Priority:** P1 · **Criterion:** 5
**File:** `e2e/purchase/permissions-api.spec.ts`

**Steps:**

1. Setup: PENDING purchase created via API as ADMIN; record stock and ledger balance. With a request context signed in as EDITOR: PUT /api/purchase/approve/{id}

   - expect: HTTP 403, message 'Operation not permitted.'

2. As EDITOR: PUT /api/purchase/cancel/{id}

   - expect: HTTP 403, message 'Operation not permitted.'

3. As ADMIN: GET /api/purchase/{id}, inventory and ledger

   - expect: Status still PENDING; stock and ledger unchanged

#### 4.5. EDITOR can revise an APPROVED purchase but cannot re-approve it

**TestRail:** C20 · **Priority:** P2 · **Criterion:** 5, 8
**File:** `e2e/purchase/permissions-api.spec.ts`

**Steps:**

1. Setup: purchase created and approved via API as ADMIN. As EDITOR PUT /api/purchase/{id} with a changed noOfBales and totalAmount

   - expect: HTTP 200; GET shows status PENDING, revisionNo 1

2. As EDITOR PUT /api/purchase/approve/{id}

   - expect: HTTP 403; status stays PENDING

### 5. Edit purchase

**Seed:** `e2e/seed.spec.ts`

#### 5.1. Editing a PENDING purchase saves the changes and keeps it PENDING

**TestRail:** C21 · **Priority:** P1 · **Criterion:** 7
**File:** `e2e/purchase/edit.spec.ts`

**Steps:**

1. Setup via API: PENDING purchase for 'Ironwood Garments': 'handbags mixed' 5 bales, total 1000, invoice 'QA-PO-C21-<ts>'; record stock and ledger balance. As ADMIN on /purchase click the row's pencil icon

   - expect: URL /purchase/{id}; heading 'Update Purchase Order'; fields prefilled (invoice, total 1000, 5 bundles)

2. Edit All; change bales to 8; Save All; set Sur Charge 40 and a new invoice number; click 'Update Purchase'

   - expect: Redirected to /purchase; row shows the new invoice, Sur Charge 40, Status PENDING

3. GET /api/purchase/{id}

   - expect: status PENDING, revisionNo 0, purchasedProducts[0].noOfBales 8

4. GET /api/inventory and the company ledger

   - expect: Unchanged

#### 5.2. Removing and restoring items while editing a PENDING purchase saves only the kept items

**TestRail:** C22 · **Priority:** P2 · **Criterion:** 7
**File:** `e2e/purchase/edit.spec.ts`

**Steps:**

1. Setup via API: PENDING purchase with 'handbags mixed' and 'ladies cotton tops'. Open its edit page; select 'ladies cotton tops' and click Remove Selected

   - expect: Row disappears; Total Bundle(s) drops by its bales; 'Add Removed Items' becomes enabled

2. Choose it in 'Add Removed Items' and click Apply

   - expect: Row returns; Total Bundle(s) restored

3. Remove it again, click 'Update Purchase', then GET /api/purchase/{id}

   - expect: purchasedProducts contains only 'handbags mixed'; status PENDING

#### 5.3. Editing an APPROVED purchase records a revision and returns it to PENDING

**TestRail:** C23 · **Priority:** P1 · **Criterion:** 8
**File:** `e2e/purchase/edit-approved.spec.ts`

**Steps:**

1. Setup via API: create a new item X for 'Ironwood Garments' (POST /api/items); create and approve purchase P with X 10 bales and 'handbags mixed' 5 bales, total 1000; record both items' stock and the ledger balance. As ADMIN on /purchase click P's pencil icon; Edit All; X bales 15, 'handbags mixed' bales 3; Save All; click 'Update Purchase'

   - expect: Redirected to /purchase; P's Status is PENDING and approve/cancel icons are shown again

2. GET /api/purchase/{id}

   - expect: status PENDING, revisionNo 1; revisionDetails.purchasedProducts = [{X, noOfBales 5}, {'handbags mixed', noOfBales -2}] and revisionDetails.previousPurchasedProducts holds 10 and 5

3. GET /api/inventory and the company ledger

   - expect: Stock and ledger unchanged until re-approval

#### 5.4. Re-approving a revised purchase applies only the stock difference and adjusts the existing ledger entry

**TestRail:** C24 · **Priority:** P1 · **Criterion:** 8
**File:** `e2e/purchase/edit-approved.spec.ts`

**Steps:**

1. Setup via API: P approved (X 10, 'handbags mixed' 5, total 1000), then revised to X 15, 'handbags mixed' 3, total 1500 (PENDING, revisionNo 1). Record stock S_X, S_H, ledger balance B and entry count N. As ADMIN approve P from the list (check icon, 'Yes')

   - expect: Status APPROVED; revisionNo still 1

2. GET /api/inventory

   - expect: X on-hand = S_X + 5; 'handbags mixed' on-hand = S_H - 2

3. GET /api/ledger/{companyId}?type=company

   - expect: Entry count still N; P's entry amount is 1500 (was 1000); company balance = B + 500

#### 5.5. Re-approving a revised purchase shifts later ledger balances by the change in total

**TestRail:** C25 · **Priority:** P1 · **Criterion:** 8
**File:** `e2e/purchase/edit-approved.spec.ts`

**Steps:**

1. Setup via API for the second seeded company: purchase P dated 3 days ago, total 1000, approved; purchase Q dated today, total 400, approved. Record Q's ledger running balance T_Q, the company balance B and the entry count. Revise P to total 1300 (PUT /api/purchase/{P}) and approve it

   - expect: P's ledger entry amount 1300; Q's balance = T_Q + 300; company balance = B + 300; entry count unchanged

2. Revise P to total 900 and approve it

   - expect: P's entry amount 900; Q's balance = T_Q - 100; company balance = B - 100; entry count unchanged

#### 5.6. Editing a previously revised PENDING purchase saves the changes

**TestRail:** C26 · **Priority:** P1 · **Criterion:** 7 · **Expected to fail (D1)**
**File:** `e2e/purchase/edit-approved.spec.ts`

**Steps:**

1. Setup via API: purchase approved, then revised to 16 bales / total 1600 (PENDING, revisionNo >= 1). As ADMIN open its edit page

   - expect: Form shows 16 bales

2. Change bales to 20 (total 2000) and click 'Update Purchase'

   - expect: Redirected to /purchase; row shows total 2000

3. GET /api/purchase/{id}

   - expect: noOfBales 20, totalAmount 2000, status PENDING. Currently the API returns 200 but keeps 16 / 1600. Do not weaken the assertion; draft a qa:gate-4 bug.

#### 5.7. A second revision applies only the new difference on re-approval

**TestRail:** C27 · **Priority:** P2 · **Criterion:** 8
**File:** `e2e/purchase/edit-approved.spec.ts`

**Steps:**

1. Setup via API: record X stock S_X and the company balance B; create and approve a purchase with item X 10 bales / total 1000; revise to 15 / 1500 and approve (revisionNo 1). Revise again to X 12 bales / total 1200

   - expect: Status PENDING, revisionNo 2

2. Approve it

   - expect: Status APPROVED, revisionNo 2

3. GET /api/inventory and the company ledger

   - expect: X stock = S_X + 12; the purchase still has exactly one ledger entry, amount 1200; company balance = B + 1200

### 6. Empty states

**Seed:** `e2e/seed.spec.ts`

#### 6.1. Selecting a company with no items shows an empty items table and creation stays disabled

**TestRail:** C28 · **Priority:** P3 · **Criterion:** 2
**File:** `e2e/purchase/empty-states.spec.ts`

**Steps:**

1. Setup: new company with no items via POST /api/company. On /purchase/create select that company and BIG_BALES

   - expect: Items table has no rows; 'Create Purchase' is disabled

#### 6.2. Searching a company with no purchases shows the empty list state

**TestRail:** C29 · **Priority:** P3 · **Criterion:** list empty state
**File:** `e2e/purchase/empty-states.spec.ts`

**Steps:**

1. Setup: new company with no purchases via POST /api/company. On /purchase type the company in 'search company' and choose it

   - expect: Table shows the 'No data' empty state and no error
