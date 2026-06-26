# Product

## Register

brand

## Users

**Landing page (founders / decision-makers):** Small business owners in South Asia — Pakistan, India, Bangladesh — who are currently tracking inventory in spreadsheets or aging ERP software. They are evaluating StockFlow to replace a painful status quo. They need to feel confident in 30 seconds that this is serious, trustworthy software that won't embarrass them in front of their accountant.

**App UI (ops + finance managers):** Operations leads and finance managers who use the product daily. They are doing purchase orders, reconciling ledger entries, checking stock levels, and generating reports. Their context is a desktop browser during business hours. Speed and clarity matter more than polish — they want to get in, do the task, get out.

## Product Purpose

StockFlow is an inventory management and accounting platform for growing SMBs in South Asia. It replaces the spreadsheet + manual-ledger workflow with real-time stock tracking, purchase order approvals, an integrated double-entry ledger, cheque tracking, multi-company support, and reporting. The goal is to make a business owner feel like they have a finance team without hiring one.

Success looks like: a founder in Lahore who used to spend Fridays reconciling spreadsheets now spends 20 minutes on StockFlow and has confidence in their numbers.

## Brand Personality

**Three words:** Precise. Approachable. Reliable.

**Voice:** Calm and direct — speaks like a trusted accountant, not a startup pitch deck. No hype, no jargon. If a feature is useful, say what it does; don't dress it up.

**Emotional goal for the landing page:** The visitor should feel: _"This looks like it was built by people who understand business — I can trust it with real money."_

**Emotional goal for the app:** The user should feel: _"I know where I am and what to do next."_ No surprises, no clutter, no confusion about state.

**Reference:** Stripe — serious typography, clear information hierarchy, trustworthy through restraint. Polished without being flashy. Design that signals competence.

## Anti-references

- **Generic purple SaaS** (Webflow/Framer template aesthetic): indigo gradient blobs, glassmorphism on every card, floating purple orbs, hero stats template, eyebrows on every section. This is the current landing page's problem — it looks like the 10,000th AI-generated SaaS site.
- **Enterprise legacy** (SAP, QuickBooks Classic): dense gray grids, no visual hierarchy, 2000s ERP feel, intimidating for non-technical users.

## Design Principles

1. **Trust through clarity** — every screen should make the user feel informed, not overwhelmed. If something is unclear, simplify it rather than decorating around it.
2. **Restraint is the brand** — the current landing page overuses glass, gradients, and animation. StockFlow's visual confidence comes from typography and whitespace, not effects.
3. **Show capability, don't claim it** — avoid superlatives ("world-class", "powerful") in copy and in design. Let the actual feature list and UX prove it.
4. **South Asia context is a feature** — PKR amounts, local business roles (proprietor, accounts manager), regional compliance (GST, tax treatment) make this software feel built-for-us, not localized-for-us.
5. **App screens earn their density** — the dashboard and data tables can be information-dense; that's expected in a business tool. The landing page earns attention with breathing room and hierarchy.

## Accessibility & Inclusion

- Target WCAG 2.1 AA minimum across all surfaces
- Body text contrast ≥ 4.5:1 against background (the current landing page fails this on muted gray text over near-white)
- The South Asia user base may include users on older Android devices and mid-range screens — no WebGL, no heavy CSS filter effects that tank GPU performance
- Reduced motion support is required: every animation needs a `prefers-reduced-motion` alternative
