"use client";

import { useMemo, useState } from "react";

export type InventoryRow = {
  kind: string;
  urlRoute: string;
  area: string;
  renderMode: string;
  auth: string;
  file: string;
  summary: string;
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

function parseInventoryCsv(csv: string): InventoryRow[] {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const index = (name: string) => headers.indexOf(name);

  const kindIdx = index("kind");
  const routeIdx = index("url_route");
  const areaIdx = index("area");
  const renderIdx = index("render_mode");
  const authIdx = index("auth");
  const fileIdx = index("file");
  const summaryIdx = index("summary") >= 0 ? index("summary") : index("how_it_works");

  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    return {
      kind: cols[kindIdx] ?? "",
      urlRoute: cols[routeIdx] ?? "",
      area: cols[areaIdx] ?? "",
      renderMode: cols[renderIdx] ?? "",
      auth: cols[authIdx] ?? "",
      file: cols[fileIdx] ?? "",
      summary: cols[summaryIdx] ?? "",
    };
  });
}

type Props = {
  csv: string;
  generatedAt: string | null;
  rowCount: number;
};

export default function AdminInventoryPageView({ csv, generatedAt, rowCount }: Props) {
  const rows = useMemo(() => parseInventoryCsv(csv), [csv]);
  const [kindFilter, setKindFilter] = useState<"all" | string>("all");
  const [areaFilter, setAreaFilter] = useState<"all" | string>("all");
  const [query, setQuery] = useState("");

  const kinds = useMemo(() => [...new Set(rows.map((row) => row.kind).filter(Boolean))].sort(), [rows]);
  const areas = useMemo(() => [...new Set(rows.map((row) => row.area).filter(Boolean))].sort(), [rows]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (kindFilter !== "all" && row.kind !== kindFilter) return false;
      if (areaFilter !== "all" && row.area !== areaFilter) return false;
      if (!needle) return true;
      return [row.urlRoute, row.file, row.summary, row.auth]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [rows, kindFilter, areaFilter, query]);

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wide text-soft">Route inventory</p>
        <h1 className="text-2xl font-semibold text-strong">App pages & APIs</h1>
        <p className="mt-1 text-sm text-muted">
          Live view of <code className="text-xs">results/app-pages-inventory.csv</code> — regenerate with{" "}
          <code className="text-xs">node scripts/generate-app-inventory-csv.mjs</code>.
        </p>
        <p className="mt-1 text-xs text-soft">
          {rowCount} rows
          {generatedAt ? ` · file updated ${new Date(generatedAt).toLocaleString("en-IN")}` : ""}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search route, file, summary…"
          className="min-w-[16rem] flex-1 rounded-lg border border-soft bg-panel px-3 py-2 text-sm"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className="rounded-lg border border-soft bg-panel px-3 py-2 text-sm"
          value={kindFilter}
          onChange={(event) => setKindFilter(event.target.value)}
        >
          <option value="all">All kinds</option>
          {kinds.map((kind) => (
            <option key={kind} value={kind}>
              {kind}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-soft bg-panel px-3 py-2 text-sm"
          value={areaFilter}
          onChange={(event) => setAreaFilter(event.target.value)}
        >
          <option value="all">All areas</option>
          {areas.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-soft bg-panel p-6 text-sm text-muted">
          Inventory file is missing or empty. Run the generator script to populate{" "}
          <code className="text-xs">results/app-pages-inventory.csv</code>.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-soft bg-panel">
          <div className="border-b border-soft px-4 py-3 text-sm text-muted">
            Showing {filtered.length} of {rows.length}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="border-b border-soft bg-subtle text-xs uppercase tracking-wide text-soft">
                <tr>
                  <th className="px-4 py-3 font-medium">Kind</th>
                  <th className="px-4 py-3 font-medium">Route</th>
                  <th className="px-4 py-3 font-medium">Area</th>
                  <th className="px-4 py-3 font-medium">Auth</th>
                  <th className="px-4 py-3 font-medium">File</th>
                  <th className="px-4 py-3 font-medium">Summary</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={`${row.kind}-${row.urlRoute}-${row.file}`} className="border-b border-soft align-top last:border-b-0">
                    <td className="px-4 py-3 text-muted">{row.kind}</td>
                    <td className="px-4 py-3 font-mono text-xs text-strong">{row.urlRoute || "—"}</td>
                    <td className="px-4 py-3 text-muted">{row.area}</td>
                    <td className="px-4 py-3 text-muted">{row.auth}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{row.file}</td>
                    <td className="max-w-md px-4 py-3 text-muted">{row.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
