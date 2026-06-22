# Structure Guidelines — CSS-First Structure and Site Data

## Purpose

This note captures the current repo ownership rules after the site static-data move.
It is meant to keep folder planning consistent and prevent the CSS tree from becoming mixed again.

## Current Canonical Homes

- Site static data now lives in `lib/site-data/`
- Locale message JSON lives in `i18n/messages/`
- Route contract metadata lives in `config/route-contract.json`
- Shared CSS lives in `app/css/`
- Route-specific UI stays next to the route or feature that owns it

## CSS-First Model

This repo is CSS-first in practice.
Tailwind is present as infrastructure, but the authored CSS layers do most of the styling work.

- `app/css/index.css` is the entry point
- `app/css/core/tokens/` holds theme tokens
- `app/css/base/` holds low-level global CSS
- `app/css/core/components/` holds reusable component classes
- `app/css/core/utilities/` holds custom utilities
- `app/css/core/site/` and `app/css/core/planner/` hold surface-specific bundles

Tailwind v4 still matters here, but mostly as the base that enables:

- `@import "tailwindcss"` for framework + Preflight
- `@theme` for design tokens that should generate utilities
- `@utility` when a utility belongs in shared CSS rather than TSX
- `@layer components` when a reusable component pattern belongs in CSS

## Why the Move Happened

The old `data/site/` bucket was behaving like application-owned content, not generic data.
That made ownership unclear and encouraged a mirrored folder model where it did not help.

Moving the site content into `lib/site-data/` makes the ownership clearer:

- `lib/` = non-React app logic and shared data helpers
- `app/css/` = shared visual system
- route and feature folders = local UI ownership

## CSS Rule

Use CSS mirroring only for UI-owned code.

- Good: `app/(site)/about/page.tsx` paired with route-local styles or a site bundle
- Good: `features/planner/...` paired with planner-specific styles
- Not good: creating CSS mirrors for `lib/`, `api/`, or `data/`

Shared CSS should keep flowing through the existing `app/css/` layers:

- `base/` for primitives and resets
- `core/tokens/` for theme variables
- `core/site/` and `core/planner/` for surface-specific bundles
- `core/components/` for reusable component classes
- `core/utilities/` for reusable utility classes

## Folder Policy

1. If the code is UI-owned, styles may live beside it or in the nearest feature bundle.
2. If the style should become a reusable utility, define it in `app/css/core/utilities/`.
3. If the style is a shared component pattern, define it in `app/css/core/components/`.
4. If the style is a design token, define it in `app/css/core/tokens/`.
5. If the code is pure data or logic, do not invent a CSS sibling folder.
6. Promote a style upward only when it is truly reused across the app.

## Current Recommendation

The next cleanup pass should be:

1. Regenerate stale docs and inventories so they point at `lib/site-data/`, `i18n/messages/`, and `config/route-contract.json`
2. Clear any leftover generated artifacts that still mention the legacy site-data path
3. Keep `docs/plans/` and `tech-stack-docs/` aligned with the current ownership model
4. Then review the CSS layer tree and simplify only the UI-owned parts
5. Keep CSS tokens, utilities, and component classes centralized instead of scattering them into page files

## Caution

- Do not move unrelated logic folders just to match the site data refactor
- Do not flatten all CSS into one folder
- Do not use `base/` as a dumping ground for page-specific styles
- Do not replace the shared CSS layers with ad hoc page CSS
