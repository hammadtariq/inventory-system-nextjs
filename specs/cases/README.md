# Test cases (CSV)

One CSV per feature, **one row per test case**. This file is the source of truth for case design:
review it in any spreadsheet (Excel, Google Sheets, Numbers, LibreOffice), delete or merge rows there,
and only push to the test management tool once the set is right. The plan's scenario block
(`specs/<feature>.md`) and every export are generated from it.

```bash
node .qa/scripts/cases.mjs check specs/cases/<feature>.csv          # validate + business-risk coverage
node .qa/scripts/cases.mjs plan  specs/cases/<feature>.csv          # regenerate the plan's scenarios
node .qa/scripts/cases.mjs testrail specs/cases/<feature>.csv       # TestRail CSV-import file (Keep rows)
```

`/qa-kit:plan-feature` writes the file, `/qa-kit:review-cases` suggests merges and drops, you decide,
and `/qa-kit:push-cases` sends the Keep rows to TestRail and writes the case ids back.

## Columns

| Column           | What goes in it                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| `key`            | Stable id of the case in this repo, like `PO-07`. Never reuse a key.                                               |
| `testrail_id`    | `C123` once pushed; empty before. Filled in by `push-cases`.                                                       |
| `section`        | Group heading in the plan (Create, Approve, Permissions...).                                                       |
| `title`          | The business behaviour in the owner's words. Max 250 characters.                                                   |
| `priority`       | `P1` money, stock, access or data loss in a common flow; `P2` wrong but recoverable or rare; `P3` cosmetic.        |
| `type`           | `Functional`, `Security` (permission and tenant cases) or `Regression` (journeys guarding existing behaviour).     |
| `risks`          | Ranks from "What must never go wrong" in `.qa/business-context.md`, like `1;2`. `check` reports coverage per risk. |
| `why_it_matters` | One sentence: what the business loses if this breaks.                                                              |
| `preconditions`  | Data and role the case starts from.                                                                                |
| `steps`          | Numbered, one per line: `1. Approve P from the list`.                                                              |
| `expected`       | Numbered to match `steps`, one per line: `1. APPROVED; stock + 5; balance B + 500`.                                |
| `data`           | Optional data table: header line first, cells separated by `\|`. One test loops over the rows.                     |
| `notes`          | Optional, one per line: test-writing hints, what isn't asserted and why.                                           |
| `known_issue`    | Optional: `Expected to fail (D1)`, `May fail (...)`. The test is marked `test.fixme()` with this reason.           |
| `source`         | Optional: acceptance criterion or brief scenario the case comes from.                                              |
| `file`           | Spec file the test lives in, like `e2e/purchase/approve.spec.ts`.                                                  |
| `suggestion`     | Claude's proposal: `Keep`, `Rewrite`, `Drop` or `Merge into PO-04`, optionally `: reason`.                         |
| `decision`       | **Yours** (Gate 1): same words as `suggestion`. Empty = not reviewed. Only `Keep` rows are pushed.                 |
| `review_notes`   | Free text for the reviewer.                                                                                        |

Extra columns you add are kept.

## Reviewing (Gate 1)

1. Open the CSV, read each row as the business owner would, and fill `decision`. Fill-down works:
   start with `Keep` and change the rows that need it.
2. Remove a case: `Drop`, or `Merge into <key>` when another case should absorb it (add its checks to that
   row's steps). Rows already in TestRail are moved to a "Retired" section on push, never deleted. A row
   that was never pushed can simply be deleted.
3. `Rewrite` means "right risk, wrong case": edit the row, then change it to `Keep`. Push refuses `Rewrite` rows.
4. Save as CSV (UTF-8) and run `check` before pushing.

## Other test management tools

The CSV doesn't depend on TestRail. Most tools import CSV with one row per case and steps in one cell,
which is this file as it is: map `title`, `preconditions`, `steps`, `expected`, `priority` and `type` in the
tool's import screen and filter to `decision = Keep`. For tools that want one row per step (TestRail's
importer does), use `cases.mjs testrail`.
