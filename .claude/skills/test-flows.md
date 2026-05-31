---
name: test-flows
description: Use when running end-to-end testing of the inventory system — opens browser, executes all user flows in dependency order, and reports pass/fail for each step
---

# Inventory System E2E Test Runner

## Overview
Executes the complete user flow test suite via Playwright MCP. Tests every module in correct business sequence: Auth → Company → Items → Customer → Purchase → Inventory → Sales → Ledger → Sale Return → Reports → Logout.

## Pre-flight Check
Before anything else, verify the server is running:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```
If not 200, tell the user: "Please start the server with `pnpm dev` and run `/test-flows` again."

## Test Config
- **URL:** `http://localhost:3000`
- **Email:** `hammad@test.com`
- **Password:** `12345678`
- **Test data suffix:** use last 6 digits of current timestamp to avoid conflicts between runs
  - Company: `E2E Supplier {TS}`
  - Customer first: `E2E`, last: `Tester{TS}`, email: `e2e{TS}@test.com`
  - Item name: `e2eitem{TS}` ← must be **lowercase**, min 3 chars (API validation)

## Results Tracker
Announce: `🧪 Starting E2E Test Suite for Inventory System`

Track each step as you go:
- `✅ PASS — {step name}`
- `❌ FAIL — {step name}: {reason}`

If a step fails, note it and **continue** to the next step. Don't stop the whole suite.

---

## Phase 0 — Authentication

**0.1 Login as ADMIN**
- Navigate to `/login`
- Fill email: `hammad@test.com`, password: `12345678`
- Click "Sign in"
- ✓ Verify: URL becomes `/`, sidebar shows "hammad tariq"

**0.2 Session persists**
- Navigate to `/company`
- ✓ Verify: NOT redirected to `/login` (session cookie is active)

---

## Phase 1 — Company Setup

**1.1 Create Company (supplier)**
- Navigate to `/company/create`
- Fill Name: `E2E Supplier {TS}` (required)
- Fill Email: `supplier{TS}@e2e.com`, Phone: `0300-0000000`, Address: `Test Street`
- Click "Create"
- ✓ Verify: redirected to `/company`, new company visible in table

---

## Phase 2 — Items Setup

**2.1 Create Item (product catalog entry)**
- Navigate to `/items/create`
- Select Company: `E2E Supplier {TS}` from dropdown
- Select List Type: `SMALL_BALES`
- Fill Name: `e2eitem{TS}` (lowercase)
- Fill Rate per LBS: `50`
- Click "Submit"
- ✓ Verify: item appears in items list, company column shows `E2E Supplier {TS}`

---

## Phase 3 — Customer Setup

**3.1 Create Customer (buyer)**
- Navigate to `/customers/create`
- Fill First Name: `E2E`, Last Name: `Tester{TS}`, Email: `e2e{TS}@test.com`
- Fill Phone: `0300-1111111`
- Click "Create"
- ✓ Verify: customer appears in customers list

---

## Phase 4 — Purchase Order Flow

**4.1 Create Purchase Order (PENDING)**
- Navigate to `/purchase/create`
- Select Company: `E2E Supplier {TS}`
- Select List Type: `SMALL_BALES`
- Take a snapshot — an editable items table appears after both selections
- In the items table, find `e2eitem{TS}` row
  - Click the "No of Bales" cell → enter `10`
  - Click the "Rate Per Bale" cell → enter `100`
  - Click Save on the row
- Fill Total Amount: `1000`
- Fill Total Bundle(s): `10`
- Set PO Date: today's date
- Click "Create Purchase"
- ✓ Verify: PO appears in `/purchase` list with status `PENDING`

**4.2 Approve Purchase Order**
- In the purchase list, find the new PO (top of list)
- Take snapshot to locate the Approve action button
- Click Approve
- Confirm if a confirmation modal appears
- ✓ Verify: status changes to `APPROVED`

**4.3 Verify Inventory Increased**
- Navigate to `/inventory`
- Filter by Company: `E2E Supplier {TS}`
- ✓ Verify: `e2eitem{TS}` row shows On Hand = `10`

**4.4 Verify Ledger DEBIT for Company**
- Navigate to `/ledger?type=company`
- Search for `E2E Supplier {TS}`
- ✓ Verify: DEBIT entry of `1000` (Rs) exists (purchase creates a payable)

---

## Phase 5 — Sales Flow

**5.1 Create Sale Order (PENDING)**
- Navigate to `/sales/create`
- Select Customer: `E2E Tester{TS}` from dropdown
- In Products field: search and select `e2eitem{TS}`, set quantity to `5`
- Fill Total Amount: `750`
- Set Sales Date: today's date
- Click "Create Sale"
- ✓ Verify: sale appears in `/sales` list with status `PENDING`

**5.2 Approve Sale Order**
- In the sales list, find the new sale (top of list)
- Take snapshot to locate the Approve action button
- Click Approve
- Confirm if modal appears
- ✓ Verify: status changes to `APPROVED`

**5.3 Verify Inventory Decreased**
- Navigate to `/inventory`
- Filter by Company: `E2E Supplier {TS}`
- ✓ Verify: `e2eitem{TS}` shows On Hand = `5` (was 10, sold 5)

**5.4 Verify Ledger CREDIT for Customer**
- Navigate to `/ledger?type=customer`
- Search for `E2E Tester{TS}`
- ✓ Verify: CREDIT entry of `750` exists (sale creates a receivable)

---

## Phase 6 — Payments (Ledger Transactions)

**6.1 Pay the Supplier (company payment)**
- Navigate to `/ledger/create`
- Payment Type: `Cash`
- Paid To (Company): `E2E Supplier {TS}`
- Amount: `500`
- Payment Date: today
- Click "Create"
- ✓ Verify: navigate to `/ledger?type=company`, search supplier → CREDIT entry of `500` visible

**6.2 Receive Payment from Customer**
- Navigate to `/ledger/create`
- Payment Type: `Cash`
- Paid By (Customer): `E2E Tester{TS}`
- Amount: `400`
- Payment Date: today
- Click "Create"
- ✓ Verify: navigate to `/ledger?type=customer`, search customer → DEBIT entry of `400` visible

---

## Phase 7 — Sale Return

**7.1 Create Sale Return**
- Navigate to `/sales`
- Find the approved sale for `E2E Tester{TS}` — note its Invoice Number (row ID)
- Click the sale row to open the detail page `/sales/[id]`
- Take snapshot — look for a "Return" or "Create Return" button/section
- Fill return: 2 bales of `e2eitem{TS}`, Return Date: today, Reference: `E2E return test`
- Submit the return
- ✓ Verify: return appears in `/sale-returns` list

**7.2 Verify Inventory Restored**
- Navigate to `/inventory`
- Filter by Company: `E2E Supplier {TS}`
- ✓ Verify: `e2eitem{TS}` shows On Hand = `7` (5 + 2 returned)

---

## Phase 8 — Reports

**8.1 Sales Report**
- Navigate to `/reports`
- Sales tab should be active by default
- ✓ Verify: table shows at least 1 row (the E2E sale)
- ✓ Verify: Total Invoices counter > 0

**8.2 Purchase Report**
- Click "Purchase" tab
- ✓ Verify: table shows at least 1 row (the E2E purchase)

**8.3 Inventory Report**
- Click "Inventory" tab
- ✓ Verify: `e2eitem{TS}` visible in the inventory report

---

## Phase 9 — Logout

**9.1 Logout**
- Click the user avatar / initials "HT" in the bottom-left of the sidebar
- Take snapshot — look for a Logout option in the dropdown menu
- Click Logout
- ✓ Verify: redirected to `/login`, session cleared

---

## Final Summary Report

After completing all phases, print this summary:

```
╔══════════════════════════════════════════════╗
║        E2E TEST SUITE — RESULTS              ║
╠══════════════════════════════════════════════╣
║  Phase 0: Authentication                     ║
║    0.1 Login as ADMIN               [ ]      ║
║    0.2 Session persistence          [ ]      ║
║  Phase 1: Company Setup                      ║
║    1.1 Create Company               [ ]      ║
║  Phase 2: Items Setup                        ║
║    2.1 Create Item                  [ ]      ║
║  Phase 3: Customer Setup                     ║
║    3.1 Create Customer              [ ]      ║
║  Phase 4: Purchase Flow                      ║
║    4.1 Create PO (PENDING)          [ ]      ║
║    4.2 Approve PO (APPROVED)        [ ]      ║
║    4.3 Inventory +10 verified       [ ]      ║
║    4.4 Ledger DEBIT company         [ ]      ║
║  Phase 5: Sales Flow                         ║
║    5.1 Create Sale (PENDING)        [ ]      ║
║    5.2 Approve Sale (APPROVED)      [ ]      ║
║    5.3 Inventory -5 verified        [ ]      ║
║    5.4 Ledger CREDIT customer       [ ]      ║
║  Phase 6: Payments                           ║
║    6.1 Company payment (Cash)       [ ]      ║
║    6.2 Customer payment (Cash)      [ ]      ║
║  Phase 7: Sale Return                        ║
║    7.1 Sale return created          [ ]      ║
║    7.2 Inventory +2 restored        [ ]      ║
║  Phase 8: Reports                            ║
║    8.1 Sales report shows data      [ ]      ║
║    8.2 Purchase report shows data   [ ]      ║
║    8.3 Inventory report shows data  [ ]      ║
║  Phase 9: Logout                             ║
║    9.1 Logout clears session        [ ]      ║
╠══════════════════════════════════════════════╣
║  TOTAL: ??/22 PASSED                         ║
╠══════════════════════════════════════════════╣
║  ISSUES FOUND:                               ║
║  (list any failures with details here)       ║
╚══════════════════════════════════════════════╝
```

Fill each `[ ]` with `✅` or `❌`.
List all failures with their error messages under ISSUES FOUND.
