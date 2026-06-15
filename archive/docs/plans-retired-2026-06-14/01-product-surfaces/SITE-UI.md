# 01 — Site UI Implementation Plan

*Created: 2026-06-11 — Concrete quality targets for every public surface.*

## Goal

Every public route on `oando.co.in` must feel flagship: fast first paint, tight typography, premium components, and consistent rhythm. The benchmark is Oando's own furniture quality — precise, considered, nothing arbitrary.

## Acceptance Standard

A route is done when:
- LCP < 2.5 s on mobile 4G (Lighthouse)
- Zero critical/serious axe accessibility violations
- TypeScript: 0 errors; Lint: 0 warnings
- Renders correctly at 375 px, 768 px, 1280 px, 1680 px
- Uses only `typ-*` typography utilities (no raw font-size inline)
- Uses only tokens from `app/css/tokens/theme.css` (no hex literals in component files)

---

## 1. Homepage (`app/(site)/page.tsx`)

### Sections

| Section | Component | Status | Issues |
|---|---|---|---|
| Hero | `HomepageHero` | Live | Image carousel working; progress dots correct |
| Partnership banner | `PartnershipBanner` | Live | Needs visual audit |
| Product categories | `Collections` | Live | Needs visual audit |
| Planner suite | `PlannerSuite` | Live | Single card; minimal — acceptable |
| Selected projects | `Projects` | Live | Needs visual audit |
| Closing CTA | `HomeClosingCta` | Live | Needs visual audit |

### Homepage Acceptance Checklist

- [ ] Hero: LCP image preloaded (`priority` on index 0 ✓), overlay gradients readable at all slide positions
- [ ] Hero title: `home-hero-title-homepage` utility applied; `text-accent-italic-on-dark` on last line ✓
- [ ] Hero CTAs: `btn-primary` + `btn-accent` with `shadow-theme-panel` ✓
- [ ] Progress dots: active dot expands to `w-6`, inactive `w-1.5` ✓
- [ ] `PartnershipBanner`: logo images loaded from R2/local — no broken images
- [ ] `Collections`: card grid responsive (1 col → 2 col → 3 col)
- [ ] `PlannerSuite`: `card-lift` hover, `typ-h3`, `typ-label` — all token-correct ✓
- [ ] `Projects`: image aspect-ratio locked; no layout shift
- [ ] `HomeClosingCta`: dark surface (`surface-inverse`) with `text-accent-italic-on-dark`
- [ ] Footer: `site-footer` dark surface; all links functional

---

## 2. Planner Landing (`app/planner/(marketing)/page.tsx`)

Component: `features/planner/landing/PlannerLandingPage.tsx`

### Sections

| Section | Status | Issues |
|---|---|---|
| Hero (image carousel) | Live | Same pattern as homepage hero — good |
| Features grid (3-col) | Live | Cards use `card-lift`, `scheme-accent-wash` icon bg |
| How it works (3 steps) | Live | `shell-card`, `typ-chip`, `typ-h3` |
| User journeys (3 cards) | Live | `shell-card`, icon bg, `typ-h3` |
| Closing CTA (dark) | Live | `surface-inverse`, `btn-primary`, `btn-outline-light` |

### Planner Landing Acceptance Checklist

- [ ] Hero kicker: `typ-eyebrow` + `color-bronze-300` on dark bg ✓
- [ ] Hero H1: `typ-h1` with accent line in italic bronze ✓
- [ ] Proof stats cards: glassmorphism `bg-white/7 backdrop-blur-md` — verify render on mobile
- [ ] Features section: section heading uses `home-heading` ✓
- [ ] Feature cards: icon container uses `scheme-accent-wash` ✓; `rounded-huge` ✓
- [ ] Steps section: `shell-card` ✓; step number uses `typ-chip` ✓
- [ ] Journeys section: article cards `shell-card flex h-full flex-col` — verify height alignment in grid
- [ ] Closing CTA: `surface-inverse` ✓; radial gradient accent ✓
- [ ] All three CTA buttons on hero visible and functional on 375 px (may need to stack)
- [ ] `PlannerMarketingChrome` wrapper provides site nav + footer — verify it matches SiteNav/SiteFooter

---

## 3. Navigation (`components/site/SiteNav`)

### Acceptance Checklist

- [ ] Sticky at top with correct `z-index`
- [ ] Active route highlighted via `usePathname`
- [ ] Mobile drawer opens/closes correctly with focus trap
- [ ] Logo: `public/logo.webp` or `logo-v2.webp` — confirm which is canonical
- [ ] "Start Planning" CTA visible on desktop; collapses into drawer on mobile
- [ ] No layout shift when nav becomes sticky
- [ ] ARIA: `aria-label="Main navigation"` on `<nav>`; mobile toggle has `aria-expanded`

---

## 4. Footer (`components/site/SiteFooter`)

### Acceptance Checklist

- [ ] Dark surface matches `surface-inverse`
- [ ] Column layout: 1 col on mobile, 3–4 col on desktop
- [ ] All links confirmed functional
- [ ] Social icons: accessible labels (`aria-label`)
- [ ] Copyright year dynamic or updated to 2026
- [ ] No broken image references in footer logo

---

## 5. Typography System Audit

The design system uses `typ-*` and `home-*` utility classes defined in `app/css/typography/type.css`. All copy must use these — no raw `text-xl`, `font-bold` etc. unless there is no matching utility.

### Utility Mapping

| Visual Role | Utility | Notes |
|---|---|---|
| Display / H1 | `typ-h1` | Display-light, clamp 64–90px |
| Section H2 | `home-heading` | 2–2.9rem range |
| Subsection H2 | `typ-subsection-title` | 1.75–2.25rem |
| Card H3 | `typ-h3` | 18–20px, display-regular |
| Body lead | `hero-subtitle` / `page-copy` | 16–17px |
| Body small | `page-copy-sm` | 16px |
| Label / eyebrow | `typ-eyebrow` | 12px, uppercase, tracked |
| CTA text | `typ-cta` | 16px, semibold, tracked |
| Stat | `typ-stat` | 40–67px, tabular |
| Proof value | `typ-proof-value` | 1.5–1.75rem |

### Typography Sweep Routes

- [ ] `/` homepage — ✓ mostly done
- [ ] `/planner` — ✓ mostly done
- [ ] `/products` catalog page
- [ ] `/products/[category]` category page
- [ ] `/products/[category]/[slug]` PDP
- [ ] `/compare`
- [ ] `/quote-cart`
- [ ] `/about`
- [ ] `/contact`
- [ ] `/downloads`
- [ ] `/portfolio`
- [ ] `/solutions`
- [ ] `/career`
- [ ] All legal/policy pages

---

## 6. Responsive Grid Rules

- Mobile (< 640px): single column, 1.5rem gutters
- Tablet (640–1023px): 2 columns where applicable
- Desktop (≥ 1024px): 3 columns for feature grids; 4 columns for stat grids
- Max content width: `--container-home-max` (1320px) for marketing; `1680px` for wide layouts
- Section vertical rhythm: `section-y-sm` = `clamp(3.5rem, 5vw, 4.5rem)` top+bottom

---

## 7. Performance Targets

| Metric | Target | Tool |
|---|---|---|
| LCP | < 2.5 s (mobile 4G) | Lighthouse |
| TBT | < 200 ms | Lighthouse |
| CLS | < 0.1 | Lighthouse |
| TTI | < 3.8 s | Lighthouse |
| Hero image | WebP, `priority`, `sizes="100vw"` | Next.js Image |
| Font loading | `font-display: swap`, preconnect to Google Fonts | CSS |

---

## 8. Mobile Performance — India Market

**Target Users:** Tier-2/3 cities with 2G/3G networks and low-end Android devices (< 4GB RAM).

| Metric | 4G Target | 2G/3G Target | Tool |
|---|---|---|---|
| LCP | < 2.5 s | < 4.5 s | Lighthouse (throttled) |
| FCP | < 1.8 s | < 3.0 s | Lighthouse |
| TTI | < 3.8 s | < 6.0 s | Lighthouse |
| Total Bundle | < 250 KB | < 150 KB | webpack-bundle-analyzer |
| Image Load | WebP, lazy | WebP, lazy, low-quality placeholder | Next.js Image |

### India-Specific Optimizations

- **Network conditions testing**: Chrome DevTools → Network → Slow 3G (400ms RTT, 400 Kbps down)
- **Device emulation**: Moto G4, Galaxy A10 (low-end Android)
- **Font loading**: `font-display: swap` with system font fallback (no FOIT on slow networks)
- **Critical CSS inline**: Above-the-fold styles inlined in `<head>` for hero section
- **Image optimization**: Serve 375px-width images for mobile (not desktop-size scaled down)
- **Code splitting**: Route-based splitting; defer non-critical features (chatbot, analytics)

### Acceptance Checklist

- [ ] Homepage FCP < 3.0 s on Slow 3G throttle
- [ ] Planner landing FCP < 3.5 s (Tldraw bundle deferred)
- [ ] Hero image < 80 KB at 375px width
- [ ] No render-blocking scripts above-the-fold
- [ ] System font renders before custom font loads

---

## 9. Operational Rules

- Use **`app/css/`** for all shared FOCSS (tokens, utilities, route CSS). Route-specific marketing styles go under `app/css/routes/`; do not recreate a `css/` folder under `app/(site)/`.
- Entry point is `app/(site)/globals.css` (`@import "../css/index.css"`). Site layouts import globals; never bypass the shared bundle.
- Never add `style={{}}` inline on marketing pages.
- Dark surfaces use `surface-inverse` token — never hardcode `#070D12`.
- Accent italic headings use `text-accent-italic` (light bg) or `text-accent-italic-on-dark` (dark bg).
- All new components in `components/home/` or `components/site/` — nothing in `features/` for pure UI.
