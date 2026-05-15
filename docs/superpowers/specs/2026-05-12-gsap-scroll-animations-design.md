# GSAP Scroll Animations — Landing Page Design Spec

**Date:** 2026-05-12  
**File:** `pages/landing.js` + `styles/Landing.module.css`  
**Status:** Approved

---

## Overview

Add bold, dramatic GSAP ScrollTrigger-driven scroll animations to the StockFlow landing page. The animation personality is high-impact: words snap in, sections pin, cards wipe directionally, and scroll scrubbing creates cinematic depth.

Add subtle cinematic depth enhancements throughout the experience using layered parallax, blur-to-focus transitions, ambient background motion, and section-to-section continuity animations to create a more premium 2026-style motion system.

---

## Animation Stack

| Library                  | Responsibility                                                                    |
| ------------------------ | --------------------------------------------------------------------------------- |
| **GSAP + ScrollTrigger** | All scroll-driven animations: reveals, parallax, pins, scrubbed timelines         |
| **Framer Motion**        | Kept for hover/tap micro-interactions on buttons and `AnimatePresence` modal only |

GSAP is free tier (no Club plugins). No `SplitText` (paid) — word-splitting done manually via a `splitWords()` utility. No `ScrollSmoother` (Club) — use `scrub: 1` on ScrollTrigger for smooth playback.

---

## Implementation Architecture

### Hook: `useGSAP` pattern

All GSAP animations live in a single `useEffect` in `Landing()` (or extracted to `hooks/useScrollAnimations.js`) using `gsap.context()` for proper React cleanup. Refs are attached to section wrappers.

### Word-split utility

A local `splitWords(element)` function wraps each word in a `<span class="word">` with `overflow: hidden` + inner `<span class="word-inner">` for clip-path animation. Called once on mount, cleaned up on unmount.

### Section transition continuity

As users scroll between sections, outgoing sections subtly scale down (`scale: 1 → 0.96`) and reduce opacity (`opacity: 1 → 0.7`) while the next section rises into view. This creates cinematic continuity between sections instead of isolated animations.

---

## Section-by-Section Animation Spec

### Nav (on page load, not scroll)

- Logo: `gsap.from(".logo", { x: -30, opacity: 0, duration: 0.5, ease: "power3.out" })`
- Nav links: stagger `x: 20 → 0, opacity: 0 → 1` with `stagger: 0.06`
- CTA button: `scale: 0.8 → 1` with `ease: "back.out(1.7)"`
- On scroll past hero: add CSS class to nav for hard `box-shadow` via ScrollTrigger `toggleClass`

### Hero (on page load + scroll)

**Load animation:**

- Hero badge: `y: -20, opacity: 0 → 1`, `duration: 0.4`
- Heading words: split into `<span>` words; each word inner clip-path `inset(100% 0 0 0) → inset(0% 0 0 0)` with `stagger: 0.07`, `ease: "power4.out"`, `duration: 0.65`
- Sub-paragraph: `opacity: 0, y: 20 → 0`, delayed 0.4s
- CTA buttons: stagger in from `y: 20`
- Hero card: `opacity: 0, y: 40 → 0`, delayed 0.6s

**Scroll parallax:**

- Hero card: ScrollTrigger scrub, `y: 0 → -60` as hero scrolls out
- Background gradient/orb layer slowly scales `1 → 1.08` during scroll for subtle cinematic depth
- Floating ambient glow motion loops slowly in the background using infinite GSAP timeline (`yoyo: true`, `repeat: -1`)

### Features

- Section **pins** for 400px of scroll (`pin: true, scrub: false`)
- Cards animate in during pin window with stagger `x: ±120 → 0` (odd cards from left, even from right), `opacity: 0 → 1`
- Add subtle cinematic depth:

  - `rotateX: 8 → 0`
  - `filter: blur(8px) → blur(0px)`
  - slight scale correction `0.96 → 1`

- Each card icon: `scale: 0 → 1`, `ease: "elastic.out(1, 0.5)"`, delayed after card
- Background gradient/noise layer slowly animates during pin window to avoid static feeling
- Subtle layered parallax between content and background elements

### Pricing

- `planCard` elements:

  - `y: 100 → 0`
  - `opacity: 0 → 1`
  - `scale: 0.92 → 1`
  - `filter: blur(10px) → blur(0px)`
  - `stagger: 0.12`
  - `ease: "power3.out"`

- Slight overlap in stagger timing for smoother premium motion flow
- Popular badge: `scale: 0 → 1.15 → 1`, `ease: "back.out(2)"` after cards settle

### Testimonials

- **Horizontal scroll** via pinned ScrollTrigger: the testimonials grid translates `x: 0 → -(totalWidth - viewportWidth)px` (calculated dynamically from DOM at mount time) while the section is pinned, creating a scroll-driven horizontal card reveal
- Each card also `opacity: 0 → 1` as it enters the horizontal view
- Add layered depth motion:

  - Slight staggered parallax speed differences between cards
  - Avatar/image elements move subtly independent from card body
  - Active centered card scales slightly (`1 → 1.03`) for focus emphasis

- Add subtle blur-to-focus transitions as cards enter viewport

### FAQ

- Each `.faqItem`:

  - clip-path wipe from left `inset(0 100% 0 0) → inset(0 0% 0 0)`
  - `y: 24 → 0`
  - `opacity: 0 → 1`
  - `filter: blur(6px) → blur(0px)`
  - `stagger: 0.1`
  - `ease: "power3.inOut"`
  - `duration: 0.55`

- Slight overlap timing between FAQ items for smoother reveal rhythm

### Final CTA

- Heading words: same clip-path split as hero, `stagger: 0.08`
- Sub-text: `opacity: 0, y: 16 → 0` after heading
- CTA button: `scale: 0.85, opacity: 0 → 1`, `ease: "back.out(1.7)"`
- Container border: `opacity: 0 → 1` on enter, `duration: 0.8`
- Ambient glow/orb background motion continues subtly after reveal
- Decorative gradient layer slowly pulses using low-intensity infinite timeline animation

---

## CSS Changes

- Add `.word` and `.word-inner` utility classes to `Landing.module.css` for the split-word spans
- Add `.navScrolled` class for the nav box-shadow state toggled by ScrollTrigger
- Add `overflow: hidden` to heading elements that use word-split to prevent flash during animation
- Add optional utility classes for:

  - ambient glow layers
  - animated gradient backgrounds
  - blur-depth reveal states
  - layered parallax wrappers

---

## What Stays Unchanged in Framer Motion

- `whileHover={{ y: -6 }}` on feature/testimonial cards
- `whileHover={{ scale: 1.03 }}` / `whileTap={{ scale: 0.97 }}` on all buttons
- `AnimatePresence` + `motion.div` for demo modal open/close
- Framer's `whileInView` variants are **removed** from sections that GSAP now controls (to avoid double-animation conflicts)

---

## Constraints

- GSAP free tier only (no Club plugins)
- Must not break mobile — ScrollTrigger animations use `matchMedia` to disable pinning on `max-width: 768px`
- Heavy blur/filter effects should reduce on mobile for performance optimization
- Ambient infinite animations must remain subtle and GPU-friendly
- All `gsap.context()` instances cleaned up in `useEffect` return to prevent memory leaks
- Word-split only applied to headings (not body text) to keep DOM changes minimal

---

## Files to Modify

1. `pages/landing.js` — add refs, word-split utility, `useEffect` with GSAP context
2. `styles/Landing.module.css` — add `.word`, `.word-inner`, `.navScrolled` classes
3. `package.json` — add `gsap` dependency

---

## Out of Scope

- ScrollSmoother (Club plugin)
- SplitText (Club plugin)
- Route transition animations
- Any backend or API changes
