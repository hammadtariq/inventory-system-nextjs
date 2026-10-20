# Purchase orders (existing feature, regression coverage)

Roles: ADMIN (admin@trs.com) and EDITOR (warehouse@trs.com). Demo org data.

Acceptance criteria (current behaviour):

1. Create: pick a company, purchase date, bale type (Small or Big bales) and one or more of that
   company's items with number of bales, weight and rate; invoice number and surcharge are optional.
   A new purchase is saved as PENDING. Items from another company are rejected.
2. Required fields: company, purchase date, bale type and at least one product; the form blocks
   saving without them.
3. Approve (ADMIN only): status becomes APPROVED; each item's on-hand stock rises by its number of
   bales (a stock row is created if the item had none); the company ledger gets one DEBIT entry for
   the total, and the running balance rises by that amount.
4. Approving an already approved purchase is refused ("already approved").
5. EDITOR can create and edit purchases but cannot approve or cancel them.
6. Cancel (ADMIN only): status becomes CANCEL.
7. Edit a PENDING purchase: changes are saved and it stays PENDING.
8. Edit an APPROVED purchase: a revision is recorded in its history and it returns to PENDING.
   Re-approving applies only the difference to stock, and adjusts the existing ledger entry
   (and later balances) by the change in total, rather than adding a new entry.

Open questions for the QA lead:

- Can an APPROVED purchase be cancelled, and if so should stock and ledger be reversed?
  (The cancel API does not check status.)

Out of scope: purchase reports and exports (separate feature).
