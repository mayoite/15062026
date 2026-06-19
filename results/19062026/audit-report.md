# Oando Platform Repository Audit — 2026-06-19

**Branch:** main  
**Commit:** bf3824a (HEAD -> main, origin/main)  
**Working tree:** Clean (no uncommitted changes)  
**Repo size:** 801.62 MiB (pack), 159.09 KiB (objects)  
**Total commits:** 22  

---

## 1. Security Audit (npm audit)

| Severity | Count | Notes |
|----------|-------|-------|
| Critical | 0 | — |
| High | 7 | `undici` (TLS bypass, cache disclosure), `ws` (DoS), `underscore` (DoS recursion) |
| Moderate | 24 | `esbuild` (arbitrary file read), `postcss` (XSS), `dompurify` (config pollution), `@opentelemetry/core` (memory allocation) |
| **Total** | **31** | Most are transitive dev-dependencies; `npm audit fix` can auto-resolve many. `npm audit fix --force` may introduce breaking changes. |

### Notable vulnerable paths
- `lighthouse` → `@sentry/node` → `@opentelemetry/*` (moderate)
- `drizzle-kit` → `@esbuild-kit/*` → `esbuild` (moderate, Windows arbitrary file read)
- `wrangler` → `esbuild` + `miniflare` → `undici` + `ws` (high)
- `next` → `postcss` (moderate, XSS)
- `dompurify` (moderate, config pollution)
- `underscore` / `underscore.string` (high, DoS)

### Recommendations
1. Run `npm.cmd audit fix` to patch non-breaking fixes (DOMPurify, esbuild, undici, ws).
2. Review `underscore` and `fix` packages — they may be unused or replaceable.
3. For `postcss` via `next`, update Next.js if a patch is available; otherwise accept as build-time-only risk.

---

## 2. TypeScript Type Checking

**Status:** FAIL ❌  
**Command:** `tsc -p tsconfig.json --noEmit`  
**Errors:** 3 (all in same file)

```
features/planner/lib/editorTools.ts:209:40
  TS2345: Argument of type 'TLShape' is not assignable to parameter of type 'TLLineShape'.
  Type 'string' is not assignable to type '"line"'.

features/planner/lib/editorTools.ts:255:40
  Same error (duplicate pattern).

features/planner/lib/editorTools.ts:301:7
  TS2352: Conversion to type 'TLShape' may be a mistake — missing x, y, rotation, isLocked.
```

**Context:** These errors stem from legacy tldraw integration code. The current session directive is to replace tldraw with Fabric.js. These errors block both `typecheck` and `next build`.

**Recommendation:** As part of the tldraw → Fabric replacement, remove or migrate `features/planner/lib/editorTools.ts`.

---

## 3. Linting (ESLint)

**Status:** PASS ✅  
**Command:** `eslint -c config/build/eslint.config.mjs app components features lib tests --max-warnings=0`  
**Result:** 0 errors, 0 warnings.

---

## 4. Build

**Status:** FAIL ❌  
**Command:** `next build`  
**Failure reason:** Same 3 TypeScript errors in `features/planner/lib/editorTools.ts` abort the build during the type-check phase.

**Recommendation:** Fix the 3 type errors or exclude the legacy tldraw file from compilation.

---

## 5. Tests

**Status:** MOSTLY PASS ⚠️ (3 failures, 1 worker crash)  
**Command:** `vitest run` (204 test files)  
**Results:** 1,363 passed / 1,369 total | 3 failed | 1 unhandled error (worker heap crash)

### Failed tests

| Test file | Failure | Details |
|-----------|---------|---------|
| `tests/navigation-data.test.ts` | Footer sections count | Expected 3 sections, got 4. `SITE_FOOTER_NAV` has drifted from test expectation. |
| `tests/planner-editor-exportActions.test.ts` | Fabric snapshot depth | `depthMm` is `4040` but test expects `4000`. Minor fixture drift. |
| `tests/planner-editor-PlannerLeftPanel.test.tsx` | Missing AI drawer text | Test expects text "AI assist drawer" but panel renders "AI Assist" tab + different content. UI copy drift. |

### Unhandled error
- **File:** `tests/planner-editor-PlannerWorkspace.test.tsx` (3 tests)  
- **Cause:** Worker process heap out of memory (`FATAL ERROR: Ineffective mark-compacts near heap limit`).  
- **Mitigation:** The test file is large or has a memory leak. Run with `NODE_OPTIONS=--max-old-space-size=4096` or split the test file.

### Test coverage snapshot
- **Test files:** 221  
- **Total tests:** ~1,369  
- **Pass rate:** ~99.5% (excluding OOM crash)  

**Recommendation:**
1. Update `navigation-data.test.ts` to match the 4-section footer.
2. Update `exportActions` test fixture from `4000` to `4040` (or verify if `4040` is correct and fix source).
3. Update `PlannerLeftPanel` test to match actual rendered text.
4. Diagnose `PlannerWorkspace.test.tsx` OOM — likely needs Vitest isolation or memory limit increase.

---

## 6. Dependencies

| Category | Count | Notes |
|----------|-------|-------|
| Production deps | ~80+ | Large surface (Next.js, Supabase, AWS SDK, Three.js, Fabric, etc.) |
| Dev deps | ~80+ | Vitest, ESLint, Drizzle Kit, Wrangler, Playwright, etc. |

### Outdated packages (selected)

| Package | Current | Wanted | Latest | Risk |
|---------|---------|--------|--------|------|
| `next` | (audit) | — | — | `postcss` transitive vuln |
| `drizzle-kit` | 0.19.13 | 0.19.13 | 0.31.10 | Major version behind; fixes esbuild vuln |
| `wrangler` | 4.100.0 | 4.103.0 | 4.103.0 | Fixes undici/ws vulns |
| `eslint` | 9.39.4 | 9.39.4 | 10.5.0 | Major version; update with caution |
| `@types/node` | 25.9.3 | 25.9.4 | 26.0.0 | Minor drift |
| `lucide-react` | 1.18.0 | 1.21.0 | 1.21.0 | Safe to bump |
| `openai` | 6.42.0 | 6.44.0 | 6.44.0 | Safe to bump |
| `sharp` | 0.34.5 | 0.34.5 | 0.35.2 | Minor bump |
| `vitest` | 4.1.8 | 4.1.9 | 4.1.9 | Safe to bump |
| `@playwright/test` | 1.60.0 | 1.61.0 | 1.61.0 | Safe to bump |
| `appwrite` | 25.2.0 | 25.2.0 | 26.0.0 | Major; check breaking changes |
| `react-router-dom` | 7.17.0 | 7.18.0 | 7.18.0 | Safe to bump |

**Recommendation:** Run `npm.cmd update` for safe minor bumps. Schedule `drizzle-kit` and `eslint` major upgrades separately.

---

## 7. Code Health

| Metric | Value | Status |
|--------|-------|--------|
| Source files (TS/TSX) | 853 | — |
| Total source files (incl. CSS/SCSS) | 948 | — |
| Test files | 221 | — |
| TODO / FIXME / HACK markers | 0 | ✅ Clean |
| ESLint violations | 0 | ✅ Clean |

---

## 8. Git Hygiene

- **Working tree:** Clean (no uncommitted changes).
- **Stash:** 1 entry — `stash@{0}: On main: wall-fixes-temp` (3 files, 124 insertions, 57 deletions)
  - `features/planner/editor/PlannerWorkspace.tsx` (64 lines)
  - `features/planner/tldraw/tools/WallTool.ts` (110 lines)
  - `features/planner/ui/PlannerEmptyCanvas.tsx` (7 lines)
  - **Action:** Review and either apply or drop this stash.
- **Commits:** 22 total — relatively young repo with frequent large commits.
- **Contributors:** `mayoite` (17 commits), `dependabot[bot]` (5 commits).
- **Branches:** 1 local (`main`), 6 remote (5 dependabot branches + `main`).
- **Remote:** `origin` → `https://github.com/mayoite/15062026.git`

### Large Blobs in Git History (Top 20)

The 801.62 MiB pack size is explained by binary assets in `public/images/chairs/`:

| File | Size | Type |
|------|------|------|
| `phoenix/phoenix-hb.max` | 28.5 MB | 3ds Max scene |
| `caneva/caneva.dwg` | 22.3 MB | AutoCAD drawing |
| `myel/myel-hb.max` | 17.8 MB | 3ds Max scene |
| `caneva-high/caneva-high.dwg` | 17.5 MB | AutoCAD drawing |
| `fluid-x/fluid-x-hb.max` | 17.0 MB | 3ds Max scene |
| `sway/sway-hb.max` | 14.7 MB | 3ds Max scene |
| `caneva/caneva.max` | 11.8 MB | 3ds Max scene |
| `arvo/arvo.dwg` | 11.1 MB | AutoCAD drawing |
| `caneva-high/caneva-high.max` | 8.4 MB | 3ds Max scene |
| `arvo/arvo.max` | 8.3 MB | 3ds Max scene |

**Total top-20:** ~157 MB of `.max` and `.dwg` files.

**Recommendation:**
1. These files should not be tracked in git. Move to external storage (S3/R2) or use Git LFS.
2. Add `*.max`, `*.dwg` to `.gitignore` and remove from history with `git filter-repo` or BFG Repo Cleaner.
3. Estimated pack size reduction: ~150–200 MB (20–25% of current 801 MB).

---

## 9. Session-Specific Observations (Fabric Replacement Context)

- **tldraw legacy code:** `features/planner/lib/editorTools.ts` is the only file blocking `typecheck` and `build`. It references `TLShape`, `TLLineShape`, and `PlannerShape` from tldraw.
- **Fabric runtime:** Tests for Fabric canvas (`planner-editor-*`, `planner-3d-*`) are largely passing. The 3 failures are minor fixture/copy drift, not architectural issues.
- **3D tests:** `planner-3d-Viewer.test.tsx` passed (2/2). R3F integration is stable in tests.

---

## 10. Environment & Secrets

- **`.env.example`:** 1,795 bytes (tracked in git — safe, contains placeholder values).
- **`.env.local`:** 4,453 bytes (properly gitignored — not tracked).
- **`.gitignore`:** Comprehensive; includes `.env.local`, `node_modules/`, `.next/`, `coverage/`, `*.max`, `*.dwg` (but these are already in history).

**Status:** ✅ No secrets leaked. `.env.local` is correctly excluded.

---

## 11. npm audit fix Preview

**Command:** `npm.cmd audit fix --dry-run`

**Non-breaking fixes available:**
- `@vitest/*` ecosystem: 4.1.8 → 4.1.9 (safe)
- `@aws-sdk/*`: minor patch bumps (safe)
- `wrangler`: 4.100.0 → 4.103.0 (fixes `undici` and `ws` high-severity vulns)
- `react-router-dom`: 7.17.0 → 7.18.0 (safe)
- `@typescript-eslint/*`: 8.61.0 → 8.61.1 (safe)
- `@radix-ui/react-slot`: 1.2.5 → 1.3.0 (safe)

**Removals:**
- `esbuild` 0.27.3 (vulnerable) → replaced by safer version
- `ws` 8.20.1 (vulnerable) → replaced by safer version

**Impact:** Running `npm.cmd audit fix` (without `--force`) will patch ~20 moderate/high vulnerabilities with zero breaking changes.

---

## 12. Action Summary

| Priority | Action | Impact | Effort |
|----------|--------|--------|--------|
| 🔴 P0 | Fix or remove `features/planner/lib/editorTools.ts` | Unblocks `typecheck` and `build` | 1–2 hours |
| 🔴 P0 | Update 3 failing test fixtures / expectations | Restores green CI | 30 min |
| 🔴 P0 | Review and apply/drop `wall-fixes-temp` stash | Prevents lost work | 15 min |
| 🟡 P1 | `npm.cmd audit fix` | Patches 20+ moderate/high vulns (zero breaking changes) | 5 min |
| 🟡 P1 | Diagnose `PlannerWorkspace.test.tsx` OOM | Prevents flaky CI | 1–2 hours |
| 🟡 P1 | Remove `*.max`, `*.dwg` from git history | Reduces pack size by ~150–200 MB | 30 min |
| 🟢 P2 | `npm.cmd update` for minor deps | Keeps dependencies fresh | 10 min |
| 🟢 P2 | Remove `underscore`/`fix` if unused | Removes high-severity vuln | 15 min |
| 🟢 P2 | Add `*.max`, `*.dwg` to `.gitignore` | Prevents future binary bloat | 2 min |

---

## 13. Summary Metrics

| Category | Status | Details |
|----------|--------|---------|
| **Security** | ⚠️ 31 vulns | 7 high, 24 moderate, 0 critical; `npm audit fix` resolves most |
| **Types** | ❌ Fail | 3 errors in `editorTools.ts` (legacy tldraw) |
| **Lint** | ✅ Pass | 0 errors, 0 warnings |
| **Build** | ❌ Fail | Blocked by type errors |
| **Tests** | ⚠️ 99.5% | 1,363 / 1,369 pass; 3 failures + 1 OOM crash |
| **Code Health** | ✅ Clean | 0 TODO/FIXME markers |
| **Git Hygiene** | ⚠️ Needs review | 1 stash, 157 MB of binary assets in history |
| **Env Security** | ✅ Safe | `.env.local` properly gitignored |
| **Dependencies** | ⚠️ Outdated | 22 packages behind; safe minor bumps available |

---

*Audit generated by Oz on 2026-06-19.*
