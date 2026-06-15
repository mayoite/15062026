# Homepage layout + typography — `/`

*Visual reference: [Final0704](https://github.com/mayoite/Final0704) (layout only — not code copy). Program: [`MASTER-PLAN.md`](MASTER-PLAN.md). CSS map: [`docs/CSS-ARCHITECTURE.md`](../docs/CSS-ARCHITECTURE.md).*

**Status:** Pending execution (2026-06-15).

## Goal

Align the homepage (`/`) section backgrounds, vertical rhythm, shell widths, and typography with the agreed Final0704-inspired stack — using this repo’s tokens and utilities only.

**Constraints**

- Do **not** edit [`app/css/core/tokens/theme.css`](../app/css/core/tokens/theme.css) or [`app/css/core/typography/type.css`](../app/css/core/typography/type.css).
- Section **order is fixed** — no reorder.
- FAQ stays off `/` (remains on `/about` before Contact).
- Cite exact CSS values in implementation; no hedging language in verification notes.

---

## Section stack (order · background · padding)

### DOM order

**Current** ([`app/(site)/page.tsx`](../app/(site)/page.tsx)) and **target** — **no reorder**:

| # | Component | Notes |
|---|-----------|-------|
| 1 | `HomepageHero` | — |
| 2 | `PartnershipBanner` | — |
| 3 | `Collections` | — |
| 4 | `TrustStrip` | `showLogos={false}` |
| 5 | `ShowcaseCarousel` | 3 real clients (DMRC, Titan, TVS) |
| 6 | `InteractiveTools` | 2 tool cards |
| 7 | `WhyChooseUs` | — |
| 8 | `ContactTeaser` | — |

### Background — current vs target

Target rhythm: **one inverse band** (hero + tools only for content sections), **page** for primary reading bands, **soft** for sunken/carousel bands.

| # | Section | Current | Target | Change |
|---|---------|---------|--------|--------|
| 1 | Hero | `bg-inverse` → `var(--surface-inverse)` | same | **Keep** |
| 2 | Partnership | `home-section--white` → `var(--surface-page)` | same | **Keep** |
| 3 | Collections | `home-section--soft` → `var(--surface-soft)` | same | **Keep** |
| 4 | Trust | `.home-trust-section` → `var(--surface-soft)` | `home-section--white` → `var(--surface-page)` | **Change** — breaks soft+soft with Collections |
| 5 | Showcase | `home-showcase-section--light` → `var(--surface-page)` | same | **Keep** |
| 6 | Tools | `home-section--dark` + `bg-inverse` | `home-section--dark` only | **Change** — remove redundant `bg-inverse` |
| 7 | Why | `home-section--soft` → `var(--surface-soft)` | `home-section--white` → `var(--surface-page)` | **Change** — light band, not sunken soft |
| 8 | Contact | `home-section--soft` → `var(--surface-soft)` | same | **Keep** |

**After backgrounds:** inverse → page → soft → page → page → inverse → page → soft.

### Section vertical padding (`padding-block`)

Token: `--section-space-sm: clamp(3.5rem, 5vw, 4.5rem)` via utility `section-y-sm`.

| # | Section | Current | Target | Notes |
|---|---------|---------|--------|-------|
| 1 | Hero | `pt-20` / `md:pt-24` + inner `py-10` / `md:py-16` / `lg:py-20` | **Keep** | Bespoke hero, not `section-y-sm` |
| 2 | Partnership | `section-y-sm` | same | — |
| 3 | Collections | `py-10 md:py-12` (`2.5rem` / `3rem`) | `section-y-sm` | min `+1rem` at 16px root |
| 4 | Trust | `2rem` / md `2.5rem` | `section-y-sm` on wrapper | min `+1.5rem` |
| 5 | Showcase | `3rem` / md `5rem` | `section-y-sm` | md max `-0.5rem` when clamp maxes |
| 6–8 | Tools, Why, Contact | `section-y-sm` | same | — |

**CSS:** Remove bespoke `padding-block` from `home-showcase-section` and `home-trust-section` in [`showcase.css`](../app/css/core/site/routes/home/showcase.css); sections use `section-y-sm` in TSX. Mirror in [`type-fallback.css`](../app/css/core/site/routes/home/type-fallback.css).

### Horizontal shell

| Location | Current | Target |
|----------|---------|--------|
| Most sections | `home-shell-xl` · max `1320px` | **Keep** |
| Collections | `home-shell` · max `1680px` | **`home-shell-xl`** (`1320px`) |
| Trust KPI cell | `home-trust-kpi` `1.5rem` + component `p-6` | Remove duplicate `p-6` from [`TrustStrip.tsx`](../components/home/TrustStrip.tsx) |

### Section borders

| Section | Target |
|---------|--------|
| Trust | Add `border-t border-theme-soft` when switching to `home-section--white` |
| All others | **Keep** existing borders |

---

## Typography

### Target roles

| Role | Class | Family | Size | Weight |
|------|-------|--------|------|--------|
| Hero H1 | `typ-h1` + `home-hero-title-homepage` | display | `clamp(2.5rem, 8.5vw, 3.75rem)` / md `clamp(3.5rem, 5.8vw, 4.75rem)` | `300` |
| Section H2 | `home-heading` | display | `clamp(2rem, 3.6vw, 2.9rem)` | `300` |
| Image overlay | `typ-overlay-title` + `text-inverse` | display | `clamp(1.25rem, 1.1rem + 0.7vw, 1.75rem)` | `300` |
| Feature card H3 | `typ-h3` | display | `clamp(18px, 1.04rem + 0.24vw, 20px)` | `400` |
| Body | `page-copy-sm` / `typ-body-sm` | sans | `16px` | `400` |
| Label | `typ-label` / `home-kicker` | sans | `12px` | `500` |
| CTA text | `typ-cta` / `btn-*` | sans | `16px` (hero btn `0.95rem`) | `500` or `700` (hero primary only) |

**Allowed weights after:** `300`, `400`, `500`, `700`.

### Per-section typography changes

| Section | Element | Current | Target |
|---------|---------|---------|--------|
| Partnership | H2 | `typ-subsection-title` | `home-heading` |
| Collections | “Browse full catalog” | `home-inline-link` + `typ-label` (arrow wraps) | `typ-label` only; toolbar `items-center`; `home-inline-link` fallback |
| Collections | Card title | `home-collection-card__title` · `400` | `typ-overlay-title text-inverse` · `300` |
| Trust | KPI value | weight `350` | `300` (`var(--font-weight-display-light)`) |
| Trust | KPI label | `0.75rem` bespoke | `typ-label` · `12px` / `500` |
| Showcase | Browse link | `0.875rem` / `500` | `typ-cta` · `16px` / `500` |
| Showcase | Slide name | `home-showcase-card__title` | `typ-overlay-title text-inverse` |
| Tools / Why | Card title | `home-tool-title` · sans · `18px` · `500` | `typ-h3` · display · `400` |
| Tools | Card link | `home-tool-link` · `0.875rem` | `typ-cta`; `margin-top: auto` in `base.css` |
| Contact | Field labels | `11px` / `500` | `typ-label` · `12px` / `500` |
| Contact | Support chips | `0.875rem` / `400` | `typ-cta` · `16px` / `500` |

Hero H1, section H2s (except Partnership), body copy, hero CTAs: **unchanged** unless listed above.

### Counts (before → after)

| Metric | Current | After |
|--------|---------|-------|
| Distinct `font-size` on `/` | 13 | 9 |
| Distinct `padding-block` systems | 4 | 2 (hero bespoke + `section-y-sm`) |
| Invalid font weights on `/` | `350` on KPI | 0 |

**ContactTeaser blast radius:** 24 routes/views (22 `app/(site)/` pages + `CareerPageView` + `SupportIvrPageView`).

---

## Implementation todos

| ID | Task | Status |
|----|------|--------|
| `layout-section-stack` | Normalize backgrounds + `section-y-sm`; Trust/Why → page; drop duplicate `bg-inverse` on Tools; Collections shell → `home-shell-xl` | Pending |
| `swap-component-classes` | Class swaps on 7 components per typography table | Pending |
| `fix-invalid-weights` | KPI `350` → `var(--font-weight-display-light)`; remove `350` from `type-fallback.css` | Pending |
| `remove-bespoke-type-css` | Delete/trim `home-showcase-card__title`, `home-collection-card__title`, `home-tool-title`/`home-tool-link` font rules | Pending |
| `sync-fallbacks` | Add `typ-overlay-title` / `typ-h3` / `typ-cta` / `home-inline-link` fallbacks in `type-fallback.css` + `layout-fallback.css` | Pending |
| `fix-collections-toolbar` | Header row `items-center`; link `inline-flex whitespace-nowrap` | Pending |
| `fix-tools-card-alignment` | `home-tool-link { margin-top: auto }` in `base.css`; equal-height cards | Pending |
| `verify-typecheck-nav` | `typecheck` + `test:e2e:nav` + visual pass on `/` with `npx next dev --webpack` | Pending |

---

## Files to change

### Layout

- [`app/(site)/page.tsx`](../app/(site)/page.tsx) — no order change
- [`components/home/Collections.tsx`](../components/home/Collections.tsx)
- [`components/home/TrustStrip.tsx`](../components/home/TrustStrip.tsx)
- [`components/home/InteractiveTools.tsx`](../components/home/InteractiveTools.tsx)
- [`components/home/WhyChooseUs.tsx`](../components/home/WhyChooseUs.tsx)
- [`app/css/core/site/routes/home/showcase.css`](../app/css/core/site/routes/home/showcase.css)

### Typography

- [`components/home/PartnershipBanner.tsx`](../components/home/PartnershipBanner.tsx)
- [`components/home/ShowcaseCarousel.tsx`](../components/home/ShowcaseCarousel.tsx)
- [`components/shared/ContactTeaser.tsx`](../components/shared/ContactTeaser.tsx)
- [`app/css/core/components/cards.css`](../app/css/core/components/cards.css)
- [`app/css/core/site/routes/home/base.css`](../app/css/core/site/routes/home/base.css)
- [`app/css/core/site/routes/home/type-fallback.css`](../app/css/core/site/routes/home/type-fallback.css)
- [`app/css/core/site/routes/home/layout-fallback.css`](../app/css/core/site/routes/home/layout-fallback.css)
- [`app/css/core/site/routes/home/contact-teaser.css`](../app/css/core/site/routes/home/contact-teaser.css)

### Not touched

- [`app/css/core/tokens/theme.css`](../app/css/core/tokens/theme.css)
- [`app/css/core/typography/type.css`](../app/css/core/typography/type.css)

---

## Verification

1. `npm.cmd run typecheck`
2. `npm.cmd run test:e2e:nav`
3. `npx next dev --webpack` → `/` hard refresh:
   - Backgrounds alternate per table (no soft+soft at sections 3–4; Why is page not soft)
   - Partnership / Tools / Why / Contact share identical `padding-block` clamp
   - Collections content width matches Showcase (`1320px` shell)
   - One overlay title scale, one section H2 scale, KPI weight `300`
   - Collections “Browse full catalog” arrow inline with label
   - Tool card “Launch” links baseline-aligned across cards
4. `/about` — ContactTeaser field labels at `12px` on one non-home route

---

## Measurable deltas (`html { font-size: 16px }`)

| Change | Delta |
|--------|-------|
| Collections section padding min | `+16px` (`40px`→`56px`) |
| Trust section padding min | `+24px` (`32px`→`56px`) |
| Showcase section padding at md+ | `-8px` (`80px`→`72px`) when clamp at max |
| Collections shell max-width | `1680px`→`1320px` (`-360px` content width) |
| Collection card title max | `31.2px`→`28px` (`-3.2px`) |
| Partnership H2 max | `36px`→`46.4px` (`+10.4px`) |
| Trust background | `--surface-soft`→`--surface-page` |
| Why background | `--surface-soft`→`--surface-page` |

---

*Created 2026-06-15. Update status rows here when steps land; log blockers in [`docs/Failures.md`](../docs/Failures.md).*
