# StockFlow Landing Page — Design Spec

**Date:** 2026-05-03
**Issue:** #178
**Status:** Approved

---

## Overview

A public-facing marketing landing page for StockFlow (the inventory management SaaS product). The page targets B2B buyers — accountants, operations managers, and founders at SMBs in South Asia. It is separate from the existing authenticated dashboard.

---

## Route

- **URL:** `/landing`
- The existing dashboard at `/` is unchanged.
- The page is fully public (no auth required).

---

## Visual Design

**Theme:** Aurora Light liquid glass

- Background: soft gradient (`#f0f4ff → #faf5ff → #f0fdf4`)
- Floating radial glow orbs (indigo and emerald) behind content
- Glass panels: `background: rgba(255,255,255,0.65)`, `backdrop-filter: blur(20px)`, white border
- Primary color: indigo/violet gradient (`#6366f1 → #7c3aed`)
- Body text: `#1e1b4b` (dark indigo), muted text: `#6b7280`
- No em-dashes anywhere in copy; use commas or periods instead

**Implementation:** CSS Modules (`styles/Landing.module.css`) — zero new dependencies.

---

## Sections (top to bottom)

### 1. Sticky Navigation Bar

- Logo: "StockFlow" with gradient text
- Links: Features, Pricing, Testimonials, FAQ — each scrolls to the matching `id` anchor
- CTA button: "Request a Demo" — opens the demo modal
- Style: glass bar (`backdrop-filter: blur(20px)`, white semi-transparent background), sticky on scroll

### 2. Hero

- Badge pill: "Inventory Management for Modern Businesses"
- Headline (3 lines): "Run Your Inventory / Smarter, Faster, / With Confidence." — gradient on middle line
- Subheadline: single sentence, centered, max-width 520px
- Two CTAs: "Request a Demo" (opens modal) and "See Pricing" (scrolls to `#pricing`)
- Dashboard stat card below CTAs: glass card with 4 stat chips (Total Sales, Total Purchases, Items in Stock, Order Accuracy) — decorative placeholder data

### 3. Features (`id="features"`)

- Section label + heading + subheading (all centered)
- 3-column grid (2-column on tablet, 1-column on small mobile)
- 6 feature cards with colored icon backgrounds:
  1. Real-Time Inventory
  2. Purchase Orders
  3. Integrated Ledger
  4. Reports and Analytics
  5. Multi-Company Support
  6. AI Assistant

### 4. Pricing (`id="pricing"`)

- Wrapped in a glass panel with rounded corners
- Monthly / 6 Months / Annual toggle (active state uses gradient button)
- 3-column plan grid:

| Plan     | Price | Billing   |
| -------- | ----- | --------- |
| Silver   | $20   | /month    |
| Gold     | $100  | /6 months |
| Platinum | $150  | /year     |

- Gold has "Most Popular" badge and a filled gradient CTA button
- All plan CTAs open the demo modal
- Toggle is cosmetic in v1 (prices are fixed per plan; real billing toggle is a future enhancement)

### 5. Testimonials (`id="testimonials"`)

- 3-column card grid (1-column on mobile)
- 3 placeholder testimonials representing the three buyer personas (Finance Manager, Operations Lead, Founder)
- Avatar initials with gradient backgrounds, star ratings, quote text centered

### 6. FAQ (`id="faq"`)

- Collapsible accordion — clicking a question expands the answer; opening one collapses any previously open item
- 4 questions covering: multi-company, data security, cancellation policy, onboarding time
- Max-width 680px, centered

### 7. Final CTA Banner

- Full-width glass panel with gradient border
- Heading + subtext + "Request a Demo" button (opens modal)

### 8. Footer

- 4-column grid (2-column on mobile):
  - **Brand:** Logo + tagline
  - **Product:** Features, Pricing, Testimonials, FAQ (all scroll to page anchors)
  - **Company:** About (`/about`), Blog (`/blog`), Contact Us (opens demo modal)
  - **Legal:** Privacy Policy (`/privacy`), Terms of Service (`/terms`)
- Bottom bar: copyright + "Built for SMBs in South Asia"

---

## Demo Modal

Triggered by all "Request a Demo" and "Contact Us" actions. A glassmorphism modal overlaying the page with:

- Fields: Full Name, Business Email, Company Name, Team Size (select)
- Submit button: "Submit Request"
- Close: X button, click-outside, Escape key
- Form submission in v1 logs to console (real backend integration is a future task)

---

## Responsiveness

| Breakpoint | Changes                                                                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `> 768px`  | Full desktop layout                                                                                                                 |
| `<= 768px` | Nav links hidden, hero font 32px, features 2-col, pricing 1-col, testimonials 1-col, footer 2-col, plan toggle stretches full width |
| `<= 400px` | Features 1-col                                                                                                                      |

---

## File Structure

```
pages/
  landing.js               # Page component
styles/
  Landing.module.css        # All landing page styles
```

No new dependencies. No changes to existing routes, auth, or components.

---

## Out of Scope (v1)

- Real form submission / email integration
- Pricing toggle that dynamically changes prices
- Changelog, About, Blog, Privacy, Terms pages (links are placeholders)
- Animations / scroll transitions
- A/B testing or analytics events
