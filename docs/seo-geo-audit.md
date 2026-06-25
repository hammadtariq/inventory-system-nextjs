# SEO/GEO Audit

Date: 2026-06-25

## Scope

This audit covers crawlability, indexation, page intent, titles, internal links, structured data, source citations, and answer-first content for StockFlow public pages.

## Priority Queries

| Query                                   | Target page                      | Local status |
| --------------------------------------- | -------------------------------- | ------------ |
| inventory management software           | `/inventory-management-software` | Pass         |
| inventory accounting software           | `/inventory-accounting-software` | Pass         |
| inventory software for South Asian SMBs | `/inventory-software-south-asia` | Pass         |

## Ranked Gaps

| Rank | Impact   | Gap                                                                                                 | Evidence                                                                                                                                   | Status               |
| ---- | -------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| 1    | Critical | `stockflow.app` does not resolve publicly, so search engines and AI crawlers cannot fetch any page. | `curl -I https://stockflow.app/landing` returns `Could not resolve host`; `dig +short stockflow.app` returns no records.                   | Blocked outside repo |
| 2    | High     | Live search/AI benchmark cannot validate indexation or answer inclusion while DNS is unavailable.   | Search results for `site:stockflow.app` return unrelated StockFlow/competitor pages, not this site.                                        | Blocked outside repo |
| 3    | Resolved | Public pages needed explicit canonical/index/social metadata.                                       | `/landing`, `/about`, `/privacy`, `/terms`, and priority pages now render `index,follow`, canonical, and Open Graph metadata locally.      | Fixed                |
| 4    | Resolved | Private app and auth utility routes could be indexed as app shells.                                 | `/`, `/inventory`, `/login`, and `/accept-invite` render `noindex,nofollow` locally.                                                       | Fixed                |
| 5    | Resolved | Priority queries needed answer-ready pages with citations and structured data.                      | The three priority pages render answer headings, JSON-LD, source citations, and are listed in `sitemap.xml`, `robots.txt`, and `llms.txt`. | Fixed                |

## Repeatable Local Audit

Run:

```sh
pnpm seo:audit
```

Expected local pass output:

- `summary.critical: 0`
- `summary.high: 0`
- `summary.medium: 0`
- `summary.indexablePages: 7`
- `summary.priorityQueries: 3`
- every priority query status is `pass`

## Local Crawl Evidence

Built app crawl checks passed for:

- `/landing`
- `/about`
- `/privacy`
- `/terms`
- `/inventory-management-software`
- `/inventory-accounting-software`
- `/inventory-software-south-asia`

Each configured public page renders:

- `<meta name="robots" content="index,follow" />`
- canonical URL
- Open Graph title

Priority pages also render:

- JSON-LD
- answer-first question headings
- source citations

Protected or utility surfaces checked:

- `/`
- `/inventory`
- `/login`
- `/accept-invite`

Each renders `noindex,nofollow`.

## Live Benchmark Gate

The external benchmark can continue only after `stockflow.app` resolves and serves the built app. After DNS/deployment is fixed, rerun:

```sh
curl -I https://stockflow.app/landing
curl -I https://stockflow.app/sitemap.xml
curl -I https://stockflow.app/llms.txt
dig +short stockflow.app
```

Then rerun target-query checks across search engines and AI answer engines for:

- `site:stockflow.app stockflow inventory management software`
- `site:stockflow.app/inventory-management-software`
- `site:stockflow.app/inventory-accounting-software`
- `Inventory Management Software for SMBs StockFlow`
- `Inventory Accounting Software for SMBs StockFlow`
