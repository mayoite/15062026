# 09 — Phase 0 Status Report

*Generated: 2026-06-12 — Foundation fixes to restore trust in validation, testing, and persistence.*
*Updated: 2026-06-13 — 0504 parity repairs verified; lint and Git state corrected.*

## Purpose

Phase 0 restores a trustworthy foundation — database connectivity, test runners, persistence contracts — so migration phases 1+ can proceed with reproducible gates. **Phase 0 is not complete** until `npm run release:gate` passes, Git state is reviewable, and persistence ownership is single-source.

---

## Live Verification Snapshot (2026-06-13)

| Command | Result |
|---|---|
| `npm.cmd run typecheck` | **pass** |
| `npm.cmd run test:planner` | **181/181 pass** (Vitest; `tests/planner/`) |
| `npm.cmd run lint` | **fail** — 25 current errors |
| `git status --short` | **fail** — `fatal: bad object HEAD` |
| `npm run build` | **not re-run after 0504 parity repairs**; last known pass 2026-06-12 |
| `npm run db:test` | **not re-run in this batch**; last known pass 2026-06-12 |
| `npm run db:ensure-plans` | **not re-run in this batch**; was idempotent bootstrap on 2026-06-12 |
| Admin env | **not re-verified in this batch** |

---

## Phase 0 Exit Criteria

| Criterion | Status |
|---|---|
| TypeScript errors visible and zero | **Done** |
| Vitest planner suite meaningful | **Done** (181 tests) |
| `npm run build` succeeds | **Needs re-run after 0504 parity repairs** |
| Drizzle `plans` reachable for member saves | **Done** (`db:test`) |
| `npm run release:gate` passes end-to-end | **Not done** — blocked at lint |
| Git metadata usable for review | **Not done** — `fatal: bad object HEAD` |
| Single persistence contract (no dual-write drift) | **Not done** — admin `planner_saves` |
| Co-located feature tests in CI path | **Not done** — `catalogBlockBridge.test.ts` orphaned |
| `shared` → `buddy-planner` cycle broken | **Not done** — 10 imports |

---

## DATABASE FIXES

### 1. Fix `platform/drizzle/drizzle.config.ts` dotenv path

**Status: DONE**

Uses `dotenv.config({ path: ".env.local" })`. Schema `platform/drizzle/schema.ts`; output `platform/drizzle/migrations`.

### 2. Verify Drizzle / Postgres connectivity

**Status: DONE** (2026-06-12)

- `tools/scripts/db_test_connection.ts` — postgres direct (avoids `server-only` import)
- `npm run db:test` — ping + `plans`/`profiles` table check + admin env presence
- `drizzle-kit studio` — config correct; manual studio session not logged this batch

### 3. `planner_saves` column contract

**Status: DONE** (documented)

Canonical user saves: Drizzle `plans` via `plannerPersistence.ts` / `plannerSaves.ts`. Admin Supabase `planner_saves` still used by `app/api/admin/plans/*` — see `05-BACKEND-AND-DATA.md`.

Legacy reference was folded into `docs/new/05-BACKEND-AND-DATA.md`; no live `docs/plans/` path remains.

### 4. Write / apply Drizzle migrations

**Status: PARTIAL**

| Item | State |
|---|---|
| Migration file `0000_daffy_longshot.sql` | Exists in `platform/drizzle/migrations/` |
| `drizzle-kit migrate` full apply | **Blocked** — legacy DB already has partial schema (`offices`, `teams`, `profiles`, …) without `plans` |
| `npm run db:ensure-plans` | **Done** — `CREATE TABLE IF NOT EXISTS plans` + FK bootstrap |
| `drizzle.__drizzle_migrations` journal | Empty — full migrate not reconciled |

**Next:** Mark `0000` applied or split incremental migration; do not re-run full DDL on prod without diff.

### 5. Admin `planner_saves` migration

**Status: NOT DONE**

- No `planner_saves` in `platform/supabase/migrations.admin/`
- Admin env vars present; table existence not verified this batch
- RLS test `plannerSavesRLS.test.ts` — missing (`06-TESTING.md`)

### 6. Confirm Supabase URL ownership

**Status: PARTIAL**

- User saves: Drizzle `DATABASE_URL` — verified
- Admin: `SUPABASE_AUTH_DATABASE_URL` — env present; routes in `app/api/admin/plans/`
- Catalog: separate public Supabase client — unchanged

---

## TOOLING FIXES

### 7. Jest roots / aliases

**Status: DONE**

Jest configs use repo-root paths. Primary unit runner for planner is **Vitest** (`npm run test:planner`), not Jest features config.

### 8. Test entrypoints

**Status: DONE**

`tests/jest.setup.ts` created. Playwright configs valid for `test:a11y`, `test:e2e:nav`, `test:planner-catalog`.

### 9. Test output under `results/`

**Status: DONE**

Coverage → `results/coverage/`; catalog QA → `results/catalog-qa/`; block previews → `results/block-previews/`.

### 10. `@/components/draw/*` alias

**Status: DONE**

Active code does not use alias; archive only.

### 11. Scoped active-planner tsconfig

**Status: PARTIAL**

`config/build/tsconfig.features.json` still references stale `apps/site`, `packages/**`. Main `tsconfig.json` covers `features/**`; dedicated planner scope not created.

### 12. Vitest include path gap

**Status: TODO** (new — 2026-06-12)

`vitest.config.ts` includes only `tests/**/*.test.ts`. Co-located tests skipped by CI:

- `features/planner/tldraw/shapes/shapeUtils/catalogBlockBridge.test.ts` — SH/NS chair counts, canvas unit repair

**Fix:** Move to `tests/planner/` or extend Vitest `include`.

### 13. ESLint `state` path

**Status: DONE**

Removed non-existent `state/` from `package.json` lint script (2026-06-12). Current lint fails on 25 errors across app/API, planner data/UI, planner hooks, and auth pages.

### 13b. 0504 import lint cleanup

**Status: TODO** (2026-06-13)

The 0504 parity repair made TypeScript and planner tests pass, but introduced or exposed lint issues in imported/adapted planner draft/session/UI files. Fix these before any release-gate claim.

---

## CODE FIXES

### 13c. 0504 import TypeScript repair

**Status: DONE** (2026-06-13)

Imported donor assumptions were adapted enough for `npm.cmd run typecheck` to pass: compatibility shims and planner document/session contracts now compile inside the current flat-root app. This does not mean the donor architecture is accepted.

### 14. Break `features/shared` → `features/buddy-planner` cycle

**Status: TODO** (10 imports remain)

Files in `features/shared/auth/` still import buddy-planner types/client. Target: `@/lib/auth/` or platform imports.

### 15. Remove `shared` → `app/` imports

**Status: TODO** (1 import)

`features/shared/entry/SuiteLoginPage.tsx` imports `LoginForm` from `app/(site)/login/`.

---

## SUMMARY

| # | Item | Status |
|---|---|---|
| 1 | drizzle.config.ts dotenv | **DONE** |
| 2 | DB connectivity (`db:test`) | **DONE** |
| 3 | planner_saves contract documented | **DONE** |
| 4 | Drizzle `plans` table live | **DONE** (bootstrap) |
| 5 | Full drizzle migrate reconciled | **PARTIAL** |
| 6 | Admin `planner_saves` migration | **NOT DONE** |
| 7 | Jest roots/aliases | **DONE** |
| 8 | Test entrypoints | **DONE** |
| 9 | Output under `results/` | **DONE** |
| 10 | `@/components/draw/*` | **DONE** |
| 11 | Scoped planner tsconfig | **PARTIAL** |
| 12 | Vitest co-located tests | **TODO** |
| 13 | ESLint path fix | **DONE** |
| 13b | 0504 lint cleanup | **TODO** |
| 13c | 0504 TypeScript repair | **DONE** |
| 14 | shared → buddy-planner cycle | **TODO** |
| 15 | shared → app/ import | **TODO** |
| — | `release:gate` green | **NOT DONE** |
| — | Git metadata reviewable | **NOT DONE** |

---

## Operator Commands

```bash
npm run db:test          # verify DATABASE_URL + plans table
npm run db:ensure-plans  # create plans if missing (safe to re-run)
npm.cmd run test:planner # 181 geometry + block + svg-qa + guest migration + 0504 parity tests
npm run typecheck
npm run build
npm.cmd run lint         # currently 25 errors
npm run release:gate     # blocked at lint until ESLint cleanup
```

---

## Cross-References

| Topic | Doc |
|---|---|
| CI gate detail | `06-TESTING.md` |
| Capability / geometry gaps | `07-CAPABILITY-MATRIX.md`, `08-GEOMETRY-STATUS.md` |
| Persistence risks | `05-BACKEND-AND-DATA.md` |
| Migration sequence | `10-MIGRATION-PHASES.md` |
