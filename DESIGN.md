---
name: TSO
description: Inventory and accounting platform for growing SMBs in South Asia
colors:
  accent: "oklch(0.48 0.19 255)"
  accent-hover: "oklch(0.41 0.19 255)"
  accent-hero: "oklch(0.68 0.17 255)"
  accent-muted: "oklch(0.94 0.04 255)"
  accent-muted-fg: "oklch(0.28 0.12 255)"
  canvas-dark: "oklch(0.14 0.03 252)"
  canvas-dark-surface: "oklch(0.21 0.034 252)"
  canvas-light: "oklch(0.99 0.003 255)"
  canvas-light-surface: "oklch(0.97 0.005 255)"
  ink-primary: "oklch(0.13 0.02 255)"
  ink-secondary: "oklch(0.34 0.025 255)"
  ink-tertiary: "oklch(0.44 0.018 255)"
  hero-text: "#ffffff"
  hero-sub: "oklch(0.73 0.025 255)"
  border-subtle: "oklch(0.89 0.006 255)"
  border-mid: "oklch(0.8 0.012 255)"
typography:
  display:
    fontFamily: "Bricolage Grotesque, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(2.375rem, 5vw, 3.625rem)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Bricolage Grotesque, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.625rem)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Bricolage Grotesque, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  modal: "12px"
  pill: "100px"
spacing:
  gap-xs: "12px"
  gap-sm: "16px"
  gap-md: "28px"
  gap-lg: "48px"
  section-v: "clamp(4rem, 8vw, 6rem)"
  section-h: "clamp(1.5rem, 5vw, 5rem)"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  button-primary-lg:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "7px"
    padding: "14px 32px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-outline-dark:
    backgroundColor: "transparent"
    textColor: "{colors.hero-sub}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  card:
    backgroundColor: "{colors.canvas-light}"
    rounded: "{rounded.lg}"
    padding: "28px"
  card-featured:
    backgroundColor: "{colors.canvas-light}"
    rounded: "{rounded.lg}"
    padding: "32px 28px"
  input:
    backgroundColor: "{colors.canvas-light}"
    rounded: "{rounded.sm}"
    padding: "10px 13px"
---

# Design System: TSO

## 1. Overview

**Creative North Star: "The Ledger That Earns Trust"**

TSO's design system is built on a single conviction: trust is demonstrated through clarity, not claimed through decoration. Every typographic decision, every color choice, every spacing rule exists to make business owners feel informed and in control — never overwhelmed, never impressed by the wrong thing.

The visual language is restrained by principle, not by caution. The dark-panel hero contrasts deliberately with the open, near-white content sections below — a physical metaphor for the software's role: a serious operating environment that makes its records visible in daylight. Bricolage Grotesque in the headings signals precision and modern confidence; Manrope in the body is warm and readable under fluorescent office light. The blue accent earns its place through rarity: it marks interactive elements and structured data markers, never decorative surfaces.

This system explicitly rejects what PRODUCT.md names as its anti-references. First: the "Generic purple SaaS (Webflow/Framer template aesthetic) — indigo gradient blobs, glassmorphism on every card, floating purple orbs, hero stats template, eyebrows on every section." Second, and equally: "Enterprise legacy (SAP, QuickBooks Classic) — dense gray grids, no visual hierarchy, 2000s ERP feel, intimidating for non-technical users." The ledger earns trust by feeling neither like a startup template nor a legacy accounting tool.

**Key Characteristics:**

- Two-zone palette: near-black navy hero, near-white body. The contrast is the design.
- Ledger Blue used only on interactive elements and data markers — its rarity is the trust signal.
- Typography-led hierarchy; cards used only where browsability earns them.
- Framer Motion animations with `useReducedMotion()` respected on every animated element.
- OKLCH throughout; tinted toward hue 255 (blue direction) at every ramp step.

## 2. Colors: The Earner's Palette

A two-zone palette where the near-black navy hero and near-white body are distinct worlds, joined by the same blue accent family running through both zones.

### Primary

- **Ledger Blue** (`oklch(0.48 0.19 255)`, ≈ #2563EB): The single interactive accent. Used on primary buttons, active focus rings, the 20px bar mark above feature and guide card titles, and the featured plan card border. Its rarity is load-bearing — dilute it across decorative elements and the system's credibility evaporates.

- **Ledger Blue Hover** (`oklch(0.41 0.19 255)`, ≈ #1D4ED8): Hover state for interactive Ledger Blue surfaces only. Never used at rest.

### Secondary

- **Ledger Blue Lifted** (`oklch(0.68 0.17 255)`, ≈ #60A5FA): Accent on dark hero surfaces where full-saturation Ledger Blue would disappear. Quote marks in testimonials, focus outlines on dark surfaces, icon color in the hero zone.

- **Ledger Blue Muted** (`oklch(0.94 0.04 255)`, ≈ #DBEAFE): Badge and chip backgrounds. A contained tint — never a surface area.

- **Muted Foreground** (`oklch(0.28 0.12 255)`, ≈ #1E3A8A): Text on Ledger Blue Muted badges. Same family, darker.

### Neutral

- **Near-White Canvas** (`oklch(0.99 0.003 255)`, ≈ #FAFBFF): Page body background. The chroma is low (0.003) but the blue tint connects it to the accent family. Not warm-neutral beige.

- **Surface Lift** (`oklch(0.97 0.005 255)`, ≈ #F3F5FB): Alternating section backgrounds, card surfaces, input backgrounds. One step below Canvas — tonal differentiation, not a shadow.

- **Near-Black Navy** (`oklch(0.14 0.03 252)`, ≈ #151A26): Hero section background and final CTA zone. Not pure black — the hue links it to the blue family.

- **Navy Surface** (`oklch(0.21 0.034 252)`, ≈ #202739): Secondary surface within dark zones; featured testimonials, nested dark elements.

- **Hero Sub** (`oklch(0.73 0.025 255)`, ≈ #9EA5BF): Subtext, nav links, and secondary text on dark hero backgrounds.

- **Ink Primary** (`oklch(0.13 0.02 255)`, ≈ #0E1320): All headings, strong body text, high-emphasis labels on light backgrounds.

- **Ink Secondary** (`oklch(0.34 0.025 255)`, ≈ #3C455F): Body text, paragraph copy, pricing secondary details.

- **Ink Tertiary** (`oklch(0.44 0.018 255)`, ≈ #555E7B): Muted labels, feature descriptions, footer text. Confirmed ≥4.5:1 contrast on Near-White Canvas.

- **Border Subtle** (`oklch(0.89 0.006 255)`, ≈ #D8DCEA): Section dividers, card borders, FAQ separators, input strokes at rest.

- **Border Mid** (`oklch(0.8 0.012 255)`, ≈ #B5BACC): Hover-state borders on outline buttons; stronger dividers.

### Named Rules

**The Accent Rarity Rule.** Ledger Blue appears on interactive elements and data markers only — buttons, focus rings, the feature title bar mark, the featured plan border. It never appears on decorative lines, background tints, icon fills outside interactive contexts, or section separators. If Ledger Blue could be removed and the layout would still hold, it was wrong to place it there.

**The Blue-Tinted Neutral Rule.** Every neutral color in this system is tinted toward hue 255, not toward warmth. Chroma is low (0.003–0.025) but always blue-directed. Never default-tilt toward yellow or warm hues — that reads as AI beige. The palette reads as one family, even across the two zones.

## 3. Typography: Precise Authority

**Display / Heading Font:** Bricolage Grotesque (optical size 12–96, weights 700–800), with `-apple-system, BlinkMacSystemFont, sans-serif` fallback. Loaded via Google Fonts in `_document.js`.

**Body Font:** Manrope (weights 400–700), with `-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif` fallback.

**Character:** Bricolage Grotesque is geometric-but-warm, with optical-size variation that makes it unusually readable at display scale. Manrope is a geometric sans with a humanist undercurrent — dense but never cold. Both are sans-serif, but they pair on a weight-and-register axis: Bricolage commands, Manrope accompanies. The combination says "accountant who trained as an engineer," not "designer who learned accounting."

### Hierarchy

- **Display** (Bricolage 700, `clamp(2.375rem, 5vw, 3.625rem)`, line-height 1.12, letter-spacing −0.025em): Hero headline (h1) only. One per page. `text-wrap: balance`.
- **Headline** (Bricolage 700, `clamp(1.75rem, 4vw, 2.625rem)`, line-height 1.12, letter-spacing −0.025em): Section headings (h2). `text-wrap: balance`.
- **Title** (Bricolage 700, 17–19px, line-height 1.3, letter-spacing −0.015em): Component headings — feature block titles, guide card titles, FAQ questions (h3 level). `text-wrap: balance`.
- **Body** (Manrope 400–500, 14–17px, line-height 1.65–1.7): Paragraph copy, feature descriptions, FAQ answers. Max line length 65–75ch. `text-wrap: pretty` on long prose.
- **Label** (Manrope 600–700, 11–14px, line-height 1.4): Nav links, plan billing notes, testimonial attribution, footer links. All-caps (`text-transform: uppercase`, tracking `0.08em`) only in footer column headings. Never used as a section eyebrow above h2 headings.

### Named Rules

**The Heading Ceiling Rule.** Display headings are clamped to `3.625rem` maximum (~58px on desktop). No heading exceeds 6rem (96px). Above the ceiling the page shouts; below it the page speaks.

**The Tight-Track Floor Rule.** `letter-spacing: −0.025em` on display and headline. Never tighter than −0.04em — at that point letters touch and the effect reads as cramped, not designed.

**The Balance Rule.** All h1–h3 use `text-wrap: balance`. Long body paragraphs use `text-wrap: pretty`. Never ship a heading with a single orphaned word on the last line.

## 4. Elevation: Flat by Default, Depth on State

TSO surfaces are flat at rest. No ambient shadows appear under cards or list items by default. Depth surfaces only when it carries meaning: the hero product screenshot sits in deep space because it represents the software being shown; a guide card lifts on hover because it's inviting a click; the modal floats above a scrim because it demands attention before anything else can happen.

The hero zone uses radial gradient backgrounds and ambient glow animations for atmospheric depth. These are zone-specific; they do not carry into the light content sections.

### Shadow Vocabulary

- **Hover Lift** (`0 4px 16px oklch(0.1 0.02 255 / 0.08), 0 1px 4px oklch(0.1 0.02 255 / 0.06)`): Guide cards on hover only. Never at rest.
- **Hero Showcase** (`0 28px 90px oklch(0.07 0.02 255 / 0.42), 0 0 0 1px oklch(0.72 0.05 255 / 0.16)`): The hero product screenshot. Dramatic depth against the dark background. One use only.
- **AI Preview** (`0 20px 70px oklch(0.12 0.025 255 / 0.16), 0 0 0 1px {colors.border-subtle}`): Secondary product screenshot (AI assistant section). Lighter than the hero image.
- **Modal Float** (`0 24px 64px oklch(0.1 0.02 255 / 0.18)`): Modal dialogs above the scrim overlay.
- **Nav Pill** (`0 2px 16px oklch(0.1 0.02 255 / 0.25), 0 1px 3px oklch(0.1 0.02 255 / 0.14)`): The condensed floating nav pill state after scroll. Appears only after the nav condenses.

### Named Rules

**The Flat-By-Default Rule.** Every surface is flat at rest. Shadows appear only in response to state: a guide card lifts on hover, the nav pill gets a shadow after scroll condensing, the modal floats above the scrim. A card that ships with a shadow at rest has claimed importance it hasn't earned.

## 5. Components

### Buttons

TSO buttons are direct and responsive. They give crisp physical feedback on interaction without visual ceremony. No decorative shadows, no gradient fills, no icon-only ornamentation.

- **Shape:** Slightly rounded — 6px (`{rounded.sm}`) standard, 7px for the large hero CTA. Not a pill, not squared.
- **Primary:** Ledger Blue fill (`{colors.accent}`), white text, weight 600, 14px (standard) / 16px (large). Minimum height 44px. Padding 12px 20px standard, 14px 32px large.
- **Active:** `transform: scale(0.97)` at 80ms ease-out. The only button animation — a physical press confirmation. No other motion on the button component.
- **Hover:** Background shifts to Ledger Blue Hover (`{colors.accent-hover}`). No shadow, no scale at hover — only at active.
- **Focus visible:** `outline: 2px solid {colors.accent}` (hue 255), 3px offset. The focus glow hue must be 255, not 152 (green). Known bug at `Landing.module.css:1461` — must be corrected.
- **Outline (light bg):** Transparent fill, Ink Secondary text, Border Mid stroke (1.5px). Hover: border to Ink Tertiary, text to Ink Primary.
- **Outline (dark bg):** Transparent fill, Hero Sub text, hero-border stroke. Used in the hero zone alongside the primary button.

### Navigation

A two-state component: expanded at page top, condensed pill after scroll.

- **Top state (hero zone):** Full-width, flush with viewport top. Background `oklch(0.12 0.025 252 / 0.75)` with `backdrop-filter: blur(24px) saturate(160%)`. No border, no shadow. `prefers-reduced-transparency: reduce` fallback removes the blur and uses a solid dark bg.
- **Condensed state (after scroll):** Max-width 900px, 14px border-radius (`{rounded.xl}`), 14px from viewport top. Border `oklch(0.45 0.04 255 / 0.28)` appears; Nav Pill shadow appears. Transition uses `cubic-bezier(0.23, 1, 0.32, 1)` at 500ms — a deliberate, weighted transition.
- **Light mode (past hero):** When the page scrolls into light content sections, the nav switches context: white-translucent background, dark ink text.
- **Mobile (< 1060px):** Nav links and actions collapse. A 44px hamburger button replaces them. Mobile menu slides below the nav bar with a 14ms fade+translate animation.

### Feature Blocks

A bordered cell grid — not a card grid. This distinction is intentional and must be preserved.

- **Grid structure:** `border: 1px solid {colors.border-subtle}` on the outer grid container, `border-radius: {rounded.md}`, `overflow: hidden`. Individual cells share borders via the grid's 1px edges.
- **Cell padding:** 32px 28px.
- **Header mark:** A 20px × 3px Ledger Blue bar above every feature title, rendered as `::before` on the title element. This is the only decorative use of Ledger Blue in the system. It must appear on all cells in a given grid or none.
- **Title:** `{typography.title}`, Ink Primary.
- **Body:** `{typography.body}`, Ink Tertiary.
- **Hover:** Cell background shifts from Canvas Light to Surface Lift. No shadow, no scale.

**The Mark Rule.** The 20px blue bar mark above feature titles and guide card titles is a system-level element, not decoration. It must be used consistently: all cells in a feature grid carry the mark, or none do. Never apply the mark as an isolated heading accent outside a grid or card context.

### Guide Cards

For benefit lists and comparative content where cards are the right affordance.

- **Shape:** 1px `{colors.border-subtle}` border, `{rounded.lg}` radius (10px), no default shadow.
- **Background:** Surface Lift (`{colors.canvas-light-surface}`).
- **Hover:** Border shifts to `{colors.border-mid}`, `translateY(-2px)`, Hover Lift shadow. The guide arrow shifts to Ledger Blue and moves 3px right.
- **Header mark:** Same 20px blue bar as feature blocks. Same consistency rule applies.
- **Arrow:** `{typography.label}`, Ink Tertiary at rest; Ledger Blue on card hover.

### Pricing Cards

- **Default card:** 1px `{colors.border-subtle}`, `{rounded.lg}`, no shadow, Canvas Light background.
- **Featured card:** 1.5px Ledger Blue border. No background change — the border alone distinguishes it. No shadow, no elevated float.
- **Price display:** Amount uses Bricolage 800 at 40px, Ink Primary. Currency symbol at 18px aligned to top. No gradient treatment. No big-number hero-metric pattern.
- **CTA:** Full-width, minimum 44px height. Filled (button-primary) for the featured plan; outline (button-outline) for others.
- **Savings badge:** Ink-on-muted-green tint (`oklch(0.36 0.13 152)` on `oklch(0.95 0.04 152)`). This is the only non-blue-family color in the system — used only for the savings indicator.

### Inputs / Fields

- **Style:** 1.5px `{colors.border-subtle}` border at rest, `{rounded.sm}` (6px) radius, Canvas Light background.
- **Focus:** Border shifts to Ledger Blue. Inner glow: `0 0 0 3px oklch(0.48 0.19 255 / 0.12)`. Hue must be 255, matching the accent.
- **Placeholder:** `{colors.ink-tertiary}` — confirmed ≥4.5:1 on Canvas Light. Do not use lighter grays for "elegance."
- **Labels:** `{typography.label}`, Ink Secondary, weight 600.

### FAQ Accordion

A minimal disclosure pattern — no cards, no background tints, just ruled separators.

- **Separator:** 1px `{colors.border-subtle}` on first item top and all items bottom.
- **Toggle button:** Full-width, no background, padding 20px 0. Question text at 15px weight 600 Ink Primary. Chevron (18px, Ink Tertiary) rotates 180° on open.
- **Animation:** `grid-template-rows: 0fr → 1fr`. This is a height animation without animating the `height` property directly — acceptable layout animation via grid tracks.
- **Reduced motion:** All transitions disabled for this component; open/close is instant.

## 6. Do's and Don'ts

### Do:

- **Do** use Ledger Blue exclusively for interactive elements and data markers. Its rarity signals "you can act here" or "this number matters" — dilute it and the signal disappears.
- **Do** confirm body text is at minimum `{colors.ink-tertiary}` (`oklch(0.44 0.018 255)`) on light backgrounds. This is the confirmed floor for ≥4.5:1 WCAG AA contrast on Canvas Light.
- **Do** use Bricolage Grotesque for all h1–h3 and component titles; Manrope for all body, paragraph, and label text. No third font. No monospace for "technical" affect.
- **Do** vary section spacing for rhythm — generous vertical gaps between sections, tighter groupings inside them. Uniform spacing collapses hierarchy.
- **Do** respect `prefers-reduced-motion` on every animated element. The project standard is Framer Motion's `useReducedMotion()` hook; CSS animations use `@media (prefers-reduced-motion: reduce)`.
- **Do** use `text-wrap: balance` on h1–h3 and `text-wrap: pretty` on body paragraphs.
- **Do** shadow surfaces only in response to state — hover, scroll-triggered nav condensing, modal opening. Flat at rest.
- **Do** show pricing in PKR or the user's local currency where the audience is South Asia. Localization is a product feature here, not an afterthought.
- **Do** use `transform: scale(0.97)` at 80ms for button active states. Do not add the same transform to hover — only to press.

### Don't:

- **Don't** use the generic purple SaaS aesthetic — no indigo gradient blobs, no glassmorphism on content cards, no floating colored orbs, no hero-metric templates (big number + small label + gradient accent). PRODUCT.md names this the primary anti-reference.
- **Don't** use enterprise-legacy visual patterns — no dense gray grids with no visual hierarchy, no 2000s ERP feel, no tables without spacing or structure. PRODUCT.md names this the opposite failure mode.
- **Don't** use gradient text (`background-clip: text` with a gradient background). No text that uses a gradient fill, no matter how subtle.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored stripe accent on cards, list items, or callouts. The system uses a top-bar mark (`::before`) on feature and guide titles — not a side stripe.
- **Don't** build identical card grids with icon + heading + text repeated uniformly. Feature blocks use a border-collapse grid by design. Cards are for genuinely comparative, browsable content only.
- **Don't** put all-caps eyebrow labels (`panelKicker`) above every section heading. The system uses this pattern in exactly two named positions per page (AI assistant section and solution section). One deliberate accent is voice; an eyebrow on every section is AI grammar.
- **Don't** use numbered section markers (01 / 02 / 03) as default structural scaffolding. Numbers earn their place only in sequences where the order carries meaning the reader needs.
- **Don't** animate CSS layout properties — `width`, `height`, `padding`, `margin`, `max-width`. Use `transform`, `opacity`, or `grid-template-rows` instead. Known issue: `transition: max-width, width` on `.nav` at `Landing.module.css:75` must be replaced.
- **Don't** use green hue (152) for focus rings. All focus outlines must use Ledger Blue (hue 255). Known bug at `Landing.module.css:1461`.
- **Don't** apply `backdrop-filter` blur to content cards or sections for decoration. Blur appears only on the nav (functional floating layer) and mobile menu (same rationale). Not on feature blocks, guide cards, or testimonials.
- **Don't** ship the uniform `fadeUp` animation on every section. The identical entrance applied to every section is the motion equivalent of the eyebrow on every heading. Each section's entrance should be appropriate to what it reveals.
