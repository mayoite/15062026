# Repository Migration Playbook — Final
## `mayoite/15062026` · Root + 6 Folders · 14 Phases

> **Before anything else, every agent must:**
> 1. Read `AGENTS.md`
> 2. Read `Readme.md`
> 3. Read only the live files it will touch
>
> **Standing rules (from AGENTS.md):**
> - Minimum necessary changes only
> - No commit, push, or destructive change unless explicitly requested
> - No Playwright or any test without explicit user permission
> - Log all failures, skips, and blockers in `docs/Failures.md`
> - Prefer archiving over deleting
> - After every phase report: **Done / Verified / Skipped / Risks / Next**

---

## Target Architecture

```
repo-root/
├── .git/
├── .github/
├── .vscode/
├── .gitignore
├── .gitattributes
├── .secretlintrc.json
├── .env.example
├── AGENTS.md
├── Readme.md
├── CONTENTS.md
├── package.json          ← stays root; scripts updated to proxy into site/
├── package-lock.json
├── tsconfig.json         ← stays root (workspace-level)
│
├── archive/              ← results/, outputs/, findingsnew/, audit folders
├── plans/                ← wip/, docs/plans/
├── tech-stack-generator/ ← renamed from tech-stack-docs/ (Vite source)
├── tech-stack-docs/      ← empty placeholder for generated static output
├── docs/                 ← Failures.md, Handover.md, docs/api/, stray .md files
└── site/                 ← entire Next.js app + all app-level configs
```

---

## Phase Map

| # | Phase | What happens | Agent tier |
|---|-------|-------------|------------|
| 0 | Safety checkpoint | Branch + snapshot | Pro/Max |
| 1 | Audit & mapping | Dry-run, produce migration-map.md | Pro/Max |
| 2 | Archive sweep | Move results/, outputs/ etc. | Mini/Flash |
| 3 | Plans consolidation | Move wip/, docs/plans/ | Mini/Flash |
| 4 | Tech stack split | Rename tech-stack-docs/ → tech-stack-generator/ | Mini/Flash |
| 5 | Docs isolation | Move Failures.md, Handover.md, stray .md | Mini/Flash |
| 6 | App relocation | Move all Next.js app folders into site/ | Mini/Flash |
| 7a | Root package.json scripts | Rewrite all script paths to proxy into site/ | Pro/Max |
| 7b | site/ tsconfig + aliases | Fix path aliases for new location | Pro/Max |
| 7c | Tailwind + PostCSS | Fix content globs | Pro/Max |
| 7d | Vite config | Set outDir → ../tech-stack-docs/ | Mini/Flash |
| 8 | Typecheck + lint | Run tsc --noEmit and eslint from site/ | Pro/Max |
| 9 | Test config alignment | Audit vitest + playwright configs | Pro/Max |
| 10 | Manifest regeneration | Refresh CONTENTS.md | Mini/Flash |
| 11 | Test execution | Run unit + planner tests (NO playwright without permission) | Mini/Flash |
| 12 | Test repair | Fix migration-caused failures only | Pro/Max |
| 13 | Release gate | npm run release:gate (explicit permission required) | Pro/Max |
| 14 | Final report | Mission complete document | Pro/Max |

---

## Prompt 0 – Safety Checkpoint
### Pre-migration branch + snapshot | Agent tier: Pro/Max

> Read `AGENTS.md`. Before any file is moved or edited, do the following:
>
> 1. Create a migration branch:
>    ```
>    git checkout -b migration/root-6-folder
>    ```
>
> 2. Record the current commit SHA and save it to `docs/Failures.md`
>    under a new section `Migration – Pre-flight Snapshot`:
>    ```
>    Pre-migration SHA: <git rev-parse HEAD>
>    Branch: migration/root-6-folder
>    Date: <today>
>    ```
>
> 3. Confirm the working tree is clean (`git status`).
>    If there are uncommitted changes, **stop and ask the user** whether to stash or commit first.
>
> **Deliverable:**
> - Branch name confirmed
> - Pre-migration SHA logged in `docs/Failures.md`
> - Clean working tree confirmed
>
> **Stop and wait for human approval before proceeding to Phase 1.**

---

## Prompt 1 – Architecture Audit & Mapping
### Dry-run only | Agent tier: Pro/Max

> Read `AGENTS.md`, then `Readme.md`. **Do NOT move any files.**
>
> Scan the current root directory. Categorize every item into one bucket:
>
> **ROOT** (never moves):
> `.git`, `.github/`, `.vscode/`, `.gitignore`, `.gitattributes`, `.secretlintrc.json`,
> `.env.example`, `AGENTS.md`, `Readme.md`, `CONTENTS.md`,
> `package.json`, `package-lock.json`, `tsconfig.json`
>
> **archive/**:
> `results/`, `outputs/`,
> `findingsnew/` *(skip if absent — log skip)*,
> `comprehensive-audit-2026-06-20/` *(skip if absent — log skip)*,
> any existing `archive/` sub-contents
>
> **plans/**:
> `wip/`, `docs/plans/` *(skip if absent — log skip)*
>
> **tech-stack-generator/** *(rename of current `tech-stack-docs/`)*:
> The Vite source that currently lives in `tech-stack-docs/`
>
> **tech-stack-docs/** *(new empty dir)*:
> Created in Phase 4 — placeholder for Vite build output
>
> **docs/**:
> `Failures.md`, `Handover.md`, `docs/api/`, any stray `.md` files at root
> — **excluding** `AGENTS.md`, `Readme.md`, `CONTENTS.md`
>
> **site/**:
> `app/`, `features/`, `components/`, `lib/`, `platform/`, `config/`,
> `public/`, `tests/`, `scripts/`, `fixtures/`, `i18n/`,
> `next.config.js`, `next-env.d.ts`, `postcss.config.mjs`, `proxy.ts`,
> `vitest.config.ts`, `vitest.shared.ts`, `vitest.site.config.ts`,
> `fix-planner-custom-tools.js`,
> `asset-cdn/` *(skip if absent — log skip)*
>
> **UNCLASSIFIED**: anything else → set `NOTES = "UNCLASSIFIED – human review needed"`
>
> **Deliverable:**
> Create `migration-map.md` at root with columns:
> `CURRENT_PATH | TARGET_BUCKET | NOTES`
>
> **Stop and wait for human approval.**

---

## Prompt 2 – Archival Sweep
### Phase 2 | Agent tier: Mini/Flash

> Read `AGENTS.md`.
> Create `git checkout -b migration/phase-2` before touching any files.
> Create `archive/` at root if absent.
> Using `git mv` (history preserved), move into `archive/`:
>
> ```
> git mv results/ archive/results
> git mv outputs/ archive/outputs
> git mv findingsnew/ archive/findingsnew     # SKIP + LOG if absent
> git mv comprehensive-audit-2026-06-20/ archive/comprehensive-audit-2026-06-20  # SKIP + LOG if absent
> ```
>
> If any existing `archive/` sub-folders exist, merge them in.
>
> **Constraints:**
> Do NOT touch `app/`, `features/`, `components/`, `lib/`, `platform/`,
> `config/`, `public/`, `tests/`, `scripts/`, `tech-stack-docs/`, `docs/`, `plans/`, `wip/`.
>
> Log all skips in `docs/Failures.md` under `Phase 2 – Skips`.
>
> **Deliverable:**
> - Every `git mv` command used
> - `tree archive/` output
> - Commit: `git commit -m "chore: phase-2 archive sweep"`
>
> **Stop and wait for approval.**

---

## Prompt 3 – Plans Consolidation
### Phase 3 | Agent tier: Mini/Flash

> Read `AGENTS.md`.
> Create `git checkout -b migration/phase-3`.
> Create `plans/` at root if absent.
> Using `git mv`:
>
> ```
> git mv wip/ plans/wip
> git mv docs/plans/ plans/plans       # SKIP + LOG if docs/plans/ absent
> ```
>
> **Constraints:**
> Preserve Git history. Do NOT modify the contents of any plan files.
>
> **Deliverable:**
> - Every `git mv` command
> - `tree plans/` output
> - Commit: `git commit -m "chore: phase-3 plans consolidation"`
>
> **Stop and wait for approval.**

---

## Prompt 4 – Tech Stack Split
### Phase 4 | Agent tier: Mini/Flash

> Read `AGENTS.md`.
> Create `git checkout -b migration/phase-4`.
>
> ```
> git mv tech-stack-docs/ tech-stack-generator/
> mkdir tech-stack-docs
> touch tech-stack-docs/.gitkeep
> git add tech-stack-docs/.gitkeep
> ```
>
> **Constraints:**
> Do NOT change any Vite code, config, or file contents.
> Only rename the folder and create the empty placeholder.
>
> **Deliverable:**
> - Confirm rename and creation
> - `tree tech-stack-generator/` and `tree tech-stack-docs/`
> - Commit: `git commit -m "chore: phase-4 tech-stack split"`
>
> **Stop and wait for approval.**

---

## Prompt 5 – Core Docs Isolation
### Phase 5 | Agent tier: Mini/Flash

> Read `AGENTS.md`.
> Create `git checkout -b migration/phase-5`.
> Using `git mv`:
>
> ```
> git mv Failures.md docs/Failures.md
> git mv Handover.md docs/Handover.md           # only if Handover.md exists at root
> # ensure docs/api/ is already under docs/ — move if elsewhere
> # move any other stray .md files at root into docs/
> # EXCLUDE: AGENTS.md, Readme.md, CONTENTS.md
> ```
>
> **Constraints:**
> Do NOT edit any file contents. Move only.
>
> **Deliverable:**
> - Every `git mv` command
> - `tree docs/` output
> - Commit: `git commit -m "chore: phase-5 docs isolation"`
>
> **Stop and wait for approval.**

---

## Prompt 6 – Great App Relocation
### Phase 6 | Agent tier: Mini/Flash

> Read `AGENTS.md`.
> Create `git checkout -b migration/phase-6`.
> Create `site/` at root if absent.
> Using `git mv`, move ALL of the following into `site/`:
>
> ```
> git mv app/                    site/app
> git mv features/               site/features
> git mv components/             site/components
> git mv lib/                    site/lib
> git mv platform/               site/platform
> git mv config/                 site/config
> git mv public/                 site/public
> git mv tests/                  site/tests
> git mv scripts/                site/scripts
> git mv fixtures/               site/fixtures
> git mv i18n/                   site/i18n
> git mv next.config.js          site/next.config.js
> git mv next-env.d.ts           site/next-env.d.ts
> git mv postcss.config.mjs      site/postcss.config.mjs
> git mv proxy.ts                site/proxy.ts
> git mv vitest.config.ts        site/vitest.config.ts
> git mv vitest.shared.ts        site/vitest.shared.ts
> git mv vitest.site.config.ts   site/vitest.site.config.ts
> git mv fix-planner-custom-tools.js  site/scripts/fix-planner-custom-tools.js
> git mv asset-cdn/              site/asset-cdn     # SKIP + LOG if absent
> ```
>
> **Constraints:**
> Do NOT edit any code. Do NOT touch `docs/`, `plans/`, `archive/`,
> `tech-stack-generator/`, `tech-stack-docs/`.
>
> **Deliverable:**
> - Every `git mv` command
> - `tree site/ --max-depth 2` output
> - Commit: `git commit -m "chore: phase-6 app relocation into site/"`
>
> **Stop and wait for approval.**

---

## Prompt 7a – Root `package.json` Scripts Rewrite
### Phase 7a | Highest-risk phase | Agent tier: Pro/Max

> Read `AGENTS.md`. Before editing, add to `docs/Failures.md` under
> `Phase 7 – Known Risks`:
>
> *"next dev/build requires config in working directory. All scripts must
> invoke Next.js with `site/` as cwd. Pattern: `cd site && next dev` or
> `next dev --rootDir site/`. If the dev server silently ignores next.config.js,
> this is the cause."*
>
> Now edit root `package.json`. The following rules apply:
>
> **Pattern for all Next.js and app scripts:**
> ```json
> "dev":   "cd site && next dev --webpack",
> "build": "cd site && next build",
> "start": "cd site && next start",
> ```
>
> **Pattern for scripts that reference app folder paths directly:**
> The current `lint` script is:
> ```
> "lint": "eslint -c config/build/eslint.config.mjs app components features lib tests --max-warnings=0"
> ```
> After Phase 6, all these folders are under `site/`. Rewrite to:
> ```
> "lint": "cd site && eslint -c config/build/eslint.config.mjs app components features lib tests --max-warnings=0"
> ```
>
> **Pattern for scripts/ references:**
> Any script using `node scripts/` or `npx tsx scripts/` becomes
> `cd site && node scripts/` or `cd site && npx tsx scripts/`.
>
> **Pattern for vitest:**
> ```
> "test": "cd site && vitest run",
> "test:coverage": "cd site && npm run test:clean && vitest run --coverage ...",
> ```
>
> **Pattern for playwright (config path changes):**
> The playwright config moves to `site/config/build/playwright.config.ts`.
> Update all `playwright test -c config/build/playwright.config.ts` references to
> `playwright test -c site/config/build/playwright.config.ts`.
>
> **Pattern for `release:gate`:**
> Rewrite to chain: `npm run lint:secrets && cd site && npm run lint && npm run typecheck && ...`
> keeping `lint:secrets` at root (secretlint scans root), everything else inside site.
>
> **Pattern for `typecheck`:**
> ```
> "typecheck": "cd site && tsc -p tsconfig.json --noEmit",
> "typecheck:scripts": "cd site && tsc -p scripts/tsconfig.json --noEmit",
> ```
>
> **Pattern for `docs:sync*`:**
> ```
> "docs:sync": "cd site && node scripts/generate-docs.mjs",
> ```
>
> **Do NOT change:**
> - `lint:secrets` (secretlint runs at root)
> - `backup:sync*` (PowerShell scripts, path is absolute)
> - `vercel:preview`, `vercel:prod` (Vercel CLI runs at root)
>
> **Constraints:**
> Minimal changes. Do not add or remove any scripts. Only change the invocation paths.
>
> **Deliverable:**
> - Show before/after diff for every changed script line
> - Commit: `git commit -m "chore: phase-7a root package.json proxy into site/"`
>
> **Stop and wait for approval.**

---

## Prompt 7b – `site/tsconfig.json` Path Aliases
### Phase 7b | Agent tier: Pro/Max

> Read `AGENTS.md`. Open `site/tsconfig.json` (moved from root in Phase 6).
>
> The root `tsconfig.json` stays at root as the workspace-level config.
> `site/tsconfig.json` is the app-level config.
>
> Audit all `paths` aliases. Current aliases likely read:
> ```json
> "@/*": ["./*"]
> ```
> After the move into `site/`, relative paths inside `site/tsconfig.json` still
> resolve correctly relative to `site/` — **no change needed IF** `baseUrl` is `"."`.
>
> Verify:
> - `baseUrl` is `"."` (relative to `site/`)
> - All `paths` entries are relative and resolve within `site/`
> - `include` arrays reference `app/**`, `components/**`, etc. (not `site/app/**`)
> - `rootDir` (if set) is `"."` not `"../"`
>
> Also audit the root `tsconfig.json`:
> - It should now only cover top-level tooling (scripts, tests at root level)
> - Remove or update any `include` paths that pointed to `app/`, `components/` etc.
>
> **Constraints:** Minimal changes. Document every change.
>
> **Deliverable:**
> - List every change with before/after
> - Commit: `git commit -m "chore: phase-7b tsconfig path alias audit"`
>
> **Stop and wait for approval.**

---

## Prompt 7c – Tailwind and PostCSS
### Phase 7c | Agent tier: Pro/Max

> Read `AGENTS.md`. Inside `site/`, locate `tailwind.config.*` and `postcss.config.mjs`.
>
> **Tailwind config content globs:**
> Ensure they scan the correct paths. After the move, the correct globs are:
> ```js
> content: [
>   "./app/**/*.{js,ts,jsx,tsx,mdx}",
>   "./features/**/*.{js,ts,jsx,tsx,mdx}",
>   "./components/**/*.{js,ts,jsx,tsx,mdx}",
>   "./lib/**/*.{js,ts,jsx,tsx,mdx}",
>   "./platform/**/*.{js,ts,jsx,tsx,mdx}",
> ]
> ```
> (All paths relative to `site/` — do NOT prefix with `site/`.)
>
> **PostCSS config:**
> Verify `@tailwindcss/postcss` is still referenced correctly.
> No path changes should be needed — verify only.
>
> **Constraints:** Minimal changes. Do NOT change Tailwind theme or plugins.
>
> **Deliverable:**
> - Before/after for any changed globs
> - Commit: `git commit -m "chore: phase-7c tailwind content globs"`
>
> **Stop and wait for approval.**

---

## Prompt 7d – Vite Config for tech-stack-generator
### Phase 7d | Agent tier: Mini/Flash

> Read `AGENTS.md`. Open `tech-stack-generator/vite.config.*`.
>
> Set the build output directory to point at the root-level `tech-stack-docs/`:
> ```js
> build: {
>   outDir: '../tech-stack-docs',
>   emptyOutDir: true,
> }
> ```
>
> **Constraints:** Do NOT change any other Vite settings.
>
> **Deliverable:**
> - Before/after diff
> - Commit: `git commit -m "chore: phase-7d vite outDir → ../tech-stack-docs"`
>
> **Stop and wait for approval.**

---

## Prompt 8 – Typecheck and Lint
### Phase 8 | Agent tier: Pro/Max

> Read `AGENTS.md`.
>
> From root (scripts now proxy into site/ after Phase 7a):
> ```
> npm run typecheck
> npm run lint
> ```
>
> Expected behaviour after config repairs:
> - `typecheck` runs `cd site && tsc -p tsconfig.json --noEmit`
> - `lint` runs eslint against `site/app`, `site/components`, etc.
>
> **If either fails:**
> - Log every error in `docs/Failures.md` under `Phase 8 – Typecheck/Lint failures`
> - Fix only errors caused by the migration (broken imports, wrong alias resolution)
> - Do NOT fix pre-existing type errors unrelated to the move
>
> **Deliverable:**
> - Typecheck result: pass / fail with error count
> - Lint result: pass / fail with warning/error count
> - List of files fixed (if any)
> - Commit: `git commit -m "chore: phase-8 typecheck + lint pass"`
>
> **Stop and wait for approval.**

---

## Prompt 9 – Test Suite Alignment
### Phase 9 | Agent tier: Pro/Max

> Read `AGENTS.md`.
>
> **Vitest configs** (now in `site/`):
> Audit `site/vitest.config.ts`, `site/vitest.shared.ts`, `site/vitest.site.config.ts`:
> - Determine which is the workspace umbrella.
>   If `vitest.config.ts` references all test suites (planner + site), it may need to
>   stay at root or be replaced by a root-level workspace config.
> - Update `root`, `include`, `exclude` paths so they resolve relative to `site/`
> - Verify alias mappings (e.g. `@/`) match `site/tsconfig.json`
>
> **Playwright config** at `site/config/build/playwright.config.ts`:
> - Update `rootDir`, `testDir`, and any baseURL that references localhost paths
> - Playwright is invoked from root via updated `package.json` scripts —
>   ensure the config file path in scripts matches `site/config/build/playwright.config.ts`
>
> **Sanity checks to add:**
> - Import test: `site/config/route-contract.json` loads without error
> - Import test: `site/lib/site-data/` resolves without error
>
> **Constraints:**
> Do NOT run any tests yet. Config changes only.
>
> **Deliverable:**
> - List every config file changed and specific edits
> - List new sanity tests added
> - Commit: `git commit -m "chore: phase-9 test config alignment"`
>
> **Stop and wait for approval.**

---

## Prompt 10 – Manifest Regeneration
### Phase 10 | Agent tier: Mini/Flash

> Read `AGENTS.md`.
>
> Regenerate `CONTENTS.md` to reflect the new Root + 6-folder architecture:
> ```
> npm run docs:sync:all
> ```
> (After Phase 7a, this proxies to `cd site && node scripts/generate-docs.mjs --all`)
>
> Review the regenerated `CONTENTS.md` — confirm it shows:
> `archive/`, `plans/`, `tech-stack-generator/`, `tech-stack-docs/`, `docs/`, `site/`
> as top-level sections.
>
> If `generate-docs.mjs` itself contains hardcoded paths to old folder locations
> (e.g. scanning `app/` at root), fix those paths to scan `site/app/` instead.
>
> **Deliverable:**
> - Confirm `CONTENTS.md` updated
> - Note any script path fixes needed
> - Commit: `git commit -m "chore: phase-10 CONTENTS.md regenerated"`
>
> **Stop and wait for approval.**

---

## Prompt 11 – Test Execution
### Phase 11 | Agent tier: Mini/Flash

> Read `AGENTS.md`.
>
> ⛔ **Do NOT run Playwright (E2E) without explicit user permission.**
>
> Run unit and planner tests only:
> ```
> npm run test
> npm run test:planner
> ```
>
> **Rules:**
> - Do NOT fix any failing tests in this prompt
> - Collect and summarise results only
>
> **Deliverable — Grouped summary:**
>
> ✅ **Passed** — list test files/suites
> ❌ **Failed (path/import errors)** — list with error excerpt
> ❌ **Failed (timeouts/logic errors)** — list with error excerpt
> ⏭ **Skipped** — with reason
>
> Log all failures in `docs/Failures.md` under `Phase 11 – Test run results`.
>
> **Stop and wait for approval.**

---

## Prompt 12 – Test Repair
### Phase 12 | Agent tier: Pro/Max

> Read `AGENTS.md`.
>
> **Fix only migration-caused failures** from the Phase 11 report:
> - Broken import paths (e.g. `import from '@/lib/...'` not resolving)
> - Misconfigured `rootDir` causing test files not to be found
> - Missing alias mappings in vitest config
>
> **Do NOT fix:**
> - Pre-existing logic failures
> - Pre-existing timeout failures
> - Any test not in the `Failed (path/import errors)` bucket from Phase 11
>
> **Historical E2E note:**
> If `docs/Failures.md` contains known issues for `test:planner-catalog`
> (e.g. timeouts), document their current status — do NOT attempt to fix them
> in this phase unless the failure is clearly path-related.
>
> For every unresolved failure, add a trace to `docs/Failures.md` under
> `Phase 12 – Post-migration test blockers`.
>
> **Deliverable:**
> - ✅ Fixed — which tests now pass, what was changed
> - ❌ Still failing — reason + trace excerpt
> - Commit: `git commit -m "chore: phase-12 migration test repairs"`
>
> **Stop and wait for approval.**

---

## Prompt 13 – Release Gate
### Phase 13 | Explicit user permission required | Agent tier: Pro/Max

> ⛔ **Do NOT run this phase without the user typing explicit permission.**
>
> Read `AGENTS.md`. Once permitted, run from root:
> ```
> npm run release:gate
> ```
>
> This runs (per `package.json`):
> `lint:secrets → lint → typecheck → test → build → test:a11y → test:e2e:nav
> → test:planner-catalog → test:coverage → test:coverage:site`
>
> **Rules:**
> - Do NOT fix failures in this phase
> - Collect and report results only
>
> **Deliverable:**
> - Each step: ✅ Passed / ❌ Failed (with excerpt)
> - Overall gate: **PASSED** or **BLOCKED**
> - Log all failures in `docs/Failures.md` under `Phase 13 – Release gate`
>
> **Stop and wait for approval.**

---

## Prompt 14 – Final Report
### Phase 14 | Migration complete | Agent tier: Pro/Max

> Read `AGENTS.md`. Produce the final mission report.
>
> **Section 1 – Confirmed architecture**
> Show the actual `tree` of the repo root at max-depth 2.
>
> **Section 2 – How to run**
> ```bash
> # Start dev server
> npm run dev              # proxies: cd site && next dev --webpack
>
> # Build
> npm run build            # proxies: cd site && next build
>
> # Build tech-stack-docs
> cd tech-stack-generator && npm run build   # outputs to ../tech-stack-docs/
>
> # Run tests
> npm run test             # unit tests
> npm run test:planner     # planner tests
>
> # Full release gate (requires explicit permission)
> npm run release:gate
> ```
>
> **Section 3 – Remaining known issues**
> Pull from `docs/Failures.md` — list all unresolved items.
>
> **Section 4 – Phase outcome summary**
> Table: Phase | Status | Notes
>
> **Format:**
> Done / Verified / Skipped / Risks / Next
>
> Merge `migration/root-6-folder` into main **only after the user reviews
> and approves this report.**

---

## Appendix A – Git Commands Quick Reference

```bash
# Start migration
git checkout -b migration/root-6-folder

# Per-phase branch pattern
git checkout -b migration/phase-N

# git mv pattern (always use git mv, never mv)
git mv <source> <destination>

# Commit pattern
git commit -m "chore: phase-N <description>"

# Rollback a phase
git checkout migration/phase-N~1  # or git revert

# Check history preserved
git log --follow -- site/app/page.tsx
```

## Appendix B – High-Risk Items

| Risk | Phase | Mitigation |
|------|-------|-----------|
| `next dev` can't find `next.config.js` | 7a | Use `cd site && next dev`; verify at start of Phase 8 |
| `eslint` path references `app components features lib tests` at root | 7a | Rewrite to `cd site && eslint -c config/build/eslint.config.mjs app components features lib tests` |
| `vitest.config.ts` root vs site ambiguity | 9 | Determine umbrella config in Phase 9; may need workspace root config |
| `playwright.config.ts` path in 40+ scripts | 7a | All playwright `-c config/build/playwright.config.ts` must become `-c site/config/build/playwright.config.ts` |
| `scripts/generate-docs.mjs` hardcodes root paths | 10 | Fix scan paths in Phase 10 |
| `package-lock.json` is huge (745KB) — do not move | All | It stays at root always |

## Appendix C – Files That Stay at Root (Never Move)

```
.git/
.github/
.vscode/
.gitignore
.gitattributes
.secretlintrc.json
.env.example
AGENTS.md
Readme.md
CONTENTS.md
package.json
package-lock.json
tsconfig.json        ← workspace-level; site/ gets its own copy
migration-map.md     ← created in Phase 1, can archive after migration
```
