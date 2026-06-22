import Link from "next/link";
import styles from "./RepoStorePageView.module.css";

const metrics = [
  ["0", "type blockers", "typecheck exit 0 verified 2026-06-20"],
  ["0", "lint blockers", "lint exit 0 verified 2026-06-20"],
  ["31/31", "deterministic tests pass", "navigation-data, exportActions, PlannerLeftPanel"],
  ["10", "plan phases", "audit through release"],
];

const auditFindings = [
  ["Critical", "Planner persistence", "features/planner/store/* + features/planner/persistence/*", "Duplicate draft, save, import and persistence responsibilities.", "Keep persistence/ canonical; migrate callers and remove store copies."],
  ["High", "Planner 3D", "features/planner/viewer/* + features/planner/3d/*", "Two R3F packages model and render the planner scene.", "Merge into one scene package and one document contract."],
  ["High", "Catalog ownership", "features/catalog + lib/catalog + features/planner/catalog + planner/store/catalog*", "Catalog schemas, loaders and adapters span four ownership zones.", "Make features/catalog canonical; retain planner placement adapters only."],
  ["High", "Document bridges", "documentBridge + fabricDocumentBridge + plannerDocumentBridge + shared/document", "Multiple bridge layers translate overlapping planner shapes.", "Reduce to one Fabric adapter and one public PlannerDocument API."],
  ["Medium", "Site content", "lib/site-data/* + components/home/* + route copy", "Content ownership is split between data modules and rendered components.", "Keep global constants shared; colocate feature-owned content."],
  ["Medium", "Stale repo truth", "Readme.md + planner CONTENTS files + canvas-fabric/index.ts", "Files still describe archived docs or tldraw as active.", "Update or remove stale indexes after consolidation."],
];

const planPhases = [
  "Baseline and dependency audit",
  "Restore typecheck and lint",
  "Consolidate planner state and persistence",
  "Consolidate PlannerDocument bridges",
  "Finish Fabric and merge 3D",
  "Consolidate catalog ownership",
  "Consolidate site ownership",
  "Audit platform and API boundaries",
  "Rebuild tests and generated evidence",
  "Make Repo Store evidence-driven",
];

const inventorySummary = [
  ["4,144", "active paths", "Every current source, configuration, test, tooling and public asset path."],
  ["168", "migration review", "Files containing legacy, tldraw, deprecated, stub, ts-nocheck or disabled markers."],
  ["102", "protected paths", "API, configuration, platform, project mirror and proxy files."],
  ["2,941", "public assets", "The largest file group and a separate asset-governance concern."],
];

const classificationSummary = [
  ["10", "canonical", "Active implementation; migration marker is known debt or terminology."],
  ["34", "compatibility", "Forwarders and read adapters retained for legacy data or imports."],
  ["46", "stale", "Migration-era, tldraw, suppressed, or stub surfaces requiring review."],
  ["2", "generated", "Generated schema/type artifacts; do not edit manually."],
  ["8", "protected", "Modification requires explicit approval under repository rules."],
  ["68", "false positive", "Marker does not identify a competing implementation owner."],
];

const stage01Evidence = [
  "results/repo-audit/stage01-findings.md",
  "results/repo-audit/stage01-validation.txt",
  "results/repo-audit/migration-review-imports.csv",
  "results/repo-audit/migration-review-classification.md",
  "results/repo-audit/duplicate-filenames.csv",
  "results/repo-audit/duplicate-responsibilities.csv",
  "results/repo-audit/duplicate-content.csv",
  "results/repo-audit/circular-imports.csv",
];

const workflow = [
  {
    step: "01",
    title: "Inspect",
    owner: "Repo map",
    status: "Live",
    action: "Read route tree, package scripts, active feature folders, and route contract.",
    output: "Current source map",
  },
  {
    step: "02",
    title: "Classify",
    owner: "Wiring audit",
    status: "Verified",
    action: "All 168 migration-review paths have classification plus direct, type-only, and dynamic import-reference fields.",
    output: "Validated connection ledger",
  },
  {
    step: "03",
    title: "Clean",
    owner: "Repo hygiene",
    status: "Started",
    action: "Keep root source-only. Move test reports, screenshots, and Playwright output into results/.",
    output: "Less root noise",
  },
  {
    step: "04",
    title: "Replace",
    owner: "Planner",
    status: "Active",
    action: "Finish Fabric as 2D engine, keep 3D synced, remove tldraw drive paths and stale labels.",
    output: "One planner",
  },
  {
    step: "05",
    title: "Verify",
    owner: "Release gate",
    status: "Blocked",
    action: "Run typecheck, lint, planner tests, route smoke, and screenshot checks after current failures are fixed.",
    output: "Proof, not claims",
  },
  {
    step: "06",
    title: "Ship",
    owner: "Oando app",
    status: "Target",
    action: "Keep one website, one planner, one catalog source, one results folder, one release path.",
    output: "Coherent app",
  },
];

const domains = [
  ["Public site", "app/(site), components/site, components/home", "Wired", "Marketing, products, contact, portal entry."],
  ["Planner route", "app/planner -> PlannerWorkspaceRoute -> UnifiedPlannerPage", "Wired", "Thin route into active workspace shell."],
  ["Fabric canvas", "features/planner/canvas-fabric", "Wired", "Current 2D runtime surface."],
  ["3D viewer", "features/planner/viewer, features/planner/3d", "Partial", "R3F present; bridge still needs hardening."],
  ["Planner legacy", "tldraw comments, stubs, stale CONTENTS", "Stale", "Remove from live language and drive paths."],
  ["Generated evidence", "results/playwright-report, results/screenshots, results/test-results", "Organized", "All test outputs should land under results/."],
];

const blockers = [
  ["Typecheck", "Verified", "Root TypeScript 6 typecheck passes exit 0; evidence: results/repo-audit/agent-d-06-evidence.txt."],
  ["Lint", "Verified", "ESLint passes exit 0 with zero warnings; evidence: results/repo-audit/agent-d-06-evidence.txt."],
  ["Runtime bugs", "Fixed", "wall drag hang (floorplanCanvas.ts:410-477), room bbox math (floorplanCanvas.ts:614-646), duplicate three.js instance (SharedR3FEngine.tsx deleted)."],
  ["Stage 01 audit", "Verified", "168/168 migration-review paths classified; validation reports no missing paths or classifications."],
];

const nextActions = [
  "Resolve full planner suite OOM worker error (predates this session).",
  "Complete tldraw residue cleanup in progress.",
  "Complete persistence barrel migration in progress.",
  "Wire Fabric gaps: templates, blueprint capture, AI layout apply, document import/export proof.",
];

export function RepoStorePageView() {
  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <aside className={styles.rail} aria-label="Repo store navigation">
          <Link href="/" className={styles.logo}>OANDO</Link>
          <nav>
            <a href="#workflow">Workflow</a>
            <a href="#audit">Audit</a>
            <a href="#inventory">Files</a>
            <a href="#evidence">Evidence</a>
            <a href="#plan">Plan</a>
            <a href="#domains">Domains</a>
            <a href="#blockers">Blockers</a>
            <a href="#next">Next</a>
          </nav>
          <div className={styles.pathBox}>
            <span>Route</span>
            <strong>/repo-store</strong>
          </div>
        </aside>

        <div className={styles.content}>
          <header className={styles.topbar}>
            <div>
              <p>Repository command center</p>
              <h1>Make the Oando app understandable, wired, and shippable.</h1>
            </div>
            <Link href="/planner" className={styles.primaryLink}>Open planner</Link>
          </header>

          <section className={styles.metrics} aria-label="Repository counts">
            {metrics.map(([value, label, detail]) => (
              <article key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
                <p>{detail}</p>
              </article>
            ))}
          </section>

          <section className={styles.panel} id="audit">
            <div className={styles.panelHead}>
              <h2>Repository Audit</h2>
              <p>Ownership conflicts confirmed from the current tree and import paths.</p>
            </div>
            <div className={styles.auditTable} role="table" aria-label="Repository audit findings">
              {auditFindings.map(([severity, area, path, evidence, action]) => (
                <article key={area} role="row">
                  <strong data-severity={severity}>{severity}</strong>
                  <div>
                    <h3>{area}</h3>
                    <code>{path}</code>
                  </div>
                  <p>{evidence}</p>
                  <p className={styles.auditAction}>{action}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.panel} id="plan">
            <div className={styles.panelHead}>
              <h2>Consolidation Plan</h2>
              <code className={styles.planLink}>repo-plan/00-START-HERE.md</code>
            </div>
            <ol className={styles.planGrid}>
              {planPhases.map((phase, index) => (
                <li key={phase}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{phase}</strong>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.panel} id="inventory">
            <div className={styles.panelHead}>
              <h2>Complete File Inventory</h2>
              <code className={styles.planLink}>results/repo-audit/active-files.md</code>
            </div>
            <div className={styles.inventoryGrid}>
              {inventorySummary.map(([value, label, detail]) => (
                <article key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                  <p>{detail}</p>
                </article>
              ))}
            </div>
            <div className={styles.inventoryPaths}>
              <code>results/repo-audit/active-files.md</code>
              <code>results/repo-audit/active-files.csv</code>
            </div>
          </section>

          <section className={styles.panel} id="evidence">
            <div className={styles.panelHead}>
              <div>
                <h2>Validated Stage 01 Evidence</h2>
                <p>168 inventory migration-review paths classified with zero missing paths or classifications.</p>
              </div>
              <code className={styles.planLink}>results/repo-audit/stage01-validation.txt</code>
            </div>
            <div className={styles.inventoryGrid}>
              {classificationSummary.map(([value, label, detail]) => (
                <article key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                  <p>{detail}</p>
                </article>
              ))}
            </div>
            <div className={styles.inventoryPaths}>
              <code>36 duplicate filename groups</code>
              <code>6 duplicate responsibility buckets</code>
              <code>5 exact-content duplicate groups</code>
              <code>2 runtime circular-import components</code>
            </div>
            <div className={styles.inventoryPaths} aria-label="Stage 01 evidence paths">
              {stage01Evidence.map((evidencePath) => (
                <code key={evidencePath}>{evidencePath}</code>
              ))}
            </div>
          </section>

          <section className={styles.panel} id="workflow">
            <div className={styles.panelHead}>
              <h2>Actual Workflow</h2>
              <p>What should happen every time this repo is cleaned or shipped.</p>
            </div>
            <div className={styles.workflow}>
              {workflow.map((item) => (
                <article key={item.step}>
                  <span>{item.step}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.action}</p>
                  </div>
                  <strong data-status={item.status}>{item.status}</strong>
                  <footer>
                    <b>{item.owner}</b>
                    <em>{item.output}</em>
                  </footer>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.grid} id="domains">
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <h2>Connection Ledger</h2>
                <p>First pass from route and import evidence.</p>
              </div>
              <div className={styles.domainRows}>
                {domains.map(([name, path, state, note]) => (
                  <article key={name}>
                    <div>
                      <h3>{name}</h3>
                      <code>{path}</code>
                    </div>
                    <strong data-state={state}>{state}</strong>
                    <p>{note}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className={styles.panel} id="blockers">
              <div className={styles.panelHead}>
                <h2>Release Blockers</h2>
                <p>Current truth from commands already run.</p>
              </div>
              <div className={styles.blockers}>
                {blockers.map(([name, state, detail]) => (
                  <article key={name}>
                    <strong>{name}</strong>
                    <span data-state={state}>{state}</span>
                    <p>{detail}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className={styles.nextPanel} id="next">
            <div>
              <h2>Next Build Direction</h2>
              <p>
                Stop treating the repo as folders. Treat it as a workflow with proof:
                connection audit, planner replacement, artifact discipline, verification.
              </p>
            </div>
            <ol>
              {nextActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ol>
            <footer>
              Path: /repo-store | Source: app/(site)/repo-store/page.tsx,
              components/repo-store/RepoStorePageView.tsx | Plan: repo-plan/00-START-HERE.md | Handover: repo-plan/99-HANDOVER.md | Inventory: results/repo-audit/active-files.md | Test artifacts: results/
            </footer>
          </section>
        </div>
      </section>
    </main>
  );
}
