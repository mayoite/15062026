#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const INPUT = path.join(ROOT, "Failures.md");
const INDEX_OUTPUT = path.join(ROOT, "results", "failures-index.csv");
const PENDING_OUTPUT = path.join(ROOT, "results", "pending-failures.csv");

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function cleanField(value) {
  return String(value ?? "").replace(/`/g, "").trim();
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function writeAtomicFile(targetPath, contents) {
  const dir = path.dirname(targetPath);
  const base = path.basename(targetPath);
  const tempPath = path.join(dir, `${base}.${process.pid}.tmp`);

  fs.writeFileSync(tempPath, contents, "utf8");

  let lastError;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      fs.renameSync(tempPath, targetPath);
      return;
    } catch (error) {
      lastError = error;
      const code = error && typeof error === "object" ? error.code : undefined;
      if (attempt === 5 || !["EBUSY", "EPERM", "EACCES"].includes(code)) {
        break;
      }
      sleep(200 * attempt);
    }
  }

  try {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  } catch {
    // Leave cleanup alone if the temp file is also locked.
  }

  throw lastError;
}

function resolutionStateFromStatus(status) {
  const text = String(status ?? "").toLowerCase();
  if (text.includes("resolved")) return "resolved";
  if (text.includes("verified structurally")) return "verified";
  if (text.includes("open")) return "open";
  if (text.includes("partial")) return "partial";
  if (text.includes("blocked")) return "blocked";
  if (text.includes("in progress")) return "in-progress";
  return "unknown";
}

function isPendingState(state) {
  return ["open", "partial", "blocked", "in-progress"].includes(state);
}

const lines = fs.readFileSync(INPUT, "utf8").split(/\r?\n/);
const items = [];
let current = null;
let currentGroup = "";

function startItem(section) {
  current = {
    section,
    status: "",
    files: "",
    summary: "",
    note: "",
    action: "",
  };
}

function flush() {
  if (!current) return;
  const resolutionState = resolutionStateFromStatus(current.status);
  items.push({
    group: currentGroup,
    section: current.section,
    resolution_state: resolutionState,
    pending: isPendingState(resolutionState) ? "yes" : "no",
    status: current.status,
    files: current.files,
    summary: current.summary,
    action: current.action,
    note: current.note,
  });
  current = null;
}

for (const line of lines) {
  const groupHeading = line.match(/^##\s+(.*)$/);
  if (groupHeading) {
    flush();
    currentGroup = cleanField(groupHeading[1]);
    continue;
  }

  const heading = line.match(/^###\s+(.*)$/);
  if (heading) {
    flush();
    startItem(cleanField(heading[1]));
    continue;
  }

  if (/^#{1,6}\s+/.test(line)) {
    flush();
    continue;
  }

  const field = line.match(/^- \*\*(Status|File|Files|Finding|Description|Note|Action):\*\*\s*(.*)$/);
  if (field) {
    const [, label, value] = field;
    if (!current) startItem(currentGroup);
    if (
      current.section === currentGroup &&
      (label === "File" || label === "Files") &&
      current.status &&
      (current.files || current.summary || current.note || current.action)
    ) {
      flush();
      startItem(currentGroup);
    }
    const key =
      label === "Status"
        ? "status"
        : label === "File" || label === "Files"
          ? "files"
          : label === "Finding" || label === "Description"
            ? "summary"
            : label === "Note"
              ? "note"
              : "action";
    const cleaned = cleanField(value);
    current[key] = current[key] ? `${current[key]} ${cleaned}`.trim() : cleaned;
    continue;
  }

  if (!current) continue;

  if (line.startsWith("- ") && current.status) {
    const cleaned = cleanField(line.slice(2));
    current.note = current.note ? `${current.note} ${cleaned}` : cleaned;
  }
}

flush();

items.sort(
  (a, b) =>
    a.resolution_state.localeCompare(b.resolution_state) ||
    a.group.localeCompare(b.group) ||
    a.section.localeCompare(b.section),
);

const indexRows = items.map((item) => ({
  ...item,
  source: "Failures.md",
}));
const pendingRows = indexRows.filter((item) => item.pending === "yes");

fs.mkdirSync(path.dirname(INDEX_OUTPUT), { recursive: true });

const header = "resolution_state,pending,status,group,section,files,summary,action,note,source";
const indexBody = indexRows
  .map((item) =>
    [
      item.resolution_state,
      item.pending,
      cleanField(item.status),
      cleanField(item.group),
      cleanField(item.section),
      cleanField(item.files),
      cleanField(item.summary),
      cleanField(item.action),
      cleanField(item.note),
      item.source,
    ]
      .map(csvEscape)
      .join(","),
  )
  .join("\n");

const pendingBody = pendingRows
  .map((item) =>
    [
      item.resolution_state,
      item.pending,
      cleanField(item.status),
      cleanField(item.group),
      cleanField(item.section),
      cleanField(item.files),
      cleanField(item.summary),
      cleanField(item.action),
      cleanField(item.note),
      item.source,
    ]
      .map(csvEscape)
      .join(","),
  )
  .join("\n");

writeAtomicFile(INDEX_OUTPUT, `${header}\n${indexBody}\n`);
writeAtomicFile(PENDING_OUTPUT, `${header}\n${pendingBody}\n`);

console.log(`Wrote ${indexRows.length} failures to ${INDEX_OUTPUT}`);
console.log(`Wrote ${pendingRows.length} pending items to ${PENDING_OUTPUT}`);
