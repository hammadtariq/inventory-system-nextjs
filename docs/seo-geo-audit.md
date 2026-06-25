# SEO/GEO Audit

Date: 2026-06-26

## Scope

This audit covers crawlability, indexation, page intent, titles, internal links, structured data, source citations, and answer-first content for StockFlow public pages.

## Priority Queries

| Query                                   | Target page                      | Local status |
| --------------------------------------- | -------------------------------- | ------------ |
| inventory management software           | `/inventory-management-software` | Pass         |
| inventory accounting software           | `/inventory-accounting-software` | Pass         |
| inventory software for South Asian SMBs | `/inventory-software-south-asia` | Pass         |

## Ranked Gaps

| Rank | Impact   | Gap                                                                                            | Evidence                                                                                                                                   | Status             |
| ---- | -------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| 1    | Resolved | Production deployment must serve the current SEO build on `www.treesols.com`.                  | Live crawl returns `200` for `/`, `/sitemap.xml`, and `/llms.txt`; public pages render canonical, `index,follow`, and Open Graph metadata. | Fixed              |
| 2    | Resolved | Priority answer pages needed stronger internal linking between related query targets.          | Each priority page now links to the other two priority answer pages; local audit and live crawl both pass this check.                      | Fixed              |
| 3    | High     | Live search/AI benchmark needs the new domain indexed before answer inclusion can be measured. | Search benchmark for `site:www.treesols.com` and exact StockFlow titles does not yet surface this new domain.                              | Pending indexation |
| 4    | Resolved | Public pages needed explicit canonical/index/social metadata.                                  | `/`, `/about`, `/privacy`, `/terms`, and priority pages render `index,follow`, canonical, and Open Graph metadata locally and live.        | Fixed              |
| 5    | Resolved | Private app and auth utility routes could be indexed as app shells.                            | `/dashboard`, `/inventory`, `/login`, and `/accept-invite` render `noindex,nofollow` locally and live.                                     | Fixed              |
| 6    | Resolved | Priority queries needed answer-ready pages with citations and structured data.                 | The three priority pages render answer headings, JSON-LD, source citations, and are listed in `sitemap.xml`, `robots.txt`, and `llms.txt`. | Fixed              |

## Repeatable Local Audit

Run:

```sh
pnpm seo:audit
```

In environments where `pnpm` is running under a Node version outside the repo engine range, run the script directly:

```sh
node scripts/seo-audit.js
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

- `/`
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
- related internal links to the other priority answer pages

Protected or utility surfaces checked:

- `/dashboard`
- `/inventory`
- `/login`
- `/accept-invite`

Each renders `noindex,nofollow`.

## Live Benchmark Evidence

Deployment `dpl_DBCykdZ3o8HVuptr3YSSr9US7XCV` is aliased to `https://www.treesols.com`.

Live crawl checks:

```sh
curl -I https://www.treesols.com/
curl -I https://www.treesols.com/sitemap.xml
curl -I https://www.treesols.com/llms.txt
```

Current result:

- `/`, `/sitemap.xml`, and `/llms.txt` return `200`.
- Public pages render canonical URLs, `index,follow`, Open Graph URLs, and JSON-LD on the landing/priority pages.
- `/dashboard`, `/inventory`, `/login`, and `/accept-invite` render `noindex,nofollow`.
- Priority pages pass source citation, answer-first heading, and related internal-link checks.

External search benchmark queries run:

- `site:www.treesols.com stockflow inventory management software`
- `site:www.treesols.com/inventory-management-software`
- `site:www.treesols.com/inventory-accounting-software`
- `Inventory Management Software for SMBs StockFlow`
- `Inventory Accounting Software for SMBs StockFlow`

Current result: the new domain does not yet appear. The visible results are unrelated StockFlow/competitor pages, so the remaining high-impact gap is external indexation/answer-engine inclusion lag after deployment, not a current crawlability or page-quality failure in the repo.
