# Test cases (CSV)

One CSV per feature, **one row per test case**. This file is the source of truth for case design:
review it in any spreadsheet (Excel, Google Sheets, Numbers, LibreOffice), delete or merge rows there,
and only push to the test management tool once the set is right. The plan's scenario block
(`specs/<feature>.md`) and every export are generated from it.

```bash
node .qa/scripts/cases.mjs check specs/cases/<feature>.csv          # validate, writing rules, risk coverage
node .qa/scripts/cases.mjs plan  specs/cases/<feature>.csv          # regenerate the plan's scenarios
node .qa/scripts/cases.mjs testrail specs/cases/<feature>.csv       # TestRail CSV-import file (Keep rows)
node .qa/scripts/cases.mjs migrate specs/cases/<feature>.csv        # old steps/expected rows -> Given/When/Then
```

Each case is a short **Gherkin scenario in the business's words**, so the owner can review it quickly:

```gherkin
Given Ali paid 5,000 for order A-17
When the store manager refunds 6,000
Then the refund is refused with "Refund is more than the amount paid"
And order A-17 still shows 5,000 paid and nothing refunded
```

`/qa-kit:plan-feature` writes the file, `/qa-kit:review-cases` suggests merges and drops, you decide,
and `/qa-kit:push-cases` sends the Keep rows to TestRail and writes the case ids back.

## Columns

| Column           | What goes in it                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| `key`            | Stable id of the case in this repo, like `PO-07`. Never reuse a key.                                               |
| `testrail_id`    | `C123` once pushed; empty before. Filled in by `push-cases`.                                                       |
| `section`        | Group heading in the plan (Create, Approve, Permissions...).                                                       |
| `title`          | The business behaviour in the owner's words, 12 words or fewer (250 characters at most).                           |
| `priority`       | `P1` money, stock, access or data loss in a common flow; `P2` wrong but recoverable or rare; `P3` cosmetic.        |
| `type`           | `Functional`, `Security` (permission and tenant cases) or `Regression` (journeys guarding existing behaviour).     |
| `level`          | Cheapest test that catches it: `ui` (empty = ui), `api` (no page, still in TestRail) or `unit` (for developers).   |
| `risks`          | Ranks from "What must never go wrong" in `.qa/business-context.md`, like `1;2`. `check` reports coverage per risk. |
| `score`          | Impact x likelihood from the independent reviewer, like `3x2` (each 1-3). Written by `cases.mjs apply-scores`.     |
| `why_it_matters` | One sentence: what the business loses if this breaks.                                                              |
| `background`     | Optional Given lines every case in the section shares. The plan prints them once per section.                      |
| `scenario`       | The case: Given/When/Then lines, one per line, `And`/`But` allowed. 3-7 lines, at most 4 When/Then pairs.          |
| `data`           | Optional Examples table: header line first, cells separated by `\|`. `<name>` in the scenario matches a header.    |
| `notes`          | Optional, one per line: the only place for technical hints (test ids, routes, waits, what a stub hides).           |
| `known_issue`    | Optional: `Expected to fail (D1)`, `May fail (...)`. The test is marked `test.fixme()` with this reason.           |
| `source`         | Optional: acceptance criterion or brief scenario the case comes from.                                              |
| `file`           | Spec file the test lives in, like `e2e/purchase/approve.spec.ts`.                                                  |
| `suggestion`     | Claude's proposal: `Keep`, `Rewrite`, `Drop` or `Merge into PO-04`, optionally `: reason`.                         |
| `decision`       | **Yours** (Gate 1): same words as `suggestion`. Empty = not reviewed. Only `Keep` rows are pushed.                 |
| `review_notes`   | Free text for the reviewer.                                                                                        |

Extra columns you add are kept.

**Files from before 0.6.0** have `preconditions`, `steps` (numbered) and `expected` (numbered to match)
instead of `scenario`. They keep working as they are. `cases.mjs migrate` converts them on request:
preconditions become Given lines, each step a When, its expected result a Then. It never changes `decision`
or `testrail_id`, and marks every converted row `Rewrite: converted to Given/When/Then, check the wording`
so you reword it in business terms.

**Writing rules** (`check` enforces them in `title`, `background` and `scenario`; `notes` is never checked;
text in quotes is the app's own wording and is skipped):

| Rule                                                                                                              | Check                                 |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| No technical words: click, button, selector, endpoint, status code, database, xpath, css                          | Error                                 |
| Borderline words: page, field, screen, form, dropdown, URL, API                                                   | Warning (fine when the owner says it) |
| Starts with Given (or has a `background`), every When followed by a Then                                          | Error                                 |
| At most 4 When/Then pairs                                                                                         | Error: split it                       |
| Every `<placeholder>` is a column in `data`                                                                       | Error                                 |
| Title of 12 words or fewer, scenario of 3-7 lines                                                                 | Warning                               |
| Every Then shows a number, a status, a quoted message or who can see what; no "correctly", "as expected", "works" | Warning                               |
| Uses `.qa/glossary.md`: no avoided words, no capitalised word missing from it                                     | Warning (off without a glossary)      |

**What reaches TestRail:** `title`, `priority`, `type`, the Given lines (background first) followed by a
"Why it matters:" line as preconditions, and one step per When/Then pair: the When lines as the step, the
Then lines as its expected result, keywords kept (the `data` table goes inside step 1). Old rows send
`preconditions` and the numbered `steps`/`expected`. `risks`, `score`, `notes`, `known_issue`, `source`,
`file` and the review columns stay in the repo, so a push only changes a TestRail case when the case itself
changed. `level: unit` rows are never pushed (a pushed one is retired); the plan lists them under "For
developers".

**Case budget:** `check --tier=low|medium|high` warns when the `ui` + `api` rows exceed the budget for the
feature's risk tier (`cases.budget` in `.qa/config.json`; defaults 6, 12, 20) and names the lowest-scoring
rows. Without `--tier` the medium budget applies.

## Reviewing (Gate 1)

1. Open the CSV, read each row as the business owner would, and fill `decision`. Fill-down works:
   start with `Keep` and change the rows that need it.
2. Remove a case: `Drop`, or `Merge into <key>` when another case should absorb it (add its checks to that
   row's scenario). Rows already in TestRail are moved to a "Retired" section on push, never deleted. A row
   that was never pushed can simply be deleted.
3. `Rewrite` means "right risk, wrong case": edit the row, then change it to `Keep`. Push refuses `Rewrite` rows.
4. Save as CSV (UTF-8) and run `check` before pushing.

## Other test management tools

The CSV doesn't depend on TestRail. Most tools import CSV with one row per case and steps in one cell,
which is this file as it is: map `title`, `scenario`, `priority` and `type` in the tool's import screen
(tools with a BDD or Gherkin case type take `scenario` directly) and filter to `decision = Keep`. For tools that want one row per step (TestRail's
importer does), use `cases.mjs testrail`.
