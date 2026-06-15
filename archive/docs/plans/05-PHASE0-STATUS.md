# Phase 0 Status Report

*Generated: 2026-06-12*

---

## DATABASE FIXES

### 1. Fix platform/drizzle/drizzle.config.ts dotenv path

**Status: DONE** (already fixed)

The file already uses dotenv.config({ path: ".env.local" }) with correct comment
"Load environment variables from the repo root." Schema path is
platform/drizzle/schema.ts and output is platform/drizzle/migrations - both correct
for running drizzle-kit from repo root.

### 2. Verify npx drizzle-kit studio config correctness

**Status: DONE** (config verified correct)

Config uses dialect: "postgresql", reads DATABASE_URL from .env.local, schema and
output paths are repo-root-relative. Cannot test actual connection without DB credentials,
but configuration is correct.

### 3. planner_saves column contract (PLANNER-SAVES-SCHEMA.md)

**Status: DONE** (already exists and is complete)

docs/plans/PLANNER-SAVES-SCHEMA.md exists with full column contract. Key finding:
the canonical persistence layer (plannerPersistence.ts) uses the Drizzle plans table,
NOT planner_saves. The schema doc correctly documents this distinction.

### 4-6. Migration tasks (write migration, apply, confirm Supabase URL)

**Status: BLOCKED** - No database credentials available in this environment.

Cannot apply migrations or verify table existence without DB access. The schema
contract is documented in PLANNER-SAVES-SCHEMA.md for when access is available.

---

## TOOLING FIXES

### 7. Repair Jest roots/aliases

**Status: DONE**

Both jest configs (jest.config.js and jest.features.config.js) use correct repo-root
relative paths. No references to apps/site or packages/features in jest configs.
The jest.features.config.js correctly scopes to features/planner/** test match.
Module aliases map correctly to existing directories.

### 8. Missing test entrypoints - setup file fix

**Status: DONE** (fixed)

jest.config.js referenced tests/jest.setup.ts which did NOT exist. Only
tests/jest.shared.setup.ts and tests/jest.features.setup.ts existed.
Created tests/jest.setup.ts as a copy of tests/jest.shared.setup.ts (which
contains the full setup: testing-library/jest-dom, fetch polyfill, mocks).
jest.features.setup.ts simply re-exports shared setup, confirming they should
be identical.

All package.json test commands reference valid config files:
- test -> jest.config.js (valid)
- test:features -> jest.features.config.js (valid)
- test:planner-catalog -> playwright.config.ts (valid)
- test:e2e:nav -> playwright.config.ts (valid)
- test:a11y -> playwright.config.ts (valid)

### 9. Test output under results/

**Status: DONE**

- jest.config.js: coverageDirectory points to results/coverage/site
- jest.features.config.js: coverageDirectory points to results/coverage/features
- results/ directory exists.

### 10. @/components/draw/* alias

**Status: DONE** (no active code uses it)

All 6 remaining usages of @/components/draw/* are in archive/legacy-oando-ui/ -
which is the archive directory. No active feature code uses this alias. The Jest
alias correctly maps it to archive/legacy-oando-ui/$1 for any tests that touch
archived code.

### 11. Scoped active-planner tsconfig

**Status: PARTIAL**

config/build/tsconfig.features.json exists and extends tsconfig.json, but it
references stale monorepo paths (apps/site/**, packages/**) that no longer exist.
It does NOT scope specifically to features/planner. The main tsconfig.json include
already covers features/**. A dedicated planner-scoped tsconfig does not yet exist.

---

## CODE FIXES

### 12. Break features/shared -> features/buddy-planner cycle

**Status: TODO** (not fixed - 10 imports remain)

features/shared/auth/ has 10 imports from @/features/buddy-planner:
- lib/session.ts - re-exports types from buddy-planner/types/auth
- lib/AuthProvider.tsx - imports supabase client and SessionState type
- components/LoginPage.tsx - imports supabase client and UI components
- components/SignupPage.tsx - imports supabase client and UI components
- components/AuthShell.tsx - imports useDocumentTitle hook
- components/ResendVerificationButton.tsx - imports supabase client and Button

These need to be moved to @/lib/auth/ or have their buddy-planner deps replaced
with direct platform imports. NOT fixed in this pass - requires careful refactoring.

### 13. Remove shared -> app/ imports

**Status: TODO** (not fixed - 1 import remains)

features/shared/entry/SuiteLoginPage.tsx imports:
  import { LoginForm } from "@/app/(site)/login/LoginForm"

This reverses the intended dependency direction. LoginForm should be extracted to
a shared component or the SuiteLoginPage should be moved to app/.

---

## SUMMARY

| # | Item | Status |
|---|------|--------|
| 1 | drizzle.config.ts dotenv path | DONE |
| 2 | drizzle-kit studio config | DONE |
| 3 | PLANNER-SAVES-SCHEMA.md | DONE |
| 4-6 | DB migrations | BLOCKED |
| 7 | Jest roots/aliases | DONE |
| 8 | Test entrypoints | DONE (fixed) |
| 9 | Test output under results/ | DONE |
| 10 | @/components/draw/* alias | DONE |
| 11 | Scoped planner tsconfig | PARTIAL |
| 12 | shared -> buddy-planner cycle | TODO |
| 13 | shared -> app/ imports | TODO |
