/**
 * Shared Istanbul/V8 coverage counters for coverage-final.json.
 * Vitest v8 often omits the `l` map — lines are derived from statementMap + `s`.
 */

export function pct(n, d) {
  return d ? Math.round((1000 * n) / d) / 10 : 0;
}

/** @returns {{ covered: number, total: number }} */
export function lineCounts(cov) {
  const direct = cov.l || {};
  const directKeys = Object.keys(direct);
  if (directKeys.length > 0) {
    let covered = 0;
    for (const k of directKeys) {
      if (direct[k] > 0) covered++;
    }
    return { covered, total: directKeys.length };
  }

  const stmtMap = cov.statementMap || {};
  const stmts = cov.s || {};
  /** @type {Map<number, boolean>} */
  const byLine = new Map();

  for (const id in stmts) {
    const line = stmtMap[id]?.start?.line;
    if (line == null) continue;
    const hit = stmts[id] > 0;
    byLine.set(line, byLine.get(line) || hit);
  }

  let covered = 0;
  for (const hit of byLine.values()) {
    if (hit) covered++;
  }
  return { covered, total: byLine.size };
}

/** @returns {{ stmtCovered, stmtTotal, fnCovered, fnTotal, brCovered, brTotal, lineCovered, lineTotal }} */
export function fileCounts(cov) {
  const stmts = cov.s || {};
  const fns = cov.f || {};
  const branches = cov.b || {};
  let stmtCovered = 0;
  let stmtTotal = 0;
  let fnCovered = 0;
  let fnTotal = 0;
  let brCovered = 0;
  let brTotal = 0;

  for (const k in stmts) {
    stmtTotal++;
    if (stmts[k] > 0) stmtCovered++;
  }
  for (const k in fns) {
    fnTotal++;
    if (fns[k] > 0) fnCovered++;
  }
  for (const k in branches) {
    for (const h of branches[k]) {
      brTotal++;
      if (h > 0) brCovered++;
    }
  }

  const { covered: lineCovered, total: lineTotal } = lineCounts(cov);

  return {
    stmtCovered,
    stmtTotal,
    fnCovered,
    fnTotal,
    brCovered,
    brTotal,
    lineCovered,
    lineTotal,
  };
}

export function emptyMetrics() {
  return {
    statements: { covered: 0, total: 0, pct: 0 },
    functions: { covered: 0, total: 0, pct: 0 },
    branches: { covered: 0, total: 0, pct: 0 },
    lines: { covered: 0, total: 0, pct: 0 },
  };
}

export function addMetrics(bucket, cov) {
  const c = fileCounts(cov);
  bucket.statements.covered += c.stmtCovered;
  bucket.statements.total += c.stmtTotal;
  bucket.functions.covered += c.fnCovered;
  bucket.functions.total += c.fnTotal;
  bucket.branches.covered += c.brCovered;
  bucket.branches.total += c.brTotal;
  bucket.lines.covered += c.lineCovered;
  bucket.lines.total += c.lineTotal;
}

export function finalizeMetrics(bucket) {
  for (const key of ["statements", "functions", "branches", "lines"]) {
    const m = bucket[key];
    m.pct = pct(m.covered, m.total);
  }
  return bucket;
}