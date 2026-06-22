import Link from "next/link";
import styles from "./ResultsHubPageView.module.css";
import { RESULT_GENERATORS, type ResultsSnapshot } from "./resultsData";

function kindLabel(kind: string): string {
  if (kind === "data") return "data";
  if (kind === "markup") return "html";
  if (kind === "text") return "text";
  if (kind === "asset") return "asset";
  if (kind === "report") return "report";
  return "file";
}

function prettyCount(count: number): string {
  return new Intl.NumberFormat("en-US").format(count);
}

export function ResultsHubPageView({ snapshot }: { snapshot: ResultsSnapshot }) {
  const bundles = snapshot.bundles;

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <aside className={styles.rail} aria-label="Results navigation">
          <Link href="/" className={styles.logo}>
            OANDO
          </Link>
          <div className={styles.railCard}>
            <span>Results hub</span>
            <strong>results/</strong>
            <p>One live index for generated test, coverage, audit, and screenshot output.</p>
          </div>
          <nav className={styles.nav}>
            <a href="#overview">Overview</a>
            <a href="#generators">Generators</a>
            <a href="#bundles">Bundles</a>
            <a href="#spotlight">Spotlight</a>
          </nav>
          <div className={styles.railCard}>
            <span>Scan time</span>
            <strong>{new Date(snapshot.scannedAt).toLocaleString("en-IN")}</strong>
          </div>
        </aside>

        <div className={styles.content}>
          <header className={styles.hero} id="overview">
            <div>
              <p>Filesystem-backed mini site</p>
              <h1>All generated test outputs, grouped by bundle and read straight from `results/`.</h1>
              <p className={styles.heroText}>
                Every bundle below is discovered at request time, so new `results/&lt;name&gt;/...`
                output drops into the page automatically.
              </p>
            </div>
            <div className={styles.heroCard}>
              <div>
                <span>Bundles</span>
                <strong>{prettyCount(snapshot.bundleCount)}</strong>
              </div>
              <div>
                <span>Files</span>
                <strong>{prettyCount(snapshot.fileCount)}</strong>
              </div>
              <div>
                <span>Root files</span>
                <strong>{prettyCount(snapshot.rootFileCount)}</strong>
              </div>
            </div>
          </header>

          <section className={styles.summaryRow}>
            {[
              ["Coverage reports", "Full CSV/HTML/JSON in `results/coverage-reports/planner/` and `results/coverage-reports/site/`."],
              ["Raw coverage", "Vitest Istanbul output stays in `results/coverage/` and `results/coverage-site/`."],
              ["Playwright", "JSON and run artifacts live in `results/audits/` and `results/test-results/`."],
              ["Evidence", "Repo audit, screenshots, and generated markdown stay under `results/`."],
              ["Surface", "This page is the browser for everything that lands in the results tree."],
            ].map(([title, detail]) => (
              <article key={title}>
                <strong>{title}</strong>
                <p>{detail}</p>
              </article>
            ))}
          </section>

          <section className={styles.panel} id="generators">
            <div className={styles.panelHead}>
              <h2>Generator commands</h2>
              <p>npm scripts that write into `results/` and appear on this page after you run them.</p>
            </div>
            <div className={styles.bundleGrid}>
              {RESULT_GENERATORS.map((gen) => (
                <article key={gen.command} className={styles.bundleCard}>
                  <div className={styles.bundleHead}>
                    <div>
                      <h3>{gen.command.replace("npm run ", "")}</h3>
                      <code>results/{gen.outputPath}</code>
                    </div>
                  </div>
                  <p>{gen.description}</p>
                  {gen.requiresDevServer ? (
                    <p className={styles.heroText}>Requires `npm run dev` on port 3000 before running.</p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          <section className={styles.panel} id="bundles">
            <div className={styles.panelHead}>
              <h2>Bundles</h2>
              <p>Top-level folders under `results/` become the bundle cards below.</p>
            </div>
            <div className={styles.bundleGrid}>
              {bundles.map((bundle) => (
                <article key={bundle.key} className={styles.bundleCard} id={`bundle-${bundle.key}`}>
                  <div className={styles.bundleHead}>
                    <div>
                      <h3>{bundle.label}</h3>
                      <code>{bundle.key === "root" ? "results/" : `results/${bundle.key}/`}</code>
                    </div>
                    <span>{prettyCount(bundle.fileCount)} files</span>
                  </div>
                  <p>{bundle.description}</p>
                  <div className={styles.sampleList} aria-label={`${bundle.label} sample files`}>
                    {bundle.sampleArtifacts.map((artifact) => (
                      <span key={artifact.relativePath}>
                        <b>{kindLabel(artifact.kind)}</b>
                        <code>{artifact.title}</code>
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.panel} id="spotlight">
            <div className={styles.panelHead}>
              <h2>Spotlight files</h2>
              <p>The most useful report artifacts discovered in the tree.</p>
            </div>
            <div className={styles.spotlightGrid}>
              {snapshot.spotlightArtifacts.map((artifact) => (
                <article key={artifact.relativePath} className={styles.spotlightCard}>
                  <span>{kindLabel(artifact.kind)}</span>
                  <strong>{artifact.title}</strong>
                  <code>{artifact.relativePath}</code>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Notes</h2>
              <p>What this page intentionally does and does not try to do.</p>
            </div>
            <div className={styles.notes}>
              <p>
                It scans the live `results/` tree server-side, so new outputs appear without
                copying them into a second data store.
              </p>
              <p>
                It keeps coverage folders readable by sampling their key artifacts instead of
                rendering tens of thousands of HTML files on one screen.
              </p>
              <p>
                If you want the writers standardized next, the next step is to force every test
                harness into `results/&lt;testname&gt;/...`.
              </p>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
