# Finding records in long lists (existing feature, regression coverage)

Roles: ADMIN admin@trs.com (default). Test data: Drift Warehouse Demo org (55 suppliers, 55 customers, 320 sales);
lists show 50 rows per page.

Why it matters: staff who search for a supplier, customer, item or sale and don't see it assume it doesn't
exist. They create a duplicate supplier or customer (splitting its ledger, risk 1), or miss a pending sale
that should have been approved. Before this change a search only looked at the 50 rows already on screen.

Acceptance criteria (required business behaviour; verify against the implementation, not just the happy path):

1. Searching a list by a column finds every matching record in the organization, whichever page it is on:
   suppliers by name; customers by first name, email or phone; sales by customer first name or status;
   items by item name (within the chosen supplier, when one is chosen).
2. Search ignores letter case and spaces around the text, and matches part of the value.
3. A new search shows its results from the first page, and the count of pages matches the number of matches.
4. Reset brings back the full list from the first page, with nothing still filtered.
5. A search with no match shows an empty list, not the previous results.
6. The supplier filter on the stock list offers every supplier, not only the 50 most recently updated, and
   can be narrowed by typing.
7. Search never shows another organization's records.

Business rules and invariants:

- The total shown under a searched list is the number of matches in the whole organization.
- Search is read-only: it changes nothing.

Dirty paths to cover (from the playbook catalogue, each with its business reason):

- Search from page 2: the match may be on page 1 of the results; staff must not land on an empty page.
- Reset after paging inside results: the full list must come back, or staff think records were lost.
- Search, then delete or edit a record, then keep working: the list must not silently show stale or
  half-filtered rows.
- Search one column, then another, without Reset: only the latest search applies (Q1).
- Another organization's supplier with a matching name (risk 3).

Decided (owner, 2026-11-13):

- Q1. A new search on another column replaces the previous search; searches don't combine. The list and
  its total always show the matches of the latest search only.
- Q2. Customers are not searchable by last name.
- Q3. `%` and `_` in the search text acting as wildcards is accepted.
- Q4. The stock list's supplier filter offering at most 1,000 suppliers is accepted for now.

Out of scope: the supplier name lookup used by pickers and reports (`CO-14`, known bug #250); tenant
isolation of the supplier list (`CO-13`); purchase list search (not changed).
