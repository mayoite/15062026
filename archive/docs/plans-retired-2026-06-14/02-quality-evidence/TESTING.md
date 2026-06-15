# 06 - Testing and Verification

*Created: 2026-06-11 - Test matrix, coverage targets, and CI gate.*
*Updated: 2026-06-13 - 0504 parity verification snapshot.*

## Principle

Every user-facing feature has at least one automated test that would catch a regression. Tests run before any merge. The CI gate (`npm run release:gate`) must pass before marking any batch done.

Live verification on 2026-06-13 after 0504 parity repairs:

| Step | Command | Result |
|---|---|---|
| TypeScript | `npm.cmd run typecheck` | **pass** |
| Unit (planner) | `npm.cmd run test:planner` | **181/181 pass** across 22 files |
| Production build | `npm run build` | **not re-run after 0504 parity repairs**; last known pass 2026-06-12 |
| DB connectivity | `npm run db:test` | **not re-run in this batch**; last known pass 2026-06-12 |
| ESLint | `npm.cmd run lint` | **fail** — 25 errors |
| Full gate | `npm run release:gate` | **blocked** at lint step |
| Git state | `git status --short` | **fail** — `fatal: bad object HEAD` |

Active Playwright entrypoints live under `tests/`.

---

## 1. CI Gate

```
npm run release:gate
```

This runs in sequence:

1. `npm run lint:secrets` - no API keys, tokens, or credentials committed
2. `npm run lint` - zero ESLint warnings (using `config/build/eslint.config.mjs`)
3. `npm run typecheck` - zero TypeScript errors (using `config/build/tsconfig.json`)
4. `npm run build` - Next.js production build succeeds
5. `npm run test:a11y` - zero critical/serious axe violations on public routes
6. `npm run test:e2e:nav` - Playwright nav smoke tests pass
7. `npm run test:planner-catalog` - Playwright planner + catalog tests pass

**A batch is not done until `release:gate` passes in full.**

---

## 2. Unit Tests (Vitest)

**Config:** `vitest.config.ts`
**Location:** `tests/unit/` and co-located `*.test.ts` files in `lib/` and `features/`

### Coverage Targets

| Module | Target | Current |
|---|---|---|
| `lib/catalog/` | 80% | unknown |
| `features/planner/store/` | 80% | unknown |
| `features/planner/data/persistence/` | 75% | unknown |
| `features/planner/tldraw/shapes/` | 70% | unknown |
| `lib/auth/` | 90% | unknown |
| `lib/helpers/` | 85% | unknown |

Run: `npm run test:coverage`

### What to Test

- Pure functions: catalog parsers, block builders, PDF generators, AI prompt formatters
- Zustand stores: state transitions, computed selectors
- Data persistence: serialise/deserialise round-trip for `PlannerDocument`
- Auth utilities: token parsing, role checks
- Slug resolver: `lib/productSlugResolver.ts`

### What Not to Test at Unit Level

- Next.js routing - use Playwright e2e
- React component rendering - use Playwright or specific integration tests
- Third-party integrations (Tldraw, R3F) - mock at the boundary

---

## 3. Planner-Specific Tests (Vitest)

**Location:** `tests/planner/`

Run: `npm run test:planner`

### Required Tests

| Test | Description | Priority |
|---|---|---|
| `catalogIngest.test.ts` | CSV -> catalog items round-trip; 105 items; correct dimensions | P1 |
| `buildBlock2D.test.ts` | Each catalog category produces valid SVG output | P1 |
| `plannerDocument.test.ts` | `PlannerDocument` serialise -> deserialise produces identical object | P1 |
| `autosave.test.ts` | Autosave fires within 2 s of edit; clears on session end | P1 |
| `boqPdf.test.ts` | PDF generation returns a non-empty buffer; includes item count | P1 |
| `aiAdvisor.test.ts` | Intent parser correctly classifies chat/furnish/wizard intents | P1 |
| `guestToAuthMigration.test.ts` | Guest IndexedDB → member slot claim on canvas restore | **Done** — IndexedDB only; server `planner_saves` path still missing |
| `concurrentSaveConflict.test.ts` | Two tabs saving -> correct conflict resolution (not silent data loss) | P0 - CRITICAL MISSING |
| `plannerSavesRLS.test.ts` | User A cannot read user B's planner_saves rows | P0 - CRITICAL MISSING |
| `partialSaveFailure.test.ts` | Thumbnail upload fails -> document save rolls back | P0 |
| `canvasLoadTest.test.ts` | Canvas with 100+ items renders within performance budget | P1 |
| `layerManagerEntries.test.ts` | 0504-inspired layer list grouping, selection, and counts | **Done** |
| `blueprintPdfSession.test.ts` | Multi-page PDF underlay session behavior | **Done** |
| `blueprintTraceGuide.test.ts` | Canvas trace guide quick actions | **Done** |
| `blueprintImport.test.ts` | PDF/image import validation | **Done** |

---

## 4. End-to-End Tests (Playwright)

**Config:** `config/build/playwright.config.ts`
**Location:** `tests/`

Run: `npm run test:e2e:nav` (nav smoke) or `npx playwright test` (full suite)

### Required E2E Tests

#### Navigation & Public Routes
- Homepage loads; hero visible; progress dots clickable
- Planner landing loads; all three CTA buttons clickable
- Nav: mobile drawer opens on `<768 px`; drawer closes on link click
- `/products` catalog page loads; first product card visible
- `/contact` form: submit with valid input succeeds; error on empty required field

#### Planner Canvas
- `/planner/guest` loads Tldraw canvas within 3 s
- Catalog sidebar visible; search input accepts text; results update
- Drag from catalog to canvas: block appears on canvas
- Autosave indicator appears after canvas edit
- Export button opens PDF/JSON download dialog

#### Auth (if Appwrite test env available)
- `/login` with invalid credentials shows error message
- `/ops` route redirects unauthenticated users to `/login`
- Valid admin login redirects to `/ops` dashboard

---

## 5. Accessibility Tests

**Tool:** axe-playwright (via `npm run test:a11y`)

### Routes to Test

- `/` - homepage
- `/planner` - planner landing
- `/products` - catalog
- `/contact` - contact form
- `/planner/guest` - canvas (no noindex check needed; a11y still required)

### Pass Criteria

Zero `critical` or `serious` violations per axe category. `moderate` and `minor` violations must be tracked and addressed before launch but do not block CI.

---

## 6. Visual Regression (Future)

Planned for M6 (Launch sprint). Tool TBD (Playwright screenshots or Percy).

Baseline screenshots will be captured from a clean build and compared on each PR. Any pixel diff > 0.2% on a public route requires review.

---

## 7. Test File Rules

- Test files go in `tests/` subdirectories or co-located as `*.test.ts` - never in `app/` or `features/`
- Mock Supabase, Appwrite, and Drizzle at the module boundary - never make real network calls in unit tests
- Use `tests/__mocks__/` for shared mocks
- `tests/setup.ts` runs before all vitest tests
- Every new `lib/` function needs a unit test before the PR is merged
- Every new planner feature needs a `tests/planner/` test before the feature is marked done

---

## 8. Running Tests Locally

```bash
# Full gate (run before marking any batch done)
npm run release:gate

# Unit tests only
npm run test

# Planner tests only
npm run test:planner

# E2E tests (requires dev server or build)
npx playwright test

# Coverage report
npm run test:coverage

# Watch mode during development
npm run test:watch
```
