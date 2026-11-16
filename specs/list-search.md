# Finding records in long lists (branch `fix/company-search-all-pages`)

## Overview

The column search on the supplier, customer, sales and item lists used to look only at the 50 rows already
on screen, and the stock list's supplier filter offered only the 50 most recently updated suppliers. The
branch moves the search to the server (all records in the organization) and reads the full supplier name
list for the stock filter. Reset now also clears the table's own filter (`utils/filter.util.js`, shared by
every searchable table). Brief: `specs/briefs/list-search.md`.

## Key facts (observed 2026-11-13, local Drift Warehouse Demo org, admin@trs.com)

- Searchable: suppliers by name; customers by first name, email, phone; sales by customer first name or
  status; items by item name. Matching ignores case and surrounding spaces and matches part of the value.
- Suppliers: " coastal impor " from page 1 finds "Coastal Imports" (a page-2 supplier); a search started
  on page 2 shows its result on page 1. One list request per search.
- Sales: status "pend" gives 53 PENDING sales over 2 pages; Reset from page 2 of the results returns page 1
  of 7 with all statuses. First name "robert" gives 4 pages, all Robert.
- Customers: email and phone searches each find a page-2 customer. First name "mary" (25), then an email
  search without Reset, shows only the email match: the latest search wins (Q1).
- Stock list: typing "coasta" in the supplier filter offers all 5 Coastal suppliers from page 2.
- No browser errors, only antd deprecation warnings.
- **Bug found and fixed during planning:** the lists still re-filtered the server's rows in the browser with
  the untrimmed text, so a search with spaces around it, or "%", showed an empty list. The four pages now
  switch that off (`onFilter: undefined`). LS-01 guards it.
- Company and sales list queries rely on the tenant hooks for isolation (no explicit organization filter).

## Owner decisions (2026-11-13)

- Q1: a search on another column replaces the previous one (LS-05). The earlier column keeps its
  highlighted search icon, which is cosmetic.
- Q2: no search by customer last name. Q3: `%` and `_` as wildcards accepted. Q4: 1,000-supplier cap on the
  stock filter accepted.

## Not explored

- LS-07 (another organization's records): needs a second organization; left to the test.
- Stock list: choosing a supplier from the filter and the rows it leaves.
- The planner agent could not run (hung dev server); the exploration was a read-only script.

## Left out of this plan

- Deleting or editing a record while a search is active (rare; changes shared seed data).
- Supplier lookup used by pickers and reports (`CO-14`, #250) and supplier list isolation (`CO-13`).
- Purchase list search (unchanged, still searches the loaded rows only).

## Merged / dropped

- Per-column search checks for customers, sales and items: merged into LS-02's data table.
- Search via Enter vs the Search control: merged into LS-01.
- `%` / `_` wildcard case: dropped (accepted by the owner, Q3).
- Last-name search: dropped (not wanted, Q2).

## Test Scenarios

<!-- cases:start (generated from the cases CSV by .qa/scripts/cases.mjs; edit the CSV, not this block) -->

### 1. Search across pages

#### 1.1. A supplier on a later page is found by name

**TestRail:** — (not pushed yet) · **Key:** LS-01 · **Priority:** P2 · **Type:** Regression · **Risks:** 1 · **Source:** Brief AC 1-3
**File:** `e2e/lists/search.spec.ts`
**Why it matters:** Staff who can't find a supplier that exists create it again, and its purchases and payments split across two ledgers.

```gherkin
Given the organization has 55 suppliers, shown 50 to a page
  And a supplier that only appears on the second page
When staff on the first page search the supplier list for part of that name, in lower case with spaces around it
Then that supplier is listed and the list shows page 1
When staff go to the second page and search for a supplier that sits on the first page
Then that supplier is listed on page 1, not an empty page 2
```

- Pick the names at run time: GET /api/company?limit=50&offset=50 (first row) and offset=0 (any row).
- Column search = the magnifier in the Company Name header; check both Enter and the Search control.
- Assert one list request per search (no request with the old offset).
- Explored 2026-11-13 (demo org): " coastal impor " from page 1 lists "Coastal Imports" (a page-2 supplier), 1 row, page 1; from page 2, "ironwood bale house" lists 1 row on page 1; one list request per search.
- Regression guard: before the fix on 2026-11-13 a search with spaces around it (or "%") showed an empty list, because the browser re-filtered the server's rows with the untrimmed text.

#### 1.2. Every searchable list finds matches beyond the first 50 records

**TestRail:** — (not pushed yet) · **Key:** LS-02 · **Priority:** P2 · **Type:** Regression · **Level:** api · **Risks:** 1, 5 · **Source:** Brief AC 1-2
**File:** `e2e/lists/search.spec.ts`
**Why it matters:** A customer, item or pending sale that search can't find is treated as missing: duplicates get created and pending sales go unapproved.

```gherkin
Given a <list> with more than 50 records and one that sits beyond the first 50
When staff search the <list> by <column> for <text>
Then the result has that record, every result matches <text>, and the total equals the number of matches
```

| list      | column              | text                                    |
| --------- | ------------------- | --------------------------------------- |
| customers | first name          | part of the name, different letter case |
| customers | email               | the full email in upper case            |
| customers | phone               | the last 6 digits                       |
| sales     | customer first name | part of the name, lower case            |
| sales     | status              | pend                                    |
| items     | item name           | part of the name, lower case            |

- GET /api/customer, /api/sales, /api/items with limit=50&offset=0&search=&searchField= (firstName, email, phone, status); items takes search only.
- Runs against real Postgres, which the unit tests (mocked) can't: sales joins the customer for the first-name search.
- status "pend" must return only PENDING rows; count = number of PENDING sales from an unfiltered read.
- Last name is not searchable on purpose (owner Q2).
- Explored 2026-11-13 through the lists: email "MARY.BROWN@BUYER.COM" 1 customer; phone "4-7695" 1 customer; sales first name "robert" 4 pages, all Robert; item "cotton rags industrial" 3 items.

#### 1.3. A search on another column replaces the previous search

**TestRail:** — (not pushed yet) · **Key:** LS-05 · **Priority:** P3 · **Type:** Functional · **Risks:** 5 · **Source:** Owner Q1 (2026-11-13)
**File:** `e2e/lists/search.spec.ts`
**Why it matters:** Two searches silently stacked show fewer customers than the total says, so staff trust a list that is hiding records.

```gherkin
Given the organization has 55 customers
  And staff have searched the customer list by first name for "a"
When staff search by email for one customer's full email, without resetting
Then exactly 1 customer is listed, the total is 1, and the first name search no longer applies
```

- Owner decision Q1 (2026-11-13): searches don't combine.
- Pick an email whose first name has no "a" so a stacked first-name filter would hide it.
- Explored 2026-11-13: first name "mary" (25 customers), then email "robert.martinez@buyer.com" without Reset: 1 row, Robert. The first column keeps its highlighted search icon (cosmetic).

### 2. Reset and recovery

#### 2.1. Reset brings back the full sales list from the first page

**TestRail:** — (not pushed yet) · **Key:** LS-03 · **Priority:** P2 · **Type:** Regression · **Risks:** 5 · **Source:** Brief AC 3-4
**File:** `e2e/lists/search.spec.ts`
**Why it matters:** If Reset leaves the list half-filtered, the owner sees a fraction of the sales and believes records were lost or already handled.

```gherkin
Given the organization has 320 sales, shown 50 to a page
When staff search the sales list by status for "pend"
Then every sale shown is PENDING and the total is the number of pending sales
When staff go to the second page of the results and then reset the search
Then the list shows page 1 of all 320 sales with 50 rows, in more than one status
```

- Reset is in utils/filter.util.js (clearFilters({ confirm: true })), shared by every searchable table.
- If fewer than 51 sales are PENDING, reset from page 1 and say so in the test.
- Total = the pager's last page x 50 bound; read the exact count from GET /api/sales.
- Explored 2026-11-13: "pend" gives 53 PENDING sales (50 + 3 on page 2); Reset from page 2 shows page 1 of 7 with 50 rows in APPROVED, PENDING and CANCEL.

#### 2.2. A search with no match shows an empty list, then recovers

**TestRail:** — (not pushed yet) · **Key:** LS-04 · **Priority:** P3 · **Type:** Functional · **Risks:** 5 · **Source:** Brief AC 4-5
**File:** `e2e/lists/search.spec.ts`
**Why it matters:** Old rows left on screen after a failed search make staff act on the wrong supplier.

```gherkin
Given the organization has 55 suppliers
When staff search the supplier list for "zzzz-no-such-supplier"
Then the list is empty and shows "No data"
When staff reset the search
Then the list shows 50 suppliers on page 1 of 2
```

- Rows from the previous page must not stay visible while the search loads (the hooks keep previous data during loading).
- Explored 2026-11-13: "zzzz" shows no rows and no pager; Reset shows 50 rows, page 1 of 2.

### 3. Stock list

#### 3.1. The stock list's supplier filter offers every supplier

**TestRail:** — (not pushed yet) · **Key:** LS-06 · **Priority:** P2 · **Type:** Regression · **Risks:** 2 · **Source:** Brief AC 6
**File:** `e2e/lists/search.spec.ts`
**Why it matters:** If a supplier is missing from the filter, the owner can't check that supplier's stock on hand and assumes there is none.

```gherkin
Given the organization has 55 suppliers
  And a supplier that only appears on the second page of the supplier list
When staff type part of that supplier's name in the stock list's supplier filter
Then that supplier is offered and can be chosen
  And the stock list shows only that supplier's items
```

- pages/inventory now reads the full name list (up to 1,000, accepted by the owner, Q4) instead of the 50-row table query.
- Use antSelect helpers; the option list is virtual, so type to reach it.
- Explored 2026-11-13: typing "coasta" offers the 5 Coastal suppliers, all of which sit on page 2 of the supplier list. Choosing one and the filtered stock rows were not explored.

### 4. Isolation

#### 4.1. Search never returns another organization's records

**TestRail:** — (not pushed yet) · **Key:** LS-07 · **Priority:** P1 · **Type:** Security · **Level:** api · **Risks:** 3 · **Source:** Brief AC 7
**File:** `e2e/lists/search.spec.ts`
**Why it matters:** A search that leaks another business's suppliers, customers or sales exposes who they trade with and for how much.

```gherkin
Given a second organization with a supplier, a customer, an item and a sale all named "QA Leak Probe"
When staff of the demo organization search each list for "leak probe"
Then suppliers, customers, items and sales each return 0 results with a total of 0
```

- Second org via e2e/support/second-org.ts; GET each list with search (and searchField) as the demo ADMIN.
- The company and sales handlers rely on the tenant hooks only (no explicit organizationId in the query).
- CO-13 covers the supplier list and lookup without the new search parameter.

<!-- cases:end -->
