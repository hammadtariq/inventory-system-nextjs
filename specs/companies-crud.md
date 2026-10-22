# Companies (Suppliers) CRUD Regression Test Plan

## Application Overview

Regression coverage for supplier companies (brief: `specs/briefs/companies-crud.md`) in the Drift Warehouse Demo org on a local DB (http://127.0.0.1:3100). Roles: ADMIN admin@trs.com (default storage state) and EDITOR warehouse@trs.com (log in during test setup with `DEMO_EDITOR_*_PASSWORD`, `loginAs` in `e2e/support/purchase-api.ts`). Out of scope: items CRUD beyond owner decision Q2, supplier ledger maths (purchase cases), company reports.

**The cases live in `specs/cases/companies-crud.csv`**, one row per case: review and edit them there, then run `node .qa/scripts/cases.mjs plan specs/cases/companies-crud.csv` to regenerate the Test Scenarios block below. Everything else in this file is written by hand.

Owner decisions (brief, 2026-10-22): Q1 no delete while any purchase, stock row, ledger or payment entry references the supplier; Q2 item delete is ADMIN-only and refused while the item is in a purchase or has stock; Q3 names unique per organization regardless of case and surrounding spaces; Q4 staff can clear an optional field; Q5 names saved lowercase from the form is fine.

Key facts verified against the code and a live run (2026-10-22):

- Endpoints: POST/GET `/api/company` (GET takes `limit`, `offset`, `attributes` JSON, ordered by updatedAt DESC), GET `/api/company/search?value=` (`LIKE`, case-sensitive), GET/PUT/DELETE `/api/company/{id}`. Pickers on /purchase/create, /items/create and /ledger/create load `/api/company?attributes=["companyName","id"]`; the items list and the purchase/sales reports use `/search`.
- Joi: name min 3 (required on create), phone max 24, email valid, address min 10; values are trimmed; unknown keys (`organizationId`, `uuid`) are refused with 400. Empty string and `null` are refused for every optional field.
- Messages: duplicate 409 `Company "X" already exists in this organization.`; 404 `company not exist` (GET), `company not found` (PUT), `company does not exist` (DELETE); delete with items is refused with **HTTP 404** `N items exist against this company. Please remove dependencies first.`
- The form lowercases every value (name, email, address) before saving. Its validation messages: `'companyName' must be at least 3 characters`, `Email is not a valid email!`, `'phone' cannot be longer than 24 characters`, `'address' must be at least 10 characters`. Server errors show as a toast with the raw message.
- List /company: columns Company Name (with a search filter), Email, Address, Phone, Updated At, Action (Delete with an "Are you sure?" Yes/No popconfirm, Edit). Empty fields show "N/A". 50 rows per page.
- Three concurrent creates of one name give one 200 and two 409.
- Test data: create your own suppliers via the API with unique names (`uid()` from `e2e/support/purchase-api.ts`). Never rename or delete seeded suppliers. The purchase suite leaves ~100 `qa-po-*` companies per run in the local DB, so always look a supplier up by its unique name, never by list position.

How to write these tests:

- One test per case; journeys use one `test.step` per numbered step; data-table cases loop over rows with one `test.step` per row.
- Known-bug cases (CO-04, CO-06, CO-07, CO-10, CO-12) start with `test.fixme(!runKnownBugs, "Known bug: ...")`. Never weaken their assertions.
- Reach the create and edit forms through the list's buttons (client navigation) everywhere except CO-07, which is the only case that loads them directly.

## Known risks and discrepancies

- **No role check on DELETE (AC6):** `pages/api/company/[id].js` lets an EDITOR delete a supplier. CO-12 is expected to fail.
- **Delete only counts items (Q1):** a supplier with purchases or payments and no items is deleted; `purchase_histories` cascade on company delete, and purchases, stock rows and ledger rows keep a dangling `companyId` (no FK). Item delete has no role or dependency check (Q2). CO-10 is expected to fail.
- **Case-sensitive uniqueness (Q3):** the unique index and the 409 checks compare names exactly. The local DB already holds `qa-plan-alpha`, `qa-plan-Alpha` and `QA-PLAN-ALPHA`. CO-04 is expected to fail.
- **Empty optional fields can't be saved (Q4):** the edit form sends `null`/`""` and Joi rejects both, so a supplier without a phone can't be edited from the UI at all. CO-06 is expected to fail.
- **Create/Update disabled on a direct page load (new):** `canCreate`/`canEdit` in `components/addEditCompany.js` are computed at module load, before `_app.js` sets the permissions. CO-07 is expected to fail.
- Delete-with-items is refused with HTTP 404 rather than 409 (CO-09 asserts the message only).

## Left out of this plan

- Search is case-sensitive (`LIKE`), so on the items list "coastal" won't find "Coastal Traders". Not in the brief: raised as an open question.
- The search value isn't escaped (`%`, `_` act as wildcards), and a malformed `attributes` query gives a 500. No business impact found.
- The lowercasing of email and address by the form (owner Q5 covers names; assumed fine for the rest).
- Company reports, items CRUD, supplier ledger maths: out of scope per the brief.

## Test Scenarios

**Seed for all suites:** `e2e/seed.spec.ts`

<!-- cases:start (generated from the cases CSV by .qa/scripts/cases.mjs; edit the CSV, not this block) -->

### 1. Create and edit

#### 1.1. Staff add a supplier in the form and it is ready to buy from: listed, and offered in the purchase, item and payment company pickers

**TestRail:** — (not pushed yet) · **Key:** CO-01 · **Priority:** P1 · **Type:** Regression · **Risks:** 1 · **Source:** AC1
**File:** `e2e/company/create.spec.ts`
**Why it matters:** a supplier that is saved but missing from the purchase or payment pickers can't be bought from or paid, so the supplier ledger can't start.

**Preconditions:** Signed in as ADMIN (admin@trs.com), Drift Warehouse Demo org seeded. EDITOR session via loginAs(warehouse@trs.com, DEMO_EDITOR\_\* password). Unique name per run, e.g. 'QA Zeta Supplies <uid>'.

**Steps:**

1. As the role in the row, open /company and click Create (client navigation; see CO-07 for direct loads)
   - expect: Create form opens with an enabled Create button
2. Fill Name, Email 'Zeta@Vendor.com', Phone '+92 300 1234567', Address 'Plot 12, Shershah Road, Karachi' and click Create
   - expect: Redirected to /company; the new row is first, showing the name, email, address and phone (lowercased, owner Q5)
3. GET /api/company/search?value=<lowercased name>
   - expect: Exactly one company: companyName '<name lowercased>', email 'zeta@vendor.com', phone '+92 300 1234567', address 'plot 12, shershah road, karachi'
4. Open /purchase/create, /items/create and /ledger/create (Pay To: company) and type the name in each company picker
   - expect: The supplier is offered in all three pickers

| role   |
| ------ |
| ADMIN  |
| EDITOR |

- Use antSelect / antSelectByPlaceholder from e2e/support/antd.ts for the pickers.
- The form lowercases every value before saving (owner Q5: acceptable), so assert lowercased values.

#### 1.2. A supplier with a missing or short name, a malformed email, an over-long phone or a short address is refused in the form and at the API, and nothing is saved

**TestRail:** — (not pushed yet) · **Key:** CO-02 · **Priority:** P2 · **Type:** Functional · **Source:** AC2
**File:** `e2e/company/validation.spec.ts`
**Why it matters:** an unidentifiable supplier record (no name, a bad contact) leads to purchases and payments booked against the wrong party.

**Preconditions:** Signed in as ADMIN (admin@trs.com), Drift Warehouse Demo org seeded. Record the company count (GET /api/company).

**Steps:**

1. For each row: open the create form, enter the row's value with an otherwise valid company and leave the field
   - expect: The field shows the row's form message and the Create button does not save
2. For each row: POST /api/company with the same value
   - expect: 400 with the row's API message
3. GET /api/company
   - expect: Company count unchanged

| field   | value        | form message                                | API message                                                     |
| ------- | ------------ | ------------------------------------------- | --------------------------------------------------------------- |
| Name    | (empty)      | 'companyName' is required                   | "companyName" is required                                       |
| Name    | ab           | 'companyName' must be at least 3 characters | "companyName" length must be at least 3 characters long         |
| Email   | not-an-email | Email is not a valid email!                 | "email" must be a valid email                                   |
| Phone   | 25 digits    | 'phone' cannot be longer than 24 characters | "phone" length must be less than or equal to 24 characters long |
| Address | short        | 'address' must be at least 10 characters    | "address" length must be at least 10 characters long            |

- Messages observed on 2026-10-22; the empty-name form message wasn't observed live, confirm it in the generated test.
- Boundaries that must pass: name of 3 characters, phone of 24, address of 10.

#### 1.3. Renaming a supplier and changing its contact details keeps its purchases, items, stock and ledger attached, now under the new name

**TestRail:** — (not pushed yet) · **Key:** CO-05 · **Priority:** P1 · **Type:** Regression · **Risks:** 1, 2, 5 · **Source:** AC4
**File:** `e2e/company/edit.spec.ts`
**Why it matters:** if a rename detached history, the supplier's balance and stock would vanish from the statement the owner pays from.

**Preconditions:** Signed in as ADMIN (admin@trs.com), Drift Warehouse Demo org seeded. EDITOR session via loginAs(warehouse@trs.com, DEMO_EDITOR\_\* password). Via the API (ADMIN): supplier S 'QA Rename Old <uid>' with phone and address, item I of S, an APPROVED purchase of 5 bales at Rs 100/bale (total 500) and a payment of Rs 200 to S (payCompany). Record S's ledger balance (300) and entry count (2), I's on-hand (5).

**Steps:**

1. As EDITOR, open /company, click Edit on S, change Name to 'QA Rename New <uid>', Email to 'new@vendor.com' and Address to '45 Mill Road, Faisalabad', click Update
   - expect: Redirected to /company; the row shows the new name and details
2. GET /api/company/{S}
   - expect: Same id; new name (lowercased), email and address; phone unchanged
3. Open /purchase and search the new name; open /items filtered by the new name; GET /api/inventory for I
   - expect: The purchase (total 500, APPROVED) lists the new name; I belongs to the new name; on-hand still 5
4. Open the supplier ledger for S (GET /api/ledger/{S}?type=company and the ledger screen)
   - expect: Still 2 entries and balance 300, under the new name
5. Type the new and the old name in the /purchase/create company picker
   - expect: The new name is offered; the old name no longer is

- EDITOR is used because staff maintain suppliers; ADMIN edit is covered by the same code path.
- If CO-06 is still open, give S an email, phone and address so the form doesn't send null.

#### 1.4. Staff can save a supplier whose email, phone or address is empty, and can clear one of those fields

**TestRail:** — (not pushed yet) · **Key:** CO-06 · **Priority:** P2 · **Type:** Functional · **Source:** AC4, owner Q4; dirty path: empty optional fields · **Expected to fail (Q4): the edit form sends null for empty fields and "" for cleared ones, and the PUT Joi schema rejects both. Confirmed 2026-10-22: Update on a company with empty fields shows the toast 'ValidationError: "phone" must be a string'; PUT { email: '' } returns 400 'not allowed to be empty'.**
**File:** `e2e/company/edit.spec.ts`
**Why it matters:** a supplier created without a phone can't be edited at all today, so staff can't correct its name or details and work around it with a duplicate supplier.

**Preconditions:** Signed in as ADMIN (admin@trs.com), Drift Warehouse Demo org seeded. Via the API: supplier E 'QA Empty Fields <uid>' with no email, phone or address, and supplier F 'QA Full Fields <uid>' with all three.

**Steps:**

1. Open E via the list's Edit button, change only the Name to 'QA Empty Fields Renamed <uid>' and click Update
   - expect: Saved; redirected to /company; no error toast
2. Open F via the list's Edit button, clear Email, Phone and Address and click Update
   - expect: Saved; F's row shows N/A for email, address and phone
3. GET /api/company/{E} and /api/company/{F}
   - expect: E has the new name; F's email, phone and address are empty
4. PUT /api/company/{F} with { email: null } and with { phone: '' }
   - expect: 200 for both; the field stays empty

- Assert the refusal message isn't the raw Joi text once fixed; until then the toast is what users see.

#### 1.5. Opening the create or edit page directly (refresh, bookmark, new tab) gives ADMIN and EDITOR a working Create or Update button

**TestRail:** — (not pushed yet) · **Key:** CO-07 · **Priority:** P2 · **Type:** Functional · **Source:** Found during exploration · **Expected to fail (new, 2026-10-22): canCreate/canEdit in components/addEditCompany.js are computed at module load, before \_app.js sets the user's permissions, so on a direct load the button is disabled for ADMIN. Reaching the page through the list's buttons works. Open question for the owner/dev: same pattern likely on other forms.**
**File:** `e2e/company/create.spec.ts`
**Why it matters:** staff who refresh or open a supplier link in a new tab can't save, and either lose their typing or give up on the change.

**Preconditions:** Signed in as ADMIN (admin@trs.com), Drift Warehouse Demo org seeded. EDITOR session via loginAs(warehouse@trs.com, DEMO_EDITOR\_\* password). Via the API: supplier S 'QA Direct Load <uid>' with all fields.

**Steps:**

1. page.goto('/company/create'), fill a valid new supplier and click Create
   - expect: Create is enabled; the supplier is saved
2. page.goto('/company/{S}'), change the Phone and click Update
   - expect: Update is enabled; the phone is saved
3. Reload /company/{S} and check the Update button
   - expect: Update is still enabled

| role   |
| ------ |
| ADMIN  |
| EDITOR |

### 2. Unique names

#### 2.1. A second supplier with the same name is refused on create and rename, even with surrounding spaces or a double-click; another organization may use the name

**TestRail:** — (not pushed yet) · **Key:** CO-03 · **Priority:** P1 · **Type:** Functional · **Risks:** 1, 3 · **Source:** AC3, AC4; dirty paths: spacing, double-click Create
**File:** `e2e/company/unique-names.spec.ts`
**Why it matters:** two suppliers with one name split purchases and payments across two ledgers, so the owner can't tell what they owe that supplier.

**Preconditions:** Signed in as ADMIN (admin@trs.com), Drift Warehouse Demo org seeded. Via the API: supplier A 'QA Coastal Traders <uid>' and supplier B 'QA Harbor Mills <uid>'. A second organization from createOtherOrg (e2e/support/second-org.ts).

**Steps:**

1. POST /api/company with the row's name
   - expect: 409 'Company "<A>" already exists in this organization.'
2. PUT /api/company/{B} with companyName = A's name
   - expect: 409 with the same message; B keeps its name
3. Fire three POST /api/company 'QA Race Supplies <uid>' at once (and double-click Create in the form with another new name)
   - expect: Exactly one 200, the others 409; one company with that name; the form double-click creates one company
4. Insert a company with A's exact name into the second organization
   - expect: Insert succeeds
5. GET /api/company/search?value=<A's name>
   - expect: This organization still has exactly one A

| row                | name sent                    |
| ------------------ | ---------------------------- |
| exact              | QA Coastal Traders <uid>     |
| surrounding spaces | ' QA Coastal Traders <uid> ' |

- Case differences are CO-04 (known bug), kept apart so this case stays green.

#### 2.2. A supplier name that differs only in letter case from an existing one is refused, from the form and the API

**TestRail:** — (not pushed yet) · **Key:** CO-04 · **Priority:** P1 · **Type:** Functional · **Risks:** 1 · **Source:** AC3, owner Q3 · **Expected to fail (Q3): the unique index (organizationId, companyName) and the 409 checks in pages/api/company/index.js and [id].js compare names exactly. Confirmed 2026-10-22: 'qa probe traders' was accepted next to 'QA Probe Traders'; the local DB already holds 'qa-plan-alpha', 'qa-plan-Alpha' and 'QA-PLAN-ALPHA' side by side.**
**File:** `e2e/company/unique-names.spec.ts`
**Why it matters:** the form saves names lowercase, so 'Coastal Traders' and 'coastal traders' become two suppliers with split ledgers; owner Q3 says names are unique regardless of case.

**Preconditions:** Signed in as ADMIN (admin@trs.com), Drift Warehouse Demo org seeded. Via the API: supplier 'QA Coastal Traders <uid>' (mixed case, as seeded and API-created suppliers are) and supplier B 'QA Harbor Mills <uid>'.

**Steps:**

1. In the form (via the list's Create button), create 'QA Coastal Traders <uid>' (the form lowercases it)
   - expect: Refused with 'Company "…" already exists in this organization.'; no new row
2. POST /api/company 'QA COASTAL TRADERS <uid>'
   - expect: 409, same message
3. PUT /api/company/{B} with companyName 'qa coastal traders <uid>'
   - expect: 409; B keeps its name
4. GET /api/company/search for the name in every case
   - expect: Exactly one supplier with that name in any case

- When fixed, existing case-duplicates in production data need a merge decision before a case-insensitive unique index can be added.

### 3. Delete

#### 3.1. The owner can delete a supplier with no history; it disappears from the list and every picker, and its id then gives 404

**TestRail:** — (not pushed yet) · **Key:** CO-08 · **Priority:** P1 · **Type:** Functional · **Risks:** 4 · **Source:** AC5
**File:** `e2e/company/delete.spec.ts`
**Why it matters:** suppliers created by mistake must go away cleanly, without leaving a ghost in the pickers that staff could buy from.

**Preconditions:** Signed in as ADMIN (admin@trs.com), Drift Warehouse Demo org seeded. Via the API: supplier D 'QA Delete Me <uid>' with no items, purchases or payments.

**Steps:**

1. On /company, click Delete on D, then 'No' in the confirmation
   - expect: D is still listed
2. Click Delete on D, then 'Yes'
   - expect: D is no longer listed (after the list refresh)
3. GET /api/company/{D}; type the name in the /purchase/create company picker
   - expect: 404 'company not exist'; the picker doesn't offer D

#### 3.2. A supplier that still has items can't be deleted, and its items, stock and ledger stay intact

**TestRail:** — (not pushed yet) · **Key:** CO-09 · **Priority:** P1 · **Type:** Regression · **Risks:** 1, 2, 5 · **Source:** AC5
**File:** `e2e/company/delete.spec.ts`
**Why it matters:** deleting a supplier that has items would orphan its stock and purchase history.

**Preconditions:** Signed in as ADMIN (admin@trs.com), Drift Warehouse Demo org seeded. Via the API: supplier S 'QA Has Items <uid>' with 2 items and an APPROVED purchase of 3 bales (stockedItem). Record S's ledger balance and entry count.

**Steps:**

1. On /company, click Delete on S and confirm
   - expect: Error toast '2 items exist against this company. Please remove dependencies first.'; S still listed
2. DELETE /api/company/{S}
   - expect: Refused with the same message
3. GET /api/company/{S}, its items, stock and ledger
   - expect: S, both items, on-hand 3 and the ledger (balance and entry count) unchanged

- Today the refusal is HTTP 404. Assert the message and that nothing changed; don't pin the status (a 409 would be more accurate, see open questions).

#### 3.3. A supplier with purchases or payments can't be deleted even when it has no items, and its ledger and purchase history stay intact

**TestRail:** — (not pushed yet) · **Key:** CO-10 · **Priority:** P1 · **Type:** Regression · **Risks:** 1, 5 · **Source:** Business rules; owner Q1, Q2; dirty paths: delete with history, delete items first · **Expected to fail (Q1, Q2): deleteCompany only counts items; there's no FK from purchases, inventories or ledgers to companies, and purchase_histories cascade on company delete. Item delete has no dependency or role check.**
**File:** `e2e/company/delete.spec.ts`
**Why it matters:** deleting such a supplier silently removes what the business owes it: purchase revision history is cascade-deleted and purchases and ledger rows point at a company that no longer exists.

**Preconditions:** Signed in as ADMIN (admin@trs.com), Drift Warehouse Demo org seeded. Via the API, per row: a new supplier set up as the row describes. Record its ledger entries, purchases and purchase history.

**Steps:**

1. Set up the row's supplier
   - expect: Setup succeeds
2. DELETE /api/company/{id} (and, for the item row, first DELETE /api/items/{itemId})
   - expect: Company delete refused with a dependency message; item delete refused because the item is in a purchase (owner Q2)
3. GET the supplier, its purchases (GET /api/purchase), purchase history and ledger (GET /api/ledger/{id}?type=company)
   - expect: Supplier, purchases, history and ledger unchanged

| row                 | setup                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| payment only        | supplier with one Rs 500 payment (payCompany), no items or purchases                                    |
| items deleted first | supplier with an item and an APPROVED, then revised purchase; ADMIN deletes the item, then the supplier |

- Each row needs its own supplier. Check the database for orphans in the item row (purchases.companyId and ledgers.companyId pointing at the deleted id).

### 4. Permissions and isolation

#### 4.1. Staff can't delete a supplier: the Delete button is disabled for EDITOR and creating, editing and listing still work

**TestRail:** — (not pushed yet) · **Key:** CO-11 · **Priority:** P1 · **Type:** Security · **Risks:** 4 · **Source:** AC6
**File:** `e2e/company/permissions.spec.ts`
**Why it matters:** deleting suppliers is the owner's call; staff should prepare and maintain records, not remove them.

**Preconditions:** EDITOR session via loginAs(warehouse@trs.com, DEMO_EDITOR\_\* password). Via the API (ADMIN): supplier S 'QA Staff View <uid>'.

**Steps:**

1. As EDITOR, open /company and find S
   - expect: S's Delete button is disabled; Edit is enabled; the Create button is shown
2. Click Edit on S
   - expect: The edit form opens with an enabled Update button

- The API side of the rule is CO-12 (known bug), kept apart so this case stays green.

#### 4.2. The API refuses a staff (EDITOR) request to delete a supplier, and the supplier stays

**TestRail:** — (not pushed yet) · **Key:** CO-12 · **Priority:** P1 · **Type:** Security · **Risks:** 4 · **Source:** AC6; dirty path: EDITOR calls DELETE directly · **Expected to fail (AC6): pages/api/company/[id].js has no role check on DELETE; the button is only disabled in the UI.**
**File:** `e2e/company/permissions.spec.ts`
**Why it matters:** a hidden button is not a control: any staff member with the browser's network tab can delete a supplier the owner relies on.

**Preconditions:** EDITOR session via loginAs(warehouse@trs.com, DEMO_EDITOR\_\* password). Via the API (ADMIN): supplier S 'QA Staff Delete <uid>' with no items (so only the role check can stop it).

**Steps:**

1. As EDITOR, DELETE /api/company/{S}
   - expect: 403 'Operation not permitted.' (the wording the purchase approve/cancel APIs use)
2. As ADMIN, GET /api/company/{S}
   - expect: S still exists, unchanged

#### 4.3. Another organization's supplier never shows up in list, search or pickers, and can't be read, edited or deleted by id

**TestRail:** — (not pushed yet) · **Key:** CO-13 · **Priority:** P1 · **Type:** Security · **Risks:** 3 · **Source:** AC7
**File:** `e2e/company/isolation-api.spec.ts`
**Why it matters:** a supplier list leaks who a business buys from; changing or deleting another tenant's supplier corrupts their ledger.

**Preconditions:** Signed in as ADMIN (admin@trs.com), Drift Warehouse Demo org seeded. A second organization from createOtherOrg('<uid>') with its own company X 'QA Other Org Supplier <uid>'. Record X with otherOrgSnapshot.

**Steps:**

1. GET /api/company?limit=1000 and GET /api/company/search?value=QA Other Org
   - expect: X is in neither result
2. Type X's name in the /purchase/create company picker
   - expect: X isn't offered
3. GET, PUT { phone: '0300 0000000' } and DELETE /api/company/{X}
   - expect: 404 for all three ('company not exist' / 'company not found' / 'company does not exist')
4. PUT one of this org's suppliers with { organizationId: <other org id> }
   - expect: 400 '"organizationId" is not allowed'
5. Read X again with otherOrgSnapshot
   - expect: X unchanged (name, phone, still present)

- Goes through the API because in production RLS is defence-in-depth only; the app's tenant hooks are the real boundary (CLAUDE.md).

<!-- cases:end -->

## Merged / dropped

- Per-field validation (5 fields × form and API) merged into CO-02 as one data table.
- Create as ADMIN and as EDITOR merged into CO-01 (role column); edit by role folded into CO-05 (EDITOR) and CO-11.
- Double-click Create merged into CO-03 (one company, not two) instead of its own case.
- "Same name allowed in another org" merged into CO-03; list, search, GET, PUT, DELETE isolation into one case, CO-13.
- EDITOR Delete split in two: the UI half (CO-11, expected green) and the API half (CO-12, known bug), so the bug doesn't hide the healthy check.
- Dropped: list page loads, popconfirm rendering, 404 for a nonexistent id in this org (covered by CO-08 and CO-13), search case-sensitivity (open question, not a rule yet).
