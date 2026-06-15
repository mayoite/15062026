// Screenshot a set of routes against one or more running dev servers using
// Playwright's bundled Chromium (NOT the chrome channel — that isn't installed).
//
// Usage:
//   node scripts/shoot-routes.mjs <label>=<baseUrl> [<label>=<baseUrl> ...] --out <dir>
// Example:
//   node scripts/shoot-routes.mjs A=http://localhost:3000 B=http://localhost:3001 --out compare-shots

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const argv = process.argv.slice(2);
const outIdx = argv.indexOf("--out");
const outDir = outIdx >= 0 ? argv[outIdx + 1] : "compare-shots";
const targets = argv
  .filter((a, i) => !a.startsWith("--") && i !== outIdx + 1)
  .map((a) => {
    const eq = a.indexOf("=");
    return { label: a.slice(0, eq), base: a.slice(eq + 1) };
  });

// `gated` routes need the planner guest-pass cookie and a longer wait for the
// tldraw/R3F canvas to mount; `fullPage:false` because the canvas is viewport-sized.
const ROUTES = [
  ["home", "/", {}],
  ["gallery", "/gallery", {}],
  ["solutions", "/solutions", {}],
  ["login", "/login", {}],
  ["configurator-guest", "/configurator/guest", {}],
  ["planner-canvas", "/planner/canvas", { gated: true, wait: 6000, fullPage: false }],
];

fs.mkdirSync(outDir, { recursive: true });

const summary = [];

const browser = await chromium.launch();
try {
  for (const { label, base } of targets) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    // Grant planner guest access so /planner/canvas renders the editor, not the gate.
    const origin = new URL(base);
    await ctx.addCookies([{
      name: "planner_guest_pass",
      value: "true",
      domain: origin.hostname,
      path: "/",
    }]);
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

    for (const [name, route, opts] of ROUTES) {
      const url = base + route;
      const file = path.join(outDir, `${name}-${label}.png`);
      const rec = { label, route, status: null, error: null, finalUrl: null, shot: file };
      errors.length = 0;
      try {
        const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
        rec.status = resp ? resp.status() : "no-response";
        await page.waitForTimeout(opts.wait ?? 1500);
        rec.finalUrl = page.url(); // detect redirects to the access gate
        await page.screenshot({ path: file, fullPage: opts.fullPage !== false });
        rec.consoleErrors = errors.slice(0, 5);
      } catch (e) {
        rec.error = String(e).split("\n")[0];
        try { await page.screenshot({ path: file }); } catch {}
      }
      summary.push(rec);
      const redir = rec.finalUrl && !rec.finalUrl.endsWith(route) ? ` REDIRECTED->${rec.finalUrl}` : "";
      console.log(`[${label}] ${route} -> status=${rec.status} err=${rec.error ?? "none"} consoleErr=${(rec.consoleErrors||[]).length}${redir}`);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(outDir, "shoot-summary.json"), JSON.stringify(summary, null, 2));
console.log(`\nSaved ${summary.length} screenshots + shoot-summary.json to ${outDir}`);
