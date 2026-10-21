# Business context: TSO Inventory (StockFlow)

Read by the QA Kit before planning or generating tests, so cases protect what this business cares about.
Drafted 2026-10-20 from the repo's docs and domain code; the owner should confirm "What must never go wrong".

## The business

- **Niche and customers:** inventory + accounting for growing SMB traders in South Asia (Pakistan, India,
  Bangladesh) replacing spreadsheets, manual ledgers or ageing ERPs. Goods are bought from supplier
  **companies** and sold to **customers** by the **bale** (small or big bales), weighed in kg/lbs and priced
  per bale, per kg or per lb, in PKR (Rs). Multi-tenant SaaS: each business is an organization.
- **Value to them:** real-time stock, purchase approvals, an integrated ledger per supplier and customer,
  cheque tracking and reports, so "a founder who used to spend Fridays reconciling spreadsheets spends 20
  minutes on TSO and has confidence in their numbers". The product is sold on trust with real money.
- **Who uses it:** the owner/proprietor and finance managers (ADMIN) approve and correct; operations and
  accounts staff (EDITOR) prepare purchases and sales, record payments and maintain items, customers and
  companies. Desktop browser, business hours, sometimes older devices and slow connections. SUPER_ADMIN is
  the platform operator (organizations, payment requests), not a customer role.

## What must never go wrong

Ranked; these drive P1 cases and "critical" bug severity.

1. **Ledger balances are right.** Every supplier and customer running balance equals its entries in date
   order. Approvals, revisions, payments, returns and backdated entries move balances by exactly the right
   amount, once. A wrong balance means paying a supplier the wrong amount or chasing a customer for money
   they don't owe.
2. **Stock on hand matches approved movements.** + bales from approved purchases, − bales from approved
   sales, + returned bales. Never sell more than on hand, never count a movement twice, and cancelling or
   revising must not leave phantom stock behind.
3. **One organization never sees or changes another's data**, in screens, APIs, exports or reports.
4. **Only the owner's role commits.** Approving or cancelling purchases and sales, sale returns and cheque
   status are ADMIN-only, as are deleting customers, companies or items and editing stock directly.
   Every one must be refused for staff at the API, not just hidden in the UI. Staff prepare work; the
   owner commits it. Staff can only view an APPROVED purchase, never change it (owner, 2026-10-21).
5. **Final records stay trustworthy.** An approved purchase or sale changes only through a recorded
   revision; history explains every change; exports and reports agree with the screens, because the
   accountant and customers rely on them.

## Business rules and invariants

As implemented (verified in code, 2026-10-20). Where a rule looks wrong it is listed under open questions, not here.

- **Purchases:** PENDING → APPROVED or CANCEL. Company, purchase date, bale type and at least one item of
  that company are required; invoice number and surcharge are optional. Approve once only.
- **Approving a purchase** adds each item's bales (and weight) to stock, creating the stock row if needed,
  updates the item's rates, and adds one company-ledger DEBIT for the total: balance = previous + total.
- **Revising an approved purchase** records a PurchaseHistory revision and returns it to PENDING.
  Re-approval applies only the stock difference and adjusts the existing ledger entry, shifting later
  balances (and payment rows' company totals) by the change in total.
- **Sales:** approval is refused if the total is 0 or any item's on-hand is below the bales sold ("out of
  stock"); it deducts bales and weight, and adds one customer-ledger CREDIT for the total:
  balance = previous − total.
- **Sale returns:** only for approved sales; per item 0 < returned ≤ sold − already returned; bales go back
  to stock; the ledger gets a DEBIT of type INVENTORY_RETURN.
- **Payments** (cash, online, cheque, refund) can be recorded by ADMIN and EDITOR. A cheque payment needs a
  cheque number and due date and creates a cheque record. Pay To party balance − amount, Pay By party
  balance + amount.
- **Items are per company:** the same product bought from two suppliers is two items with separate stock.

## Real-world usage (the dirty paths)

- Entries are recorded after the fact: backdated purchase, sale and payment dates, especially at month end.
- The supplier's final invoice differs from the PO (weight, rate, an extra bale): approved purchases get
  revised, sometimes more than once.
- Staff prepare, the owner approves later in a batch: many approvals in a row, double-clicks, two
  people approving the same record, approving from a stale tab.
- Customers pay in instalments, by post-dated cheque, or overpay; cheques bounce; refunds happen.
- Partial returns, and several returns against one sale.
- Rates change between purchases; amounts typed with commas; decimal weights; a line left at 0 bales;
  the same supplier invoice number entered twice.
- Records are shared: Excel/PDF exports for the accountant, invoices sent to customers on WhatsApp.

## Past incidents and known gaps

- **Past fixes** (from branch names): duplicate purchase on edit (`bug/edit-purchase-duplicate`), sale
  edit (`bug/fix-sale-edit`), tenant isolation (`bug/multi-tenant`), tenant id sequences
  (`chore/resync-tenant-sequences`). Each deserves a regression case.
- **Open questions from code review** (pilot, 2026-10-20), for the owner to decide:
  - **Role checks on master data and stock.** `data/permission.js` reserves deleting customers, companies
    and items, and editing stock, for ADMIN. Every one of these must be refused for an EDITOR at the API,
    not only hidden in the UI; permission cases must call the API with an EDITOR session.
  - Cancelling a purchase or a sale doesn't check its status: an APPROVED one can be cancelled without
    reversing its stock and ledger effects.
  - The API approves a CANCEL purchase, accepts a purchase with no items, and reopens a CANCEL purchase as
    PENDING on edit (the UI prevents all three).
  - Editing a previously revised PENDING purchase returns success but saves nothing (likely bug, D1 in
    `specs/purchase-orders.md`).
  - Sale approval deducts weight without checking it stays ≥ 0 (only bales are checked).
  - **Found in the purchase case review (2026-10-21), in `specs/purchase-orders.md` D8–D11:** the API accepts
    negative values, unpriced weight lines and edits missing required fields (only invoice number and surcharge
    may be left out); an edit never checks its items, so it can attach another supplier's or another
    organization's item; an EDITOR can edit an APPROVED purchase, which reopens it; a backdated purchase
    doesn't shift later rows' stored balances; concurrent approvals for one supplier can store overlapping
    balances.
  - Decided (owner, 2026-10-21): supplier and customer statements follow date order; a backdated entry
    takes its date position and shifts later balances. Still to decide: are staff also view-only on a
    CANCEL purchase?
  - Cheque status accepts any text.
  - In production, row-level security is defence-in-depth only; the app's tenant hooks are the real
    boundary (see CLAUDE.md), so tenant cases must go through the API, not just the UI.

## Sources

- `PRODUCT.md`, `SAAS_MARKET_STRATEGY.md`, `MULTI_TENANCY_PRD.md`, `LEDGER_CREATE_BACKEND_IMPLEMENTATION.md`, `CLAUDE.md`
- Code: `pages/api/purchase/**`, `pages/api/sales/**` (approve, cancel, returns), `pages/api/ledger/createPayment.js`,
  `pages/api/cheques/index.js`, `pages/api/{customer,company,items,inventory}/[id].js`, `data/permission.js`,
  `lib/tenant-write-hooks.js`
- `specs/purchase-orders.md` (exploration discrepancies D1–D5)
