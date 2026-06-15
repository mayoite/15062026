import { readFileSync } from "fs";

const coverage = JSON.parse(
  readFileSync("./results/coverage/coverage-final.json", "utf8"),
);

let s = 0;
let sc = 0;
let b = 0;
let bc = 0;
let f = 0;
let fc = 0;
let files = 0;
const below = [];

const pct = (hit, total) => (total ? +((hit / total) * 100).toFixed(1) : 100);

for (const [filePath, entry] of Object.entries(coverage)) {
  if (!filePath.includes("features\\planner\\tldraw\\") && !filePath.includes("features/planner/tldraw/")) {
    continue;
  }
  files++;

  let fs = 0;
  let fsc = 0;
  let fb = 0;
  let fbc = 0;
  let ff = 0;
  let ffc = 0;

  if (entry.s) {
    for (const n of Object.values(entry.s)) {
      s++;
      fs++;
      if (n > 0) {
        sc++;
        fsc++;
      }
    }
  }
  if (entry.b) {
    for (const arr of Object.values(entry.b)) {
      for (const n of arr) {
        b++;
        fb++;
        if (n > 0) {
          bc++;
          fbc++;
        }
      }
    }
  }
  if (entry.f) {
    for (const n of Object.values(entry.f)) {
      f++;
      ff++;
      if (n > 0) {
        fc++;
        ffc++;
      }
    }
  }

  const rel = filePath.split(/tldraw[\\/]/).pop() ?? filePath;
  const sp = pct(fsc, fs);
  const bp = pct(fbc, fb);
  const fp = pct(ffc, ff);
  if (sp < 80 || bp < 80 || fp < 80) {
    below.push({ file: rel, stmts: sp, branches: bp, funcs: fp });
  }
}

console.log("tldraw/ bucket:", {
  files,
  stmts: pct(sc, s) + "%",
  branches: pct(bc, b) + "%",
  funcs: pct(fc, f) + "%",
  below80Count: below.length,
});

below
  .sort((a, b) => a.stmts - b.stmts || a.branches - b.branches)
  .forEach((row) => console.log(row));