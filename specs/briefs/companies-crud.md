# Companies (suppliers) CRUD (existing feature, regression coverage)

Roles: ADMIN (admin@trs.com), EDITOR (warehouse@trs.com). Test data: Drift Warehouse Demo org
(`pnpm db:seed-demo-org`, 55 seeded companies with items, stock and purchases).

Why it matters: a company is the supplier every purchase, item, stock row and supplier-ledger entry
hangs off. A deleted or duplicated supplier splits or loses its ledger, so the owner can't tell what
they owe; a supplier visible to another organization leaks who they buy from.

Acceptance criteria (required business behaviour; verify against the implementation):

1. Create: ADMIN and EDITOR add a company with a name (required, at least 3 characters) and optional
   email, phone (max 24 characters) and address (at least 10 characters). It appears in the company
   list, and the company pickers on purchase, item and payment screens.
2. Validation: a missing or too-short name, a malformed email, a phone over 24 characters or an address
   under 10 characters is refused with a message, in the form and at the API.
3. Unique names: two companies in one organization can't share a name (409 "Company "X" already exists
   in this organization."). The same name is allowed in a different organization.
4. Edit: ADMIN and EDITOR change name, email, phone or address. Renaming to another company's name is
   refused. Existing purchases, items, stock and ledger stay attached to the company and show the new
   name.
5. Delete (ADMIN only): removes a company with no dependent records. A company that has items is
   refused with "N items exist against this company. Please remove dependencies first."
6. Permissions: EDITOR can't delete a company. The Delete button is disabled for EDITOR, **and the
   API refuses it** (business context, risk 4).
7. Tenant isolation: list, search, GET, PUT and DELETE never return or change another organization's
   company; another org's company id gives 404.

Business rules and invariants:

- A supplier's ledger history (purchases, payments, revisions) must never be orphaned or silently
  deleted.
- Items are per company; deleting a company must not leave items, stock rows, purchases or ledger
  entries pointing at a company that no longer exists.

Dirty paths to cover:

- EDITOR calls `DELETE /api/company/{id}` directly (no role check exists in the handler).
- Delete a company that has no items but has purchases, payments or ledger entries (the handler only
  checks items; there's no FK from purchases, inventories or ledgers to companies).
- Delete a company's items first (item delete has no dependency or role check), then the company.
- Same name with different case or spacing ("Coastal Traders" vs "coastal traders "). The form
  lowercases every value before saving; the API doesn't.
- Edit a company whose email, phone or address is empty, or clear an optional field: the form sends
  `null` or `""`, which the API's Joi schema may reject.
- Double-click Create: one company, not two (the unique index should catch the race).

Decisions (owner, 2026-10-22):

- Q1. A company can't be deleted while any purchase, stock row, ledger or payment entry references
  it, not only items. Today's behaviour (orphaned rows, cascaded revision history) is a known bug.
- Q2. Item delete is ADMIN-only at the API and refused while the item is in a purchase or has stock.
  The companies plan covers it only as the route to deleting a supplier with history.
- Q3. Company names are unique within an organization regardless of case and surrounding spaces.
- Q4. Staff can clear an optional field (email, phone, address) on edit.
- Q5. Saving names lowercase from the form is acceptable; not a case.

Out of scope: items CRUD (beyond Q2), supplier ledger maths (covered by purchase cases), company
reports.
