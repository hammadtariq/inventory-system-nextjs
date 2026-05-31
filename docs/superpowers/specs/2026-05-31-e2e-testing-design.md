# E2E Testing Automation — Design Spec

**Date:** 2026-05-31  
**Status:** Implemented

---

## Overview

A `/test-flows` slash command that uses Playwright MCP browser automation to execute the complete user flow test suite for the inventory system. Tests every module in correct business dependency order and prints a pass/fail summary.

---

## Problem Statement

The system has 27 unit tests covering API handlers, but no browser-level end-to-end tests. There was no persistent, repeatable way to verify that all user flows work correctly together — especially cross-module flows like Purchase → Inventory → Sales → Ledger that involve multi-step state changes.

---

## Approach: Playwright MCP Skill

A Claude Code skill (slash command) that instructs Claude to use the already-available Playwright MCP tools to drive the browser through every flow. No additional npm packages required.

**Why this approach:**
- Playwright MCP is already active in this project's Claude Code session
- A skill file is persistent across sessions (unlike conversation context)
- Zero infrastructure: no CI config, no test runner setup, no browser install step
- Self-documenting: the skill file doubles as the test playbook

---

## System User Flow Map

### Dependency Tree

```
Login
  └── Company (supplier) ──────────────────────────────────┐
        └── Items (product catalog, per company)            │
              └── Purchase Order (PENDING)                  │
                    └── Approve PO ──► Inventory ↑ (onHand += noOfBales)
                                   ──► Ledger DEBIT entry for Company
                          └── Company Payment ──► Ledger CREDIT for Company

  └── Customer (buyer) ────────────────────────────────────┐
        └── [Requires approved PO to have inventory]       │
              └── Sale Order (PENDING)                     │
                    └── Approve Sale ──► Inventory ↓ (onHand -= noOfBales)
                                     ──► Ledger CREDIT entry for Customer
                          └── Customer Payment ──► Ledger DEBIT for Customer
                          └── Sale Return ──► Inventory ↑ (onHand restored)
                                          ──► Ledger DEBIT for Customer
```

### Module Inventory

| Module | Route | Key Actions | Role Required |
|---|---|---|---|
| Authentication | `/login` | Login, Logout | Any |
| Company | `/company` | Create, Edit, Delete | ADMIN/EDITOR |
| Items | `/items` | Create, Edit, Delete | ADMIN/EDITOR |
| Customer | `/customers` | Create, Edit, Delete | ADMIN/EDITOR |
| Purchase | `/purchase` | Create, Approve, Cancel | Create: Any; Approve: ADMIN |
| Inventory | `/inventory` | View, Filter, Export | Any (read-only) |
| Sales | `/sales` | Create, Approve, Cancel | Create: Any; Approve: ADMIN |
| Ledger | `/ledger` | Create Transaction, View | Any |
| Sale Returns | `/sale-returns` | Create Return | ADMIN |
| Cheques | `/cheques` | View, Update Status | Any (update: ADMIN) |
| Reports | `/reports` | View Sales/Purchase/Inventory/Customer | Any |
| Users | `/users` | Invite, Edit, Delete | ADMIN |
| Quotation | `/quotation` | Create, Export PDF | Any |

### Status Enums

| Model | States | Transitions |
|---|---|---|
| Purchase | PENDING → APPROVED | ADMIN only |
| Purchase | PENDING → CANCEL | ADMIN only |
| Sale | PENDING → APPROVED | ADMIN only |
| Sale | PENDING → CANCEL | ADMIN only |
| Cheque | PENDING → PASS / RETURN / CANCEL | ADMIN only |

### Ledger Entry Logic

| Trigger | Entry Type | Account |
|---|---|---|
| Purchase approved | DEBIT | Company (payable — we owe them) |
| Company payment made | CREDIT | Company (reduces payable) |
| Sale approved | CREDIT | Customer (receivable — they owe us) |
| Customer payment received | DEBIT | Customer (reduces receivable) |
| Sale return created | DEBIT (INVENTORY_RETURN) | Customer (reduces receivable) |

### Role Permissions

| Action | ADMIN | EDITOR |
|---|---|---|
| Create company/customer/items | ✅ | ✅ |
| Create purchase/sale | ✅ | ✅ |
| Make ledger payments | ✅ | ✅ |
| **Approve** purchase/sale | ✅ | ❌ |
| **Delete** records | ✅ | ❌ |
| **Create sale return** | ✅ | ❌ |
| **Manage cheques** | ✅ | ❌ |
| Create/invite users | ✅ | ❌ |

---

## Test Data Strategy

Each run generates a timestamp suffix (last 6 digits of `Date.now()`) to avoid conflicts:

| Entity | Name Pattern |
|---|---|
| Company | `E2E Supplier {TS}` |
| Item | `e2eitem{TS}` (lowercase required by API) |
| Customer | First: `E2E`, Last: `Tester{TS}`, Email: `e2e{TS}@test.com` |
| Purchase | 10 bales @ Rs100/bale = Rs1000 total |
| Sale | 5 bales @ Rs150/bale = Rs750 total |
| Sale Return | 2 bales |

**Expected inventory state progression:**

| After Step | On Hand |
|---|---|
| Before purchase | 0 |
| After PO approved | 10 |
| After sale approved | 5 |
| After sale return | 7 |

---

## Skill File Locations

| File | Purpose |
|---|---|
| `~/.claude/skills/test-flows/SKILL.md` | Personal skill — makes `/test-flows` available globally in Claude Code |
| `.claude/skills/test-flows.md` | Project copy — tracked in git, shared with team |

---

## How to Use

1. Ensure dev server is running: `pnpm dev`
2. Type `/test-flows` in Claude Code
3. Claude opens the browser via Playwright MCP, runs all 22 test steps, prints a pass/fail summary

---

## Test Coverage: 22 Steps Across 9 Phases

| Phase | Steps | What it validates |
|---|---|---|
| 0 — Auth | 2 | Login success, session cookie persistence |
| 1 — Company | 1 | Company creation and table visibility |
| 2 — Items | 1 | Item creation linked to company |
| 3 — Customer | 1 | Customer creation |
| 4 — Purchase | 4 | PO create → approve → inventory +10 → ledger DEBIT |
| 5 — Sales | 4 | Sale create → approve → inventory -5 → ledger CREDIT |
| 6 — Payments | 2 | Company cash payment, customer cash payment |
| 7 — Sale Return | 2 | Return 2 bales → inventory +2 restored |
| 8 — Reports | 3 | Sales, Purchase, Inventory report tabs show data |
| 9 — Logout | 1 | Session cleared on logout |
| **Total** | **22** | |

---

## Known Limitations

- Tests create real data in the database — use a local dev/test database only
- Sale return creation requires navigating to the sale detail page (`/sales/[id]`) — the exact UI for submitting returns should be verified by taking a snapshot during the run
- Cheques and Quotation flows are not covered in this initial version
- EDITOR role permission testing (verify EDITOR cannot approve) is not covered in this version
