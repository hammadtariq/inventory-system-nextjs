# Incident: `inventories_id_seq` silently drifting behind real data

**Date found:** 2026-07-02
**Severity:** High — a live production crash waiting to happen, already causing app instability elsewhere
**Status:** Fixed in [PR #206](https://github.com/hammadtariq/inventory-system-nextjs/pull/206)

## TL;DR

Every time the app approved a purchase (or processed a sale return) for an item
that had never been stocked before, it created the new `Inventory` row with a
hand-picked ID instead of letting the database assign one. The database's
internal "next ID to use" counter never found out about those hand-picked IDs,
so it kept falling further behind reality. Eventually the counter would hand
out an ID that was already taken, and the request would crash outright. This
had already happened once in production (a different table, same root cause
pattern) and was measurably 645 IDs behind on the `inventories` table by the
time it was found — meaning it was actively happening in normal day-to-day use,
not a one-off fluke.

## How this was found

While restoring a database backup to fix an unrelated problem, every table's
"next ID" counter was checked against the real highest ID actually present in
each table. Two tables were behind:

| Table         | Counter said next ID is... | Real highest ID in the table | Gap                                                                                                                  |
| ------------- | -------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `users`       | 1                          | 6                            | 5 (from an earlier, separate issue — see [PR #201](https://github.com/hammadtariq/inventory-system-nextjs/pull/201)) |
| `inventories` | 526                        | 1171                         | **645**                                                                                                              |

The `inventories` gap of 645 was the red flag — that's not something a one-time
data import could produce (the import only had ~1,100 rows total). It could
only come from the app itself repeatedly creating rows with a hand-picked ID
during normal use, over what looks like a long stretch of real usage.

## Why this happens

Every database table here that has an auto-incrementing ID column has an
internal counter (Postgres calls it a "sequence") that hands out the next
number whenever a new row is inserted _without_ specifying an ID. That's how
IDs normally get assigned — you never think about it because it just works.

But two places in the code explicitly set the ID by hand instead of letting
the counter do it:

- `pages/api/purchase/approve/[id].js` — when a purchase order is approved and
  one of the purchased items has never been stocked before, the code creates
  its `Inventory` row using **the same ID as the purchased item itself**
  (deliberately — so that a later screen can look the stock up by that same
  ID). This is intentional design, not a mistake.
- `pages/api/sales/returns/index.js` — does the identical thing when
  processing a return for an item that isn't currently in stock.

The problem: when you insert a row with a hand-picked ID, Postgres's counter
has no idea that ID was just used. It keeps counting from wherever it last
left off. So the counter and the real data quietly diverge, a little more
every time this code path runs.

## Why this is critical

Once the counter's number is _behind_ the real highest ID in the table, it is
only a matter of time before the counter hands out a number that's already
taken by one of those hand-picked-ID rows. When that happens, the database
rejects the insert with a "this ID is already in use" error, and the request
that triggered it — some completely unrelated, perfectly normal action, like
approving a purchase or creating a new inventory item the regular way — fails
outright with a server error.

This exact failure mode already happened once in production, on the `users`
table, while seeding a demo organization (see PR #201's follow-up work): a
brand-new user couldn't be created because the counter tried to hand out an ID
that was already taken. That was a nuisance, not a disaster, because user
creation is rare. The `inventories` table is a different story — new items get
added to inventory constantly as part of normal, everyday purchase approvals.
A collision there would surface as a random, hard-to-explain 500 error on an
otherwise completely valid purchase approval, with no clear trigger from the
user's point of view — exactly the kind of bug that's miserable to diagnose
after the fact because it looks intermittent and unrelated to anything the
user actually did wrong.

## The fix

After either of those two code paths creates a new `Inventory` row with a
hand-picked ID, a new one-line helper immediately tells Postgres's counter
"make sure your next number is higher than this ID I just used." If the
counter is already ahead, it does nothing — it only ever moves forward, never
backward, so it can't undo any legitimate progress.

This was verified three ways before merging:

1. **Automated tests** that fail on the old code and pass on the fixed code
   (proving they actually catch this specific bug, not just checking
   something superficial).
2. **Ran the actual database command against a real copy of the database**
   to confirm it correctly nudges the counter forward when behind, and
   correctly leaves it alone when it's already ahead.
3. **The existing full test suite** still passes with no new failures.

## What this doesn't fix by itself

This fix stops the drift from happening _going forward_. It does not
retroactively fix drift that may already exist on production today — that's
what [`scripts/resync-tenant-sequences.js`](../scripts/resync-tenant-sequences.js)
(PR #205) is for: a script you can run to check every table's counter against
its real data and correct any that are already behind. Think of PR #206 (this
fix) as "stop the leak" and PR #205 as "bail out the water that's already
there." Both are worth merging; #206 is the more important of the two, since
without it the leak just starts again.
