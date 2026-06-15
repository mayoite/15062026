# 04 — Design System

*Created: 2026-06-11 — Single-source token contract and component rules.*
*Updated: 2026-06-14 — Shared FOCSS moved to `app/css/`; planner chrome split documented.*

## Live Status (2026-06-14)

| Surface | Token compliance | Typography (`typ-*`) | Evidence |
|---|---|---|---|
| Homepage (`homepage-v2`) | FOCSS tokens + `home-*` utilities | Hero, collections, projects, contact | `results/responsive/home-*.png` |
| Portfolio `/portfolio` | `scheme-page`, `shell-card` | `typ-eyebrow`, `typ-h1`, `typ-h2` | `app/(site)/portfolio/page.tsx` |
| Planner marketing `/planner/**` | `scheme-page`, shared buttons | `typ-eyebrow`, `typ-cta`, `home-heading` | `npm run build` SSG for 6 feature pages |
| Planner canvas chrome | `features/planner/css/` + shared palette | Partial — workspace labels still mixed | `features/planner/css/index.css` |
| Catalog filters / downloads | Pending sweep | Raw sizes may remain | M5 open |

## Principle

One CSS source of truth. Every color, size, radius, shadow, and motion value is a token in `app/css/tokens/theme.css`. Components reference `var()` from that file only — no hex literals, no raw pixel values, no Tailwind utilities that bypass the token system.

---

## 0. CSS Architecture

Shared FOCSS lives at **`app/css/`** — app-wide, not site-only. Site, planner marketing, CRM, and ops all load the same token bundle.

```
app/css/                         ← Shared FOCSS (tokens, utilities, route CSS)
  index.css                      ← Central import surface; @source scans components + app
  tokens/theme.css               ← Canonical @theme + html.dark overrides
app/(site)/globals.css           ← Entry point: @import "../css/index.css" + base layer
features/planner/css/            ← Editor chrome only (.pw-*, .pwx-*)
  index.css                      ← Shell, controls, overlays, workspace layout
features/planner/workspace.css   ← TECH DEBT: duplicate @theme + buddy aliases (Step 6 in REPO-CLEANUP)
```

**Import chain:** each surface layout imports `@/app/(site)/globals.css` (site, planner, crm, ops). Planner workspace routes additionally import `features/planner/css/index.css` for editor chrome.

**Rules:**
- Add shared tokens/utilities in `app/css/` — never under `app/(site)/`.
- Add planner-only layout/chrome in `features/planner/css/` — no new `@theme` blocks in feature CSS.
- `app/(site)/globals.css` holds base resets and `prefers-reduced-motion` only; do not add tokens there.

---

## 1. Token File

**Location:** `app/css/tokens/theme.css`

All tokens live inside `@theme {}`. Dark mode overrides live in `html.dark {}` in the same file.

Do not add tokens to component files, `globals.css`, or feature CSS files (except the planned `/* Planner */` merge in Step 6 of `REPO-CLEANUP.md`).

---

## 2. Color Tokens

### Palette (source scales)

| Scale | Range | Purpose |
|---|---|---|
| `--color-ocean-boat-blue-*` | 50–950 | Primary brand blue |
| `--color-dark-midnight-blue-*` | 50–950 | Dark surfaces, inverse |
| `--color-bronze-*` | 50–900 | Accent, warm emphasis |
| `--color-ecru-*` | 50–950 | Warm neutral |
| `--color-white-*` | 50–500 | Light surfaces |
| `--color-sustain-*` | 300–500 | Sustainability green |

### Semantic Aliases (always use these in components)

| Token | Light value | Dark value |
|---|---|---|
| `--color-primary` | dark-midnight-blue-500 | ocean-boat-blue-400 |
| `--color-accent` | bronze-400 | bronze-300 |
| `--color-accent-strong` | bronze-500 | — |
| `--surface-page` | white-50 | dark-midnight-blue-950 |
| `--surface-soft` | white-100 | dark-midnight-blue-900 |
| `--surface-card` | white-50 | dark-midnight-blue-800 |
| `--surface-inverse` | dark-midnight-blue-900 | white-100 |
| `--surface-accent-wash` | support-mist | ocean-boat-blue-500 @ 14% |
| `--text-heading` | #050B17 | #F8FAFC |
| `--text-body` | #1B2940 | #E2E8F0 |
| `--text-muted` | #4A5C76 | #94A3B8 |
| `--text-inverse` | #F8FAFC | — |
| `--text-inverse-muted` | #CBD5E1 | — |
| `--border-soft` | white-350 | dark-midnight-blue-700 |
| `--border-inverse` | #FFFFFF47 | — |

### Rules
- Never use a palette step directly in a component (`var(--color-bronze-400)`). Use a semantic alias instead.
- Exception: decorative elements on dark backgrounds where the semantic alias would be wrong may use palette steps with a comment explaining why.

---

## 3. Interaction States

All interactive elements (buttons, links, inputs, cards with hover) must define hover, active, focus, and disabled states using design system tokens.

### State Token Mapping

| State | Color Override | Opacity | Transform | Shadow | Focus Ring |
|---|---|---|---|---|---|
| **Hover** | Lighten 5–10% or use `*-hover` variant | — | `translateY(-2px)` for cards | Deepen by 1 step | — |
| **Active** | Darken 10% | — | `scale(0.98)` | Inner shadow | — |
| **Focus** | — | — | — | — | `var(--focus-ring)` (3px, 2px offset) |
| **Disabled** | `--text-muted` | 0.5 | — | `none` | — |

### Focus Ring (WCAG 2.1 AA Compliance)

**Token:** `--focus-ring`  
**Value:** `0 0 0 3px rgba(var(--color-primary-rgb), 0.3), 0 0 0 2px var(--surface-page)`  
**Usage:** Applied via `:focus-visible` pseudo-class, not `:focus` (avoids ring on mouse click)

```css
.btn-primary:focus-visible {
  box-shadow: var(--focus-ring);
  outline: none; /* safe because custom focus ring is visible */
}
```

### Button State Examples

| State | `btn-primary` | `btn-outline` | `btn-accent` |
|---|---|---|---|
| Default | `--color-primary` bg | `--border-soft` border | `--color-accent` bg |
| Hover | Lighten 10% | `--color-primary` bg | `--color-accent-strong` bg |
| Active | Darken 10% | — | Darken 5% |
| Focus | Focus ring | Focus ring | Focus ring |
| Disabled | `--text-muted` + opacity 0.5 | `--text-muted` + opacity 0.5 | `--text-muted` + opacity 0.5 |

### Card Lift Interaction

```css
.card-lift {
  transition: transform var(--motion-base) var(--ease-standard),
              box-shadow var(--motion-base) var(--ease-standard);
}

.card-lift:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-panel-hover); /* deeper shadow on hover */
}
```

### Link States

| State | Text Color | Underline |
|---|---|---|
| Default | `--color-primary` | `1px solid transparent` |
| Hover | `--color-primary` (same) | `1px solid var(--color-primary)` |
| Active | Darken 10% | — |
| Focus | Focus ring + underline | — |
| Visited | `--color-primary` (no purple) | — |

### Input States

| State | Border | Background | Text |
|---|---|---|---|
| Default | `--border-soft` | `--surface-card` | `--text-body` |
| Hover | `--color-primary` @ 30% | — | — |
| Focus | `--color-primary` | — | — |
| Error | `--color-error` | `--color-error` @ 5% | — |
| Disabled | `--border-soft` | `--surface-muted` | `--text-muted` |

### Rules
- Never use `:focus` without `:focus-visible` — mouse clicks should not show focus ring
- Disabled states use `cursor: not-allowed` + `pointer-events: none`
- All interactive elements must pass WCAG 2.1 AA contrast: 4.5:1 for text, 3:1 for large text and UI components
- Focus ring must be visible on keyboard navigation (3px minimum thickness)

---

## 4. Typography Utilities

**Location:** `app/css/typography/type.css`

All utilities defined with `@utility`. Never define font properties inline or in component CSS.

### Scale Reference

| Utility | Font | Size | Weight | Use case |
|---|---|---|---|---|
| `typ-h1` / `typ-display` | display | clamp(64–90px) | 300 | Page hero titles |
| `home-heading` | display | clamp(2–2.9rem) | 300 | Section H2 |
| `typ-subsection-title` | display | clamp(1.75–2.25rem) | 300 | Sub-section H2 |
| `typ-h3` | display | clamp(18–20px) | 400 | Card titles |
| `hero-subtitle` / `page-copy` | sans | clamp(16–17px) | 400 | Lead body |
| `page-copy-sm` / `typ-body-sm` | sans | 16px | 400 | Body small |
| `typ-eyebrow` / `typ-label` | sans | 12px | 500 | Uppercase labels |
| `typ-cta` | sans | 16px | 500 | Button text |
| `typ-stat` | display | clamp(40–67px) | 300 | Stats |
| `typ-proof-value` | display | clamp(1.5–1.75rem) | 300 | Hero proof numbers |

### Accent Styles

| Utility | When to use |
|---|---|
| `text-accent-italic` | Italic bronze emphasis on **light** backgrounds |
| `text-accent-italic-on-dark` | Italic bronze emphasis on **dark/inverse** backgrounds |
| `home-heading__accent` | Ocean-boat-blue regular-weight accent in section headings |

### Rules
- Use `typ-h1` (not Tailwind `text-6xl`) for hero headings.
- Use `home-heading` (not `text-4xl font-light`) for section H2.
- Never combine `typ-*` with conflicting Tailwind font utilities on the same element.
- Heading font (`--font-display`) → Helvetica Neue / Cisco Sans stack.
- Body font (`--font-sans`) → same stack, different weight default.

---

## 4. Button Components

**Location:** `app/css/utilities/buttons.css`

All buttons defined with `@utility`. Use the utility class — do not rebuild button styles inline.

| Utility | Surface | Use |
|---|---|---|
| `btn-primary` | Primary blue fill | Primary actions (light + dark bg) |
| `btn-accent` | Bronze fill | Secondary accent actions |
| `btn-outline` | Transparent + border | Tertiary on light bg |
| `btn-outline-light` | Transparent + white border | Tertiary on dark/image bg |
| `home-btn-secondary` | Frosted glass | Secondary on hero imagery |

### Hero Button Modifiers
- `btn-hero-primary` — adds hero-specific shadow (`shadow-theme-panel`); use with `btn-primary`
- `btn-hero-secondary` — use with `btn-accent` or `home-btn-secondary`

### Rules
- All buttons: `border-radius: var(--radius-pill)` (pill shape)
- Min height: `var(--control-height-sm)` = 2.75rem
- Focus: `box-shadow: var(--focus-ring)` — never `outline: none` alone
- No custom hover colors — use the transition variants already in the utility

---

## 5. Card Patterns

**Location:** `app/css/components/cards.css` + `app/css/routes/home/base.css`

| Utility | Description |
|---|---|
| `shell-card` | Standard light-bg card with border, shadow, rounded-huge |
| `card-lift` | Adds translateY(-4px) on hover with shadow deepening |
| `home-frame` | Overflow-hidden card with panel bg (glass effect variant) |
| `home-stats-card` | Compact stats/metric card with hover transition |
| `home-tool-card` | Frosted glass card with blue border-hover |

### Icon Container
```html
<div class="scheme-accent-wash flex h-12 w-12 items-center justify-center rounded-2xl text-[color:var(--color-accent-strong)]">
  <Icon />
</div>
```

### Rules
- Always use `rounded-huge` (1.75rem) for marketing cards. Never raw `rounded-2xl` unless it equals the token value.
- Card borders use `border-soft` token.
- Card shadows use `shadow-panel` or `shadow-soft` token.

---

## 6. Surface Schemes

| Utility | Background | Text default |
|---|---|---|
| `scheme-page` | `surface-page` | `text-body` |
| `surface-inverse` | `surface-inverse` | `text-inverse` |
| `home-section--white` | `surface-page` | — |
| `home-section--sand` | `surface-muted` | — |
| `home-section--dark` | `surface-inverse` | `text-inverse` |
| `scheme-accent-wash` | `surface-accent-wash` | `color-accent-strong` |

---

## 7. Motion Tokens

| Token | Value | Use |
|---|---|---|
| `--motion-fast` | 180ms | Hover color/border changes |
| `--motion-base` | 240ms | Card lifts, opacity transitions |
| `--motion-slow` | 320ms | Panel slides |
| `--motion-slower` | 480ms | Page transitions |
| `--ease-standard` | cubic-bezier(0.22, 1, 0.36, 1) | Default easing |
| `--ease-in` | cubic-bezier(0.65, 0, 0.35, 1) | Elements leaving |
| `--ease-out` | cubic-bezier(0, 0, 0.2, 1) | Elements entering |

Framer Motion animations use `MOTION_EASE` from `lib/helpers/motion.ts` which maps to `--ease-standard`.

`@media (prefers-reduced-motion: reduce)` → all transitions and animations disabled globally in `app/(site)/globals.css`.

---

## 8. Spacing & Layout

| Token | Value | Use |
|---|---|---|
| `--container-home-max` | 1320px | Marketing shell max-width |
| `--container-max` | 1680px | Wide layout max-width |
| `--container-padding-mobile` | 1.5rem | Inline padding on mobile |
| `--container-padding-desktop` | 2.5rem | Inline padding on desktop |
| `--section-space-sm` | clamp(3.5rem, 5vw, 4.5rem) | Compact section top+bottom |
| `--section-space-md` | clamp(4.5rem, 6vw, 5.75rem) | Standard section |
| `--section-space-lg` | clamp(5.5rem, 7vw, 7rem) | Hero-adjacent sections |

Shell utilities: `home-shell` (1680px max), `home-shell-xl` (1320px max, standard for marketing).

---

## 9. Dark Mode

Dark mode is toggled via `html.dark` class (Planner `WorkspaceThemeProvider`). The site public surface is always light — no dark mode toggle on public routes.

Override tokens for `html.dark` live in `app/css/tokens/theme.css` below the `@theme` block.

---

## 10. Rules Summary

1. Tokens only — no hex literals in component `.tsx` or feature `.css` files.
2. `typ-*` utilities only — no inline font styles.
3. `btn-*` utilities only — no custom button implementations.
4. All new tokens go in `theme.css` under the appropriate section, with a comment.
5. File size limit: 500 lines for `.tsx`; 700 lines max. Split components if needed.
6. No `@ts-nocheck`. No `style={{}}` in marketing components.
