# CSS Solution — Oando Platform

## Problem

CSS is doing the real styling work in this repo, but the ownership model has drifted.
That creates three problems:

1. Repeated styling gets scattered across TSX and CSS
2. Folder names do not always match who owns the style
3. Tailwind utilities and authored CSS blur together instead of having clear roles

## Solution

Make `app/css/` the canonical styling system and treat Tailwind as the base engine, not the authoring destination.

### Principle

- TSX owns structure and behavior
- CSS owns repeated visual patterns and surface styling
- Shared styling should live in `app/css/`
- Route-owned styling should stay close to the route or feature that owns it
- Pure data and logic folders should not spawn CSS mirrors
- Canonical content/data homes stay in `lib/site-data/`, `i18n/messages/`, and `config/route-contract.json`

## Canonical CSS Roles

- `app/css/index.css` is the entrypoint
- `app/css/core/tokens/` is for theme variables and design constants
- `app/css/base/` is for global resets and primitives
- `app/css/core/components/` is for reusable component styles
- `app/css/core/utilities/` is for reusable utility helpers
- `app/css/core/site/` is for site-specific bundles
- `app/css/core/planner/` is for planner-specific bundles
- `app/css/core/chrome/` is for shell-level UI like nav, footer, and portal chrome

## What To Do With Existing Styles

1. Keep global constants and tokens in the token layer.
2. Move repeated button/card/nav/panel patterns into shared component CSS.
3. Keep one-off route styling in the route or feature that owns it.
4. Keep layout helpers in the utility layer instead of copying them into TSX.
5. Keep `base/` small and boring.

## What Not To Do

- Do not create CSS folders for `lib/`, `data/`, or `api/`
- Do not use `base/` for page-specific styles
- Do not keep styling logic duplicated in many TSX files
- Do not flatten all CSS into one giant file
- Do not treat Tailwind utilities as the only styling strategy

## Recommended Migration Order

1. Stabilize `lib/site-data/`, `i18n/messages/`, and `config/route-contract.json` as the canonical non-CSS homes.
2. Rebuild generated docs and reports so they stop pointing at the legacy site-data path.
3. Keep `docs/plans/` and `tech-stack-docs/` aligned with the current folder policy.
4. Normalize the CSS folder tree by ownership:
   - tokens
   - base
   - shared components
   - utilities
   - site bundles
   - planner bundles
5. Remove duplicated TSX class noise only after the shared CSS layer is clear.

## Exit Criteria

The CSS structure is “fixed” when:

- new styles have an obvious home
- shared patterns are defined once
- route-specific styles do not leak into base layers
- Tailwind utilities are used intentionally, not as the default dumping ground
- the folder tree answers “who owns this style?” without guesswork
