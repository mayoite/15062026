import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import ts from "typescript";

const root = path.resolve(process.cwd());
const outDir = path.join(root, "results", "repo-audit");
const inventoryPath = path.join(outDir, "active-files.csv");
const sourceExts = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

function csvParse(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted && ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
    else if (ch === '"') quoted = !quoted;
    else if (!quoted && ch === ",") { row.push(cell); cell = ""; }
    else if (!quoted && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [rawHeaders, ...body] = rows;
  const headers = rawHeaders.map(h => h.replace(/^\uFEFF/, ""));
  return body.map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
}

function csv(rows, cols) {
  const esc = v => `"${String(v ?? "").replaceAll('"', '""')}"`;
  return [cols.map(esc).join(","), ...rows.map(r => cols.map(c => esc(r[c])).join(","))].join("\n") + "\n";
}

function posix(p) { return p.replaceAll("\\", "/"); }
function existsFile(p) { try { return fs.statSync(p).isFile(); } catch { return false; } }

const inventory = csvParse(fs.readFileSync(inventoryPath, "utf8"));
const activePaths = inventory.map(r => posix(r.Path));
const activeSet = new Set(activePaths);
const sourcePaths = activePaths.filter(p => sourceExts.has(path.extname(p)) && existsFile(path.join(root, p)));
const texts = new Map(sourcePaths.map(p => [p, fs.readFileSync(path.join(root, p), "utf8")]));

function resolveImport(from, spec) {
  if (spec.startsWith("@/")) spec = spec.slice(2);
  else if (spec.startsWith(".")) spec = posix(path.join(path.dirname(from), spec));
  else return null;
  const raw = posix(spec).replace(/^\.\//, "");
  const probes = [raw, ...[".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].map(e => raw + e), ...[".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].map(e => `${raw}/index${e}`)];
  return probes.find(p => activeSet.has(p)) ?? null;
}

const edges = [];
for (const [from, text] of texts) {
  const sf = ts.createSourceFile(from, text, ts.ScriptTarget.Latest, false, from.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  function add(specifier, kind) {
    const to = resolveImport(from, specifier);
    if (to) edges.push({ from, to, kind, specifier });
  }
  function visit(node) {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const clause = node.importClause;
      const bindings = clause?.namedBindings;
      const typeOnly = Boolean(clause?.isTypeOnly || (bindings && ts.isNamedImports(bindings) && !clause.name && bindings.elements.length > 0 && bindings.elements.every(e => e.isTypeOnly)));
      add(node.moduleSpecifier.text, typeOnly ? "type" : "direct");
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      add(node.moduleSpecifier.text, node.isTypeOnly ? "type" : "direct");
    } else if (ts.isCallExpression(node) && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) add(node.arguments[0].text, "dynamic");
      else if (ts.isIdentifier(node.expression) && node.expression.text === "require") add(node.arguments[0].text, "direct");
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
}
const uniqueEdges = [...new Map(edges.map(e => [`${e.from}|${e.to}|${e.kind}`, e])).values()];
const incoming = new Map(), outgoing = new Map();
for (const e of uniqueEdges) {
  if (!incoming.has(e.to)) incoming.set(e.to, []);
  if (!outgoing.has(e.from)) outgoing.set(e.from, []);
  incoming.get(e.to).push(e); outgoing.get(e.from).push(e);
}

const markerRe = /tldraw|@ts-nocheck|legacy|deprecated|stub|not yet available|disabled until/gi;
const protectedPrefixes = ["proxy.ts", "app/api/", "config/build/", "platform/", "project/"];
function classify(p, inv, text) {
  const inc = incoming.get(p) ?? [];
  const lower = text.toLowerCase();
  const base = path.basename(p).toLowerCase();
  if (inv.Status === "Protected" || protectedPrefixes.some(x => p === x || p.startsWith(x))) return ["protected", "Repository rules require approval before modification"];
  if (p.includes("config/database/types/") || /generated|database\.types/.test(p.toLowerCase())) return ["generated", "Generated schema/type artifact; marker is generator output"];
  if (p.startsWith("features/planner/canvas-fabric/")) return ["canonical", "Fabric is the canonical 2D runtime; marker records migration/type debt"];
  const reExportOnly = text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "").trim().split(/\r?\n/).filter(Boolean).every(line => /^(export\s+(?:type\s+)?(?:\*|\{)|[}\s;]*$)/.test(line));
  if (reExportOnly || /@deprecated\s+import from|@deprecated\s+use `/.test(lower)) return ["compatibility", "Deprecated forwarding surface retained for import compatibility"];
  if (base.includes("legacyeditorstub") || (/fabric-era stub|legacy tldraw|tldraw-based 2d canvas/.test(lower))) return ["stale", inc.length ? "Legacy/stub implementation is still referenced and requires migration" : "Legacy/stub implementation has no resolved active-source importer"];
  if (/^\/\/ @ts-nocheck/.test(text) && !p.startsWith("features/planner/canvas-fabric/")) return ["stale", inc.length ? "Type-check suppression on migration-era module still referenced" : "Type-check suppression on unreferenced migration-era module"];
  if (/\*\* stub|not yet implemented|not yet available/.test(lower)) return ["stale", inc.length ? "Stub/disabled behavior remains wired" : "Stub/disabled behavior has no resolved active-source importer"];
  if (/migratelegacy|readlegacy|legacy_product_id|legacyproduct|legacy catalog|legacy-compatible|accepts legacy|tldrawsnapshot/.test(lower)) return ["compatibility", "Active read/migration adapter preserves legacy data compatibility"];
  if (/tldraw/.test(lower) && !/no tldraw dependency|decoupled from tldraw|tldraw out|old tldraw|no longer come from tldraw|deprecated pcf/.test(lower)) return ["stale", inc.length ? "tldraw-era contract/comment remains in a referenced module" : "tldraw-era contract/comment is unreferenced"];
  if (/deprecated|legacy|stub/.test(lower)) return ["false-positive", "Marker is descriptive terminology, API annotation, or unrelated compatibility note"];
  return ["canonical", "Active implementation; marker does not identify a competing owner"];
}

const migration = inventory.filter(r => r.Status === "Migration review").map(inv => {
  const p = posix(inv.Path);
  const text = existsFile(path.join(root, p)) ? fs.readFileSync(path.join(root, p), "utf8") : "";
  const directIn = (incoming.get(p) ?? []).filter(e => e.kind === "direct").map(e => e.from).sort();
  const typeIn = (incoming.get(p) ?? []).filter(e => e.kind === "type").map(e => e.from).sort();
  const dynamicIn = (incoming.get(p) ?? []).filter(e => e.kind === "dynamic").map(e => e.from).sort();
  const directOut = (outgoing.get(p) ?? []).filter(e => e.kind === "direct").map(e => e.to).sort();
  const typeOut = (outgoing.get(p) ?? []).filter(e => e.kind === "type").map(e => e.to).sort();
  const dynamicOut = (outgoing.get(p) ?? []).filter(e => e.kind === "dynamic").map(e => e.to).sort();
  const markers = [...new Set(text.match(markerRe)?.map(x => x.toLowerCase()) ?? [])].sort();
  const [classification, reason] = classify(p, inv, text);
  return { path: p, area: inv.Area, classification, reason, markers: markers.join("; "), direct_importers: directIn.join("; "), type_importers: typeIn.join("; "), dynamic_importers: dynamicIn.join("; "), direct_imports: directOut.join("; "), type_imports: typeOut.join("; "), dynamic_imports: dynamicOut.join("; "), incoming_count: directIn.length + typeIn.length + dynamicIn.length };
});
fs.writeFileSync(path.join(outDir, "migration-review-imports.csv"), csv(migration, ["path", "area", "classification", "reason", "markers", "incoming_count", "direct_importers", "type_importers", "dynamic_importers", "direct_imports", "type_imports", "dynamic_imports"]));

const classCounts = Object.entries(Object.groupBy(migration, r => r.classification)).map(([k, v]) => [k, v.length]).sort((a,b) => a[0].localeCompare(b[0]));
const classMd = ["# Migration-review classification", "", `Generated: ${new Date().toISOString()}`, "", `Candidates: ${migration.length}`, "", "| Classification | Count |", "|---|---:|", ...classCounts.map(([k,v]) => `| ${k} | ${v} |`), "", "Classification is an audit decision, not deletion approval. Import references are in `migration-review-imports.csv`.", "", ...Object.entries(Object.groupBy(migration, r => r.classification)).sort().flatMap(([k, rows]) => [`## ${k}`, "", ...rows.map(r => `- \`${r.path}\` — ${r.reason}; incoming: ${r.incoming_count}`), ""] )].join("\n");
fs.writeFileSync(path.join(outDir, "migration-review-classification.md"), classMd);

const filenameRows = [];
const basenameGroups = Object.groupBy(sourcePaths, p => path.basename(p).toLowerCase());
for (const [basename, paths] of Object.entries(basenameGroups)) if (paths.length > 1) filenameRows.push({ basename, count: paths.length, paths: paths.sort().join("; ") });
filenameRows.sort((a,b) => b.count - a.count || a.basename.localeCompare(b.basename));
fs.writeFileSync(path.join(outDir, "duplicate-filenames.csv"), csv(filenameRows, ["basename", "count", "paths"]));

const responsibilityRules = [
  ["planner catalog normalization", /features\/planner\/(catalog|store)\/(plannerCatalogCore|plannerManagedProductsShared)\.ts$/],
  ["planner persistence", /features\/planner\/(persistence|store|lib)\/.*(persistence|projectStorage|documentBridge).*\.(ts|tsx)$/i],
  ["planner document bridge", /features\/planner\/(document|lib|model|shared\/document)\/.*(document|bridge|snapshot).*\.(ts|tsx)$/i],
  ["planner templates", /features\/planner\/(templates|store)\/.*templates.*\.ts$/i],
  ["planner 3D scene", /features\/planner\/(3d|scene|viewer)\/.*\.(ts|tsx)$/i],
  ["planner catalog data", /features\/planner\/(catalog|store)\/.*(catalog|product|block).*\.(ts|tsx)$/i],
];
const respRows = [];
for (const [responsibility, re] of responsibilityRules) {
  const paths = sourcePaths.filter(p => re.test(p));
  if (paths.length > 1) respRows.push({ responsibility, count: paths.length, paths: paths.sort().join("; "), decision: "Multiple candidate owners; validate canonical owner before moves" });
}
fs.writeFileSync(path.join(outDir, "duplicate-responsibilities.csv"), csv(respRows, ["responsibility", "count", "paths", "decision"]));

const exactHash = new Map();
for (const [p, text] of texts) {
  const h = crypto.createHash("sha256").update(text.replace(/\s+/g, " ").trim()).digest("hex");
  if (!exactHash.has(h)) exactHash.set(h, []);
  exactHash.get(h).push(p);
}
const exactRows = [...exactHash].filter(([, ps]) => ps.length > 1).map(([hash, ps]) => ({ hash, count: ps.length, paths: ps.sort().join("; ") }));
fs.writeFileSync(path.join(outDir, "duplicate-content.csv"), csv(exactRows, ["hash", "count", "paths"]));

const graphScope = sourcePaths.filter(p => /^(app|features|components|lib)\//.test(p));
const graphSet = new Set(graphScope);
const adj = new Map(graphScope.map(p => [p, []]));
for (const e of uniqueEdges) if (e.kind === "direct" && graphSet.has(e.from) && graphSet.has(e.to)) adj.get(e.from).push(e.to);
let index = 0; const stack = [], onStack = new Set(), indices = new Map(), low = new Map(), components = [];
function strong(v) {
  indices.set(v, index); low.set(v, index++); stack.push(v); onStack.add(v);
  for (const w of adj.get(v) ?? []) {
    if (!indices.has(w)) { strong(w); low.set(v, Math.min(low.get(v), low.get(w))); }
    else if (onStack.has(w)) low.set(v, Math.min(low.get(v), indices.get(w)));
  }
  if (low.get(v) === indices.get(v)) {
    const c = []; let w;
    do { w = stack.pop(); onStack.delete(w); c.push(w); } while (w !== v);
    if (c.length > 1 || (adj.get(v) ?? []).includes(v)) components.push(c.sort());
  }
}
for (const v of graphScope) if (!indices.has(v)) strong(v);
const cycleRows = components.map((nodes, i) => ({ cycle_id: i + 1, node_count: nodes.length, nodes: nodes.join("; "), internal_edges: uniqueEdges.filter(e => e.kind === "direct" && nodes.includes(e.from) && nodes.includes(e.to)).map(e => `${e.from} -> ${e.to}`).sort().join("; ") }));
fs.writeFileSync(path.join(outDir, "circular-imports.csv"), csv(cycleRows, ["cycle_id", "node_count", "nodes", "internal_edges"]));

const findings = [
  "# Stage 01 findings",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Migration review",
  "",
  `All ${migration.length} inventory paths marked \`Migration review\` have a classification and direct, type-only, and dynamic import-reference fields.`,
  "",
  "| Classification | Count |",
  "|---|---:|",
  ...classCounts.map(([k, v]) => `| ${k} | ${v} |`),
  "",
  `Unreferenced by resolved active-source imports: ${migration.filter(r => Number(r.incoming_count) === 0).length}. This is not deletion proof.`,
  "",
  "## Duplicate filenames versus responsibilities",
  "",
  `- Duplicate filename groups: ${filenameRows.length}. These are listed independently in \`duplicate-filenames.csv\`.`,
  `- Responsibility review buckets: ${respRows.length}. These are listed independently in \`duplicate-responsibilities.csv\`.`,
  `- Exact normalized-content duplicate groups: ${exactRows.length}. These are listed in \`duplicate-content.csv\`.`,
  "- High-confidence planner duplication includes catalog/store copies of `plannerCatalogCore.ts` and `plannerManagedProductsShared.ts`, multiple persistence/document bridges, three template surfaces, and parallel `3d/` and `viewer/` scene surfaces.",
  "- Exact-content findings include Supabase and Appwrite files under protected `platform/`; no change is authorized by this audit.",
  "",
  "## Runtime circular imports",
  "",
  `Runtime strongly connected components: ${cycleRows.length}. Type-only edges are excluded.`,
  ...cycleRows.map(r => `- Cycle ${r.cycle_id}: ${r.nodes}`),
  "",
  "## Evidence limits",
  "",
  "Computed import expressions and non-`@/` path aliases are not statically resolved. Classification and duplication buckets require ownership review before implementation moves.",
].join("\n") + "\n";
fs.writeFileSync(path.join(outDir, "stage01-findings.md"), findings);

const summary = ["# Stage 01 inventory/classification evidence", "", `Generated: ${new Date().toISOString()}`, "", `- Active inventory rows: ${inventory.length}`, `- Source files parsed: ${sourcePaths.length}`, `- Resolved direct/type/dynamic import edges: ${uniqueEdges.length}`, `- Migration-review candidates classified: ${migration.length}`, `- Duplicate basename groups: ${filenameRows.length}`, `- Duplicate responsibility buckets: ${respRows.length}`, `- Exact duplicate-content groups: ${exactRows.length}`, `- Runtime circular import components: ${cycleRows.length}`, "", "## Outputs", "", "- `stage01-findings.md`", "- `migration-review-imports.csv`", "- `migration-review-classification.md`", "- `duplicate-filenames.csv`", "- `duplicate-responsibilities.csv`", "- `duplicate-content.csv`", "- `circular-imports.csv`", "", "## Method limits", "", "- Imports are statically resolved for relative paths and the `@/` alias; computed import expressions are not resolvable.", "- Duplicate-responsibility rows are review buckets, not proof that implementations are behaviorally identical.", "- Classification does not authorize deletion or modification."].join("\n") + "\n";
fs.writeFileSync(path.join(outDir, "stage01-inventory-summary.md"), summary);
console.log(summary);
