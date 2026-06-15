import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const rootDir = process.cwd();
const recoveryDir = path.join(rootDir, ".codex-recovery");
const snapshotsDir = path.join(recoveryDir, "snapshots");
const nextPlanPath = path.join(recoveryDir, "NEXT-PLAN.md");
const args = process.argv.slice(2);

function hasFlag(flag) {
  return args.includes(flag);
}

function getFlagValue(prefix, fallback) {
  const match = args.find((arg) => arg.startsWith(`${prefix}=`));
  return match ? match.slice(prefix.length + 1) : fallback;
}

function run(command) {
  try {
    return execSync(command, {
      cwd: rootDir,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    }).trim();
  } catch {
    return "";
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readNextPlan() {
  if (!fs.existsSync(nextPlanPath)) {
    return [
      "- Review the current checklist and mark the active item.",
      "- Record any blocker discovered in the current work block.",
      "- Update `.codex-recovery/DECISIONS.md` if a new rule was set.",
    ].join("\n");
  }

  return fs.readFileSync(nextPlanPath, "utf8").trim();
}

function timestampParts(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());

  return {
    iso: `${year}-${month}-${day}T${hour}:${minute}:${second}`,
    fileSafe: `${year}-${month}-${day}_${hour}-${minute}-${second}`,
    dateSafe: `${year}-${month}-${day}`,
  };
}

function summarizeStatus(statusText) {
  const lines = statusText
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  const summary = {
    modified: 0,
    added: 0,
    deleted: 0,
    renamed: 0,
    copied: 0,
    untracked: 0,
    other: 0,
  };

  for (const line of lines) {
    if (line.startsWith("??")) {
      summary.untracked += 1;
      continue;
    }

    const code = line.slice(0, 2).replace(/\s/g, "");
    if (code.includes("M")) summary.modified += 1;
    else if (code.includes("A")) summary.added += 1;
    else if (code.includes("D")) summary.deleted += 1;
    else if (code.includes("R")) summary.renamed += 1;
    else if (code.includes("C")) summary.copied += 1;
    else summary.other += 1;
  }

  return { lines, summary };
}

function buildSnapshot() {
  const now = new Date();
  const stamp = timestampParts(now);
  const branch = run("git branch --show-current") || "unknown";
  const statusText = run("git status --short");
  const { lines, summary } = summarizeStatus(statusText);
  const note = getFlagValue("--note", "");
  const nextPlan = readNextPlan();

  const content = [
    "# Recovery State",
    "",
    `- Timestamp: ${stamp.iso}`,
    `- Branch: ${branch}`,
    `- Working tree entries: ${lines.length}`,
    `- Modified: ${summary.modified}`,
    `- Added: ${summary.added}`,
    `- Deleted: ${summary.deleted}`,
    `- Renamed: ${summary.renamed}`,
    `- Copied: ${summary.copied}`,
    `- Untracked: ${summary.untracked}`,
    `- Other: ${summary.other}`,
    "",
    "## Operator Note",
    note || "_Fill this in with the current recovery goal or blocker._",
    "",
    "## Suggested Current Focus",
    "- Root cleanup and archive moves",
    "- Proven-unused inventory only after import verification",
    "- Leave preview/internal routes in place until explicitly reclassified",
    "",
    "## Next 45 Minutes Plan",
    nextPlan,
    "",
    "## Git Status",
    lines.length ? "```text" : "_Working tree clean._",
    ...(lines.length ? lines : []),
    ...(lines.length ? ["```"] : []),
    "",
    "## Next Actions",
    "- Update this file with the current objective if the focus shifts.",
    "- Keep snapshots immutable; use the next timestamped file instead of editing prior history.",
    "",
  ].join("\n");

  return {
    stamp,
    content,
  };
}

function writeSnapshot() {
  ensureDir(snapshotsDir);

  const snapshot = buildSnapshot();
  const snapshotPath = path.join(
    snapshotsDir,
    `recovery-state-${snapshot.stamp.fileSafe}.md`,
  );
  const latestPath = path.join(recoveryDir, "latest.md");

  fs.writeFileSync(snapshotPath, snapshot.content, "utf8");
  fs.writeFileSync(latestPath, snapshot.content, "utf8");

  return snapshotPath;
}

async function main() {
  const intervalMinutes = Number.parseInt(getFlagValue("--interval", "45"), 10);
  const watch = hasFlag("--watch");
  const firstPath = writeSnapshot();
  console.log(`WROTE=${path.relative(rootDir, firstPath).replace(/\\/g, "/")}`);

  if (!watch) {
    return;
  }

  console.log(`WATCH_INTERVAL_MINUTES=${intervalMinutes}`);

  await new Promise(() => {
    setInterval(() => {
      const nextPath = writeSnapshot();
      console.log(`WROTE=${path.relative(rootDir, nextPath).replace(/\\/g, "/")}`);
    }, intervalMinutes * 60 * 1000);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
