# Overview Page Year Filter

**Date:** 2026-06-27  
**Status:** Approved

## Problem

The Overview page (pages/index.js) shows all-time aggregated data. Users need to filter the entire dashboard by a specific year to compare annual performance.

## Solution

Add a year selector dropdown to the Overview page. Selecting a year refetches all dashboard data scoped to that year. The default selection is the current year. Available years are populated dynamically from the database (only years with actual sales or purchase records are shown).

## Scope

All 7 active Overview API endpoints are affected. No other pages are changed.

## Architecture

### New API endpoint

**`GET /api/overview/available-years`**

Returns a sorted-descending array of years that have at least one approved sale or purchase record for the tenant.

```sql
SELECT DISTINCT EXTRACT(YEAR FROM "soldDate")::integer AS year
FROM sales
WHERE "organizationId" = :organizationId AND status = 'APPROVED'
UNION
SELECT DISTINCT EXTRACT(YEAR FROM "purchaseDate")::integer AS year
FROM purchases
WHERE "organizationId" = :organizationId AND status = 'APPROVED'
ORDER BY year DESC
```

Response: `[2026, 2025, 2024]`

### Updated API endpoints (accept `?year=YYYY`)

All handlers read `const year = parseInt(req.query.year) || new Date().getFullYear()` and add it to `replacements`. Queries change as follows:

| Endpoint                   | Date column(s) filtered                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| `cards.js`                 | `sales."soldDate"`, `purchases."purchaseDate"`, `ledgers."createdAt"` (for due sub-queries)    |
| `sales-vs-purchases.js`    | `sales."soldDate"`, `purchases."purchaseDate"` (was hardcoded to `EXTRACT(YEAR FROM NOW())`)   |
| `sales-distribution.js`    | `ledgers."createdAt"` (paid), `ledgers."createdAt"` (due sub-query), `saleReturns."createdAt"` |
| `purchase-distribution.js` | `ledgers."createdAt"` (paid), `purchases."purchaseDate"` (total)                               |
| `company-comparison.js`    | `purchases."purchaseDate"`                                                                     |
| `top-customers.js`         | `sales."soldDate"`                                                                             |
| `top-products.js`          | `sales."soldDate"`                                                                             |

All endpoints remain backwards-compatible: omitting `?year` falls back to the current year.

### Hook changes (`hooks/overview.js`)

All 7 existing functions gain a `year` parameter: `getDashboardCards(year)` → `get('/api/overview/cards?year=' + year)`. Add new `getAvailableYears()` function.

### Frontend changes (`pages/index.js`)

- Add `year` state: `const [year, setYear] = useState(new Date().getFullYear())`
- Add `availableYears` state: `const [availableYears, setAvailableYears] = useState([])`
- `getAvailableYears()` is called once on mount (not year-dependent)
- The three parallel fetch groups (cards, charts, lists) move into a single `useEffect([year])` — refetches all data on year change
- Add an Ant Design `Select` dropdown above the stat cards row, right-aligned. The dropdown renders the `availableYears` array as options, plus the current year as a fallback option if it has no data yet.

## Data flow

```
User selects year
  → setYear(year)
  → useEffect fires (dep: [year])
  → All loading states reset to true
  → 3 parallel Promise.all groups fetch with ?year=year
  → Spinners show during fetch
  → State updates → charts/cards re-render
```

## Edge cases

- **Current year has no data yet:** Current year is always included as an option (added client-side if not in the API response), so the dropdown is never empty on first load.
- **No data at all:** `availableYears` falls back to `[currentYear]`; all charts render their empty states (already handled).
- **Invalid year param:** API handlers default to current year if `parseInt(req.query.year)` is NaN.

## Tenant safety

No changes to tenant scoping. `year` is passed as a `replacements` value (not interpolated into SQL), so no SQL injection risk.

## Files changed

```
pages/api/overview/available-years.js   (new)
pages/api/overview/cards.js
pages/api/overview/sales-vs-purchases.js
pages/api/overview/sales-distribution.js
pages/api/overview/purchase-distribution.js
pages/api/overview/company-comparison.js
pages/api/overview/top-customers.js
pages/api/overview/top-products.js
hooks/overview.js
pages/index.js
```
