/**
 * Runtime evidence probe.
 *
 * Hits the live dev server (default http://localhost:3000) with a real Chromium
 * via Playwright and captures concrete DOM evidence:
 *
 *  - For every public page, the computed font-size of the visible h1.
 *  - For every planner route, whether the canonical ThemeProvider injected
 *    a <style id="dynamic-block-theme"> tag and how many CSS variables it set.
 *  - For /api/theme/active/, the JSON shape that came back.
 *
 * Output: results/runtime-evidence.json
 *
 * Run with the dev server already running:
 *   npm.cmd run dev   (in another shell)
 *   node scripts/runtime-evidence-probe.mjs
 */

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const BASE = process.env.PROBE_BASE_URL ?? "http://localhost:3000";

const PUBLIC_PAGES = [
  "/",
  "/products",
  "/products/seating",
  "/projects",
  "/about",
  "/contact",
  "/solutions",
  "/service",
  "/sustainability",
  "/showrooms",
];

const PLANNER_ROUTES = [
  "/oando-planner/guest",
  "/buddy-planner/editor",
];

const OUT = resolve("results", "runtime-evidence.json");

function pad(s, n) {
  return String(s).padEnd(n, " ");
}

async function probeH1(page, urlPath) {
  const status = (await page.goto(BASE + urlPath, { waitUntil: "networkidle", timeout: 30_000 }))?.status() ?? 0;
  // give animated reveal a beat
  await page.waitForTimeout(300);
  const result = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll("h1"));
    const visible = all.find((el) => {
      const r = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      return (
        r.width > 0 &&
        r.height > 0 &&
        cs.display !== "none" &&
        cs.visibility !== "hidden" &&
        cs.opacity !== "0"
      );
    });
    if (!visible) {
      return { found: false, count: all.length };
    }
    const cs = window.getComputedStyle(visible);
    return {
      found: true,
      count: all.length,
      fontSize: cs.fontSize,
      fontSizePx: parseFloat(cs.fontSize),
      lineHeight: cs.lineHeight,
      fontFamily: cs.fontFamily,
      className: visible.className,
      text: (visible.textContent || "").trim().slice(0, 80),
    };
  });
  return { url: urlPath, status, ...result };
}

async function probeThemeInjection(page, urlPath) {
  const status = (await page.goto(BASE + urlPath, { waitUntil: "networkidle", timeout: 45_000 }))?.status() ?? 0;
  // ThemeProvider mounts in a useEffect, then fetches /api/theme/active/.
  // Give it up to 5 s to inject the style tag.
  let injected = false;
  let injectedDetail = null;
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    injectedDetail = await page.evaluate(() => {
      const tag = document.getElementById("dynamic-block-theme");
      if (!tag) return null;
      const css = tag.textContent || "";
      const varCount = (css.match(/--[a-z0-9-]+\s*:/gi) || []).length;
      return {
        tagName: tag.tagName,
        cssLength: css.length,
        varCount,
        sample: css.slice(0, 200),
      };
    });
    if (injectedDetail) {
      injected = true;
      break;
    }
    await page.waitForTimeout(250);
  }
  return { url: urlPath, status, injected, detail: injectedDetail };
}

async function probeApi(page) {
  const resp = await page.request.get(BASE + "/api/theme/active/");
  const status = resp.status();
  let body = null;
  try {
    body = await resp.json();
  } catch {
    body = { _parseError: true, raw: (await resp.text()).slice(0, 200) };
  }
  // shrink body so the evidence file stays readable
  const summary = body && typeof body === "object" ? {
    keys: Object.keys(body),
    hasData: "data" in body,
    payloadKeys:
      body.data && body.data.payload_jsonb && typeof body.data.payload_jsonb === "object"
        ? Object.keys(body.data.payload_jsonb).slice(0, 20)
        : null,
  } : { _nonObject: true };
  return { url: "/api/theme/active/", status, summary };
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const evidence = {
    base: BASE,
    capturedAt: new Date().toISOString(),
    api: null,
    publicH1: [],
    plannerInjection: [],
    summary: null,
  };

  evidence.api = await probeApi(page);

  for (const p of PUBLIC_PAGES) {
    try {
      evidence.publicH1.push(await probeH1(page, p));
    } catch (err) {
      evidence.publicH1.push({ url: p, error: String(err) });
    }
  }

  for (const p of PLANNER_ROUTES) {
    try {
      evidence.plannerInjection.push(await probeThemeInjection(page, p));
    } catch (err) {
      evidence.plannerInjection.push({ url: p, error: String(err) });
    }
  }

  // build a one-line summary per route for quick console scan
  const lines = [];
  lines.push(`API ${pad(evidence.api.url, 28)} status=${evidence.api.status} keys=${(evidence.api.summary?.keys || []).join(",")}`);
  for (const r of evidence.publicH1) {
    lines.push(`H1  ${pad(r.url, 28)} status=${r.status ?? "?"} h1=${r.found ? r.fontSizePx + "px" : "MISSING"} count=${r.count ?? 0}`);
  }
  for (const r of evidence.plannerInjection) {
    lines.push(`THM ${pad(r.url, 28)} status=${r.status ?? "?"} injected=${r.injected} vars=${r.detail?.varCount ?? 0}`);
  }
  evidence.summary = lines;

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(evidence, null, 2), "utf8");

  console.log("\n=== Runtime evidence probe ===");
  for (const line of lines) console.log(line);
  console.log(`\nWrote ${OUT}\n`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
