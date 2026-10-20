# Purchase orders (existing feature, regression coverage)

Roles: ADMIN (admin@trs.com) and EDITOR (warehouse@trs.com). Demo org data.

Business rules confirmed by the owner:

- Purchases are usually recorded after delivery. Approval posts the received stock and supplier
  liability; a separate order-to-delivery or partial-receipt workflow is outside this brief.
- Weight is per bale, not total line weight. A line may be purchased by kg or lb; the applicable
  unit and rate must be used consistently. For weight-priced lines, amount = number of bales ×
  weight per bale × rate per unit. For bale-priced lines, amount = number of bales × rate per bale.
- Posted purchases may need quantity/rate corrections and item additions/removals, including
  after subsequent business activity. Such corrections must preserve stock and ledger consistency.
- Duplicate invoice numbers are allowed. Invoice uniqueness is not a critical validation case.
- Item costs can change. New purchase orders use the latest item cost as their default; historical
  purchase prices must not change merely because the current item cost changes.

Acceptance criteria (required business behaviour; verify against the implementation):

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

Priority regression scenarios (check saved data after reload, stock and supplier ledger, not only
success messages):

1. Pricing: use multiple bales so a missing quantity multiplier cannot pass. For example, 3 bales ×
   50 kg per bale × Rs 100/kg = Rs 15,000; 2 bales × 100 lb per bale × Rs 40/lb = Rs 8,000.
   Test both units, bale pricing, decimal weights/rates, multiple lines, and surcharge added once.
   Verify the saved total and ledger amount against an independently calculated total. A direct
   request with an inconsistent total must not silently post an incorrect supplier liability.
2. Posting boundary: creation and edits before first approval change neither stock nor ledger.
   Cancelling a never-approved pending purchase also changes neither. Approval increases existing
   stock without replacing it, creates missing stock rows, and posts the purchase exactly once.
3. Revision cycle: approve → revise → edit again while pending → approve, then repeat another cycle.
   The latest saved values must persist; adjustments are relative to the last approved version,
   not an intermediate pending edit. Check revision history identifies the changes correctly.
4. Revision matrix: increase/decrease quantity, change weight, change only rate or surcharge,
   add/remove an item, and reorder unchanged lines. Match by item ID; unchanged stock is not added
   again, removed items reverse their posted contribution, and price-only changes do not move stock.
5. Downstream activity: correct a purchase after some bales have been sold and after supplier
   payments. Preserve those sales/payments and apply only the purchase correction. Test a reduction
   within remaining stock and one exceeding it; the latter needs the owner decision below.
6. Ledger reconciliation: approve a backdated purchase and revise an older purchase with subsequent
   purchases/payments, including entries on the same date. All affected running balances must
   reconcile; other suppliers and organizations remain unchanged.
7. Latest cost: create a later purchase at a different cost, then open a new purchase and verify its
   default cost. Older purchases keep their recorded rates. Verify an explicitly entered purchase
   rate survives saving/reloading. Historical revision cost precedence needs the decision below.
8. Input integrity: test required fields individually, an empty product array, missing applicable
   weight/rate, negative quantities/weights/rates/surcharge, fractional bale counts, duplicate item
   lines, nonexistent items, and items belonging to another company or bale type. Check both create
   and edit through the API as well as the form. Zero-value and duplicate-line rules need decisions
   below; do not invent expected results. Duplicate invoice numbers remain allowed.
9. Form integrity: save edited lines, remove/restore items, remove all items, switch company/bale
   type during creation, and reload. Only intended items and values persist; totals recalculate
   without duplicates or stale lines. Company/type restrictions on edits must also hold in the API.
10. Permissions/isolation: EDITOR cannot approve/cancel through direct requests. Another
    organization's purchases cannot be listed, viewed, edited, approved or cancelled; injecting its
    company/item IDs into this organization's requests is rejected without side effects.
11. Retry/concurrency: double approval, retry after a lost response, two administrators approving
    the same purchase, and two different purchases posting to the same supplier/item must not
    duplicate postings or lose stock/balance updates. Concurrent edit/approval must not silently
    approve stale data or overwrite another user's changes.
12. Failure consistency: fail posting after an inventory line changes or before ledger completion;
    status, all stock lines and ledger must roll back together. Fail revision history/save midway;
    history and purchase must remain consistent. A retry must apply the intended change once.

Remaining business decisions (resolve before marking related scenarios passed):

- Can an APPROVED purchase be cancelled, and if so should stock and ledger be reversed?
  Include a revised-pending purchase that already has posted effects, repeated cancellation,
  approval of a cancelled purchase, and whether cancelled purchases may be edited/reopened.
- While a posted purchase is revised and awaiting approval, should its last approved stock/ledger
  effects remain in place? Recommended baseline: retain them until the new revision is approved.
- If a correction removes more stock than remains after sales, should approval be blocked or should
  an explicit adjustment process be used? Permission to correct purchases does not settle this rule.
- If both kg and lb pricing fields are populated on one line, which unit is authoritative, or must
  the user select one? Define currency rounding, whether zero-price/zero-quantity lines are allowed,
  whether bale counts must be whole numbers, and whether duplicate item lines are merged or rejected.
- Does "latest cost" mean latest approved posting or latest purchase date? Should revising an older
  purchase replace the default cost from a newer purchase, and when does the new cost take effect?

Known implementation risks to investigate (code review observations, not executed test results):

- `utils/ui.util.js` currently calculates weight-priced lines as weight × rate without multiplying
  by bale count. This conflicts with the confirmed per-bale weight rule.
- The pending edit path in `pages/api/purchase/[id].js` only saves when `revisionNo` is zero; a second
  pending edit after an approved purchase is revised may return success without saving.
- Cancellation currently changes only status, and approval only explicitly rejects APPROVED status.
  Do not treat those implementations as the business cancellation/reopening policy.
- Creation accepts a client-supplied total and does not impose a minimum product-array length.
- Ledger revision updates select strictly later dates; same-date balance reconciliation needs coverage.

Out of scope: purchase reports and exports (separate feature).
