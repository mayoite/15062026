# Homepage tweak — A+ execution plan

> **For agents:** REQUIRED SUB-SKILL: `subagent-driven-development`. Wave 1 may use `dispatching-parallel-agents` (**2 agents**, not 4 — see below).  
> **Visual reference:** [github.com/mayoite/Final0704](https://github.com/mayoite/Final0704) · live [oneandonly-cad-suite.vercel.app](https://oneandonly-cad-suite.vercel.app) — **design ideas only, never copy code** → [`2026-06-16-final0704-design-reference.md`](./2026-06-16-final0704-design-reference.md)  
> **Parent spec:** [`../HOMEPAGE-LAYOUT-TYPOGRAPHY.md`](../HOMEPAGE-LAYOUT-TYPOGRAPHY.md)

**Goal:** Ship a visibly better `/` — fix the Trust soft+soft bug, unify rhythm/typography, align motion with installed packages, and lock proof with tests.

**Confidence:** **High** on Wave 1+product items · **Medium** on light Tools + typography dedup · **Approved to execute** (decisions locked 2026-06-16).

**Execution status (2026-06-16):** All waves complete (see CONTENTS.md). Verifications: vitest homepage-data ✓, test:e2e:nav ✓, typecheck ✓. Parent plan updated. (In-flight tree changes for implementation; no further tasks here.)

---

## 1. What “A+” means here

| Pillar | Must deliver |
|--------|----------------|
| **Product** | User sees clearer section rhythm; no adjacent soft bands; mobile catalog CTA reachable (if Q2=yes) |
| **Motion** | All homepage animation via `lib/helpers/motion.ts` + `prefers-reduced-motion`; no orphan durations |
| **CSS** | Route CSS + class swaps only; no `theme.css` / `type.css` |
| **Proof** | Gates green + section `data-testid` hooks + optional axe on `/` |
| **Process** | One ownership table; tests after implementation merge |

---

## 2. Motion contract (package.json)

**Installed:** `motion@^12.40.0` (pulls `framer-motion@^12.40.0` transitively), `swiper@^12.2.0`, `embla-carousel-react` (via showcase).

| Layer | Package | Homepage use |
|-------|---------|----------------|
| Scroll reveals / stagger / hover | `framer-motion` (via Motion 12) | Section entrances, hero carousel crossfade |
| Carousel (collections) | `swiper` | `Collections.tsx` — keep; do not reimplement with motion |
| Carousel (showcase) | `embla-carousel-react` | `ShowcaseCarousel.tsx` — keep |
| Tokens | `lib/helpers/motion.ts` | **Single source** — `MOTION_EASE`, `MOTION_TOKENS`, `fadeUp`, `staggerContainer`, `staggerItem`, `useMotionSafeHover` |
| Legacy CSS reveal | `reveal-on-scroll` in `misc.css` | **Remove from WhyChooseUs** — use `fadeUp` or `staggerContainer` only (one pattern per section) |

### Motion rules (mandatory)

1. **Import** from `framer-motion` (compatible with installed `motion` 12) — do not add new animation libraries.
2. **Durations/easing** — use `MOTION_TOKENS.*` and `MOTION_EASE`; no magic `0.9` / `0.7` in components unless added to `MOTION_TOKENS` first.
3. **Reduced motion** — wrap `whileHover` / `whileTap` with `useMotionSafeHover()`; hero `AnimatePresence` must respect `useReducedMotion()` (skip scale/opacity transitions when reduced).
4. **Viewport** — scroll animations use `viewport: { once: true }` (already in `fadeUp`).
5. **No motion on layout-only class swaps** — background/padding PRs must not change animation behavior unless fixing a11y gap.
6. **Carousels** — Swiper/Embla handle slide physics; motion only for section wrapper fade-in, not per-slide duplicate fades.

### Motion audit (current gaps)

| File | Issue | Fix |
|------|-------|-----|
| `HomepageHero.tsx` | Custom `duration: 0.9`, `0.7` | Map to `MOTION_TOKENS.slow` / `medium` |
| `Collections.tsx` | Raw `whileHover`/`whileTap` on nav buttons | `useMotionSafeHover({ y: -1 }, { y: 0 })` |
| `WhyChooseUs.tsx` | Mixed `reveal-on-scroll` + `staggerContainer` | Drop CSS reveal; `fadeUp` on heading block |
| `InteractiveTools.tsx` | Verify hover uses safe pattern | Same as Collections |

---

## 3. Scope — three waves

### Wave 1 — Product-led ship (PR-1, ~1–2 days)

**Agent 1** (layout + motion + product UX)

| Change | Files |
|--------|-------|
| Trust → page bg + `home-shell-xl` + `section-y-sm` + `border-t` | `TrustStrip.tsx` |
| Partnership → `section-y-sm` (normalize; drop `0.8×`) | `PartnershipBanner.tsx` |
| **Lighten Tools** — `home-section--dark` → page surface + light tool cards (Final0704-style) | `InteractiveTools.tsx`, `base.css` |
| **Hero kicker** — move above CTAs or inline with headline (clearer hierarchy) | `HomepageHero.tsx` |
| **Collections mobile CTA** — show "Browse full catalog" below `sm` (not `hidden sm:flex` only) | `Collections.tsx` |
| **Showcase eyebrow** — populate `HOMEPAGE_SHOWCASE_CONTENT.sectionLabel` or remove dead slot | `data/site/homepage.ts`, `ShowcaseCarousel.tsx` |
| Remove dead padding fallbacks | `type-fallback.css` |
| Motion token cleanup (hero, collections, why) | `HomepageHero.tsx`, `Collections.tsx`, `WhyChooseUs.tsx` |
| `data-testid` section hooks | section wrappers |

**Gate:** `typecheck` · `lint` · `npx vitest run homepage-data` · `npm.cmd run test:e2e:nav` — **green (2026-06-16)**

### Wave 2 — Typography + CSS dedup (PR-2, Agent 2)

Trust KPI labels, showcase browse link, tool card classes, weight 350→300, `base.css` tool-link `margin-top: auto`, collections toolbar alignment.

**Depends on:** Wave 1 merged.

### Wave 3 — Tests + ContactTeaser (PR-3)

Extend smoke (hero CTAs, glass proof, partnership, contact form aria). Fix `homepage-data.test.ts` drift. Optional axe on `/`. ContactTeaser CSS Wave 2 only if Q4=yes.

---

## 4. Execution model (revised)

**Why not 4 parallel agents?** TrustStrip needs layout → typography → CSS sequentially; parallel merge cost > benefit for ~15 files.

| Wave | Agents | Model |
|------|--------|-------|
| 1 | **1 implementer** | Layout + motion |
| 2 | **1 implementer** | Typography + CSS |
| 3 | **1 implementer** | Tests (+ ContactTeaser if approved) |

Each wave: **implementer → spec reviewer → code quality reviewer** (`subagent-driven-development`).

---

## 5. File ownership (single table)

| Path | Wave | Owner |
|------|------|-------|
| `components/home/TrustStrip.tsx` | 1 layout, 2 typography, 3 testId | Sequential |
| `components/home/PartnershipBanner.tsx` | 1 padding, 2 H2 verify | 1→2 |
| `components/home/HomepageHero.tsx` | 1 motion only | 1 |
| `components/home/Collections.tsx` | 1 motion, 2 toolbar | 1→2 |
| `components/home/WhyChooseUs.tsx` | 1 motion | 1 |
| `components/home/ShowcaseCarousel.tsx` | 2 typography | 2 |
| `components/home/InteractiveTools.tsx` | 1 motion, 2 typography | 1→2 |
| `app/css/core/site/routes/home/type-fallback.css` | 1 padding removal, 2 fallbacks | 1→2 |
| `app/css/core/site/routes/home/base.css` | 2 tool-link | 2 |
| `app/css/core/components/cards.css` | 2 trim | 2 |
| `components/shared/ContactTeaser.tsx` | 3 optional | 3 |
| `tests/homepage-data.test.ts` | 3 | 3 |
| `tests/site-navigation-smoke.spec.ts` | 3 | 3 |
| `tests/accessibility.spec.ts` | 3 optional | 3 |

**Never touch:** `theme.css`, `type.css`, section order in `page.tsx`.

---

## 6. Verification

```cmd
npm.cmd run typecheck
npm.cmd run lint
npx vitest run homepage-data
npm.cmd run test:e2e:nav
```

**Manual:** `npx next dev --webpack` → `/` hard refresh

- Backgrounds: `inverse → page → soft → page → page → page → page → soft`
- With `prefers-reduced-motion: reduce` enabled in OS — no hover lift on collection nav; hero still usable
- Collections shell max-width matches showcase (`1320px`)

---

## 7. Doc index

| Doc | Role |
|-----|------|
| **This file** | Entry point + locked decisions |
| [`CONTENTS.md`](./CONTENTS.md) | File list + wave status |
| [`2026-06-16-final0704-design-reference.md`](./2026-06-16-final0704-design-reference.md) | Final0704 visual patterns |
| [`2026-06-16-homepage-tweak-tasks-typography-css.md`](./2026-06-16-homepage-tweak-tasks-typography-css.md) | Wave 2 task steps |
| [`04-task-05-tests.md`](./04-task-05-tests.md) | Wave 3 test steps |

---

## 8. Honest confidence statement

| Claim | Confidence |
|-------|------------|
| Trust background fix improves homepage | **95%** |
| Plan is internally consistent (this README) | **90%** |
| Full typography dedup worth the diff | **70%** — depends on Q1 |
| 4 parallel agents was the right shape | **40%** — revised to 3 sequential waves |
| Motion cleanup without visual regression | **85%** if using `MOTION_TOKENS` only |

---

## 9. Locked decisions (2026-06-16)

| # | Decision | Choice |
|---|----------|--------|
| Q1 Scope | **Product-led** — Wave 1 + mobile catalog CTA + hero kicker + showcase eyebrow |
| Q2 Tools | **Lighten** — page surface + light cards (Final0704-style), not dark inverse |
| Q3 Partnership | **Normalize** to `section-y-sm` |
| Q4 ContactTeaser | **Wave 3** after gates green |

**Revised target rhythm after light Tools:**  
`inverse → page → soft → page → page → page → page → soft`  
(Tools and Why both page; only Hero + Contact bookend inverse/soft extremes.)

---

*Updated 2026-06-16 — consolidated under `plans/site-design/`.*