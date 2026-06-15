import fs from "node:fs";

const cov = JSON.parse(fs.readFileSync("results/coverage/coverage-final.json", "utf8"));
const hooks = Object.entries(cov).filter(([key]) => {
  const normalized = key.replaceAll("\\", "/");
  return normalized.includes("features/planner/hooks/") && !normalized.includes("shared/hooks/");
});

let totalBranches = 0;
let hitBranches = 0;
let totalStmts = 0;
let hitStmts = 0;
let totalFns = 0;
let hitFns = 0;

for (const [key, file] of hooks) {
  for (const count of Object.values(file.s ?? {})) {
    totalStmts += 1;
    if (count > 0) hitStmts += 1;
  }
  for (const count of Object.values(file.f ?? {})) {
    totalFns += 1;
    if (count > 0) hitFns += 1;
  }
  for (const counts of Object.values(file.b ?? {})) {
    for (const count of counts) {
      totalBranches += 1;
      if (count > 0) hitBranches += 1;
    }
  }
}

console.log(`hooks stmts: ${((100 * hitStmts) / totalStmts).toFixed(2)}% (${hitStmts}/${totalStmts})`);
console.log(`hooks fn: ${((100 * hitFns) / totalFns).toFixed(2)}% (${hitFns}/${totalFns})`);
console.log(`hooks branches: ${((100 * hitBranches) / totalBranches).toFixed(2)}% (${hitBranches}/${totalBranches})`);

for (const [key, file] of hooks) {
  const name = key.replaceAll("\\", "/").split("/").pop();
  const misses = Object.entries(file.b ?? {}).flatMap(([id, counts]) =>
    counts
      .map((value, index) => (value === 0 ? { line: file.branchMap?.[id]?.line, index } : null))
      .filter(Boolean),
  );

  if (misses.length > 0) {
    console.log(`\n${name} missing branches (${misses.length})`);
    console.log(misses.map((miss) => `L${miss.line}/${miss.index}`).join(" "));
  }
}