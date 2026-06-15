import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const recoveryDir = path.join(rootDir, ".codex-recovery");
const handoverDir = path.join(recoveryDir, "handover");
const args = process.argv.slice(2);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readFileIfExists(filePath, fallback = "") {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return fs.readFileSync(filePath, "utf8").trim();
}

function getFlagValue(prefix, fallback = "") {
  const match = args.find((arg) => arg.startsWith(`${prefix}=`));
  return match ? match.slice(prefix.length + 1) : fallback;
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
  };
}

function section(title, body) {
  return [`## ${title}`, body || "_No data available._", ""].join("\n");
}

function main() {
  ensureDir(handoverDir);

  const stamp = timestampParts();
  const note = getFlagValue("--note", "").trim();

  const prompt = readFileIfExists(
    path.join(recoveryDir, "NEXT-CHAT-PROMPT.txt"),
    "_Missing NEXT-CHAT-PROMPT.txt_",
  );
  const latestRecovery = readFileIfExists(
    path.join(recoveryDir, "latest.md"),
    "_Missing latest.md_",
  );
  const nextPlan = readFileIfExists(
    path.join(recoveryDir, "NEXT-PLAN.md"),
    "_Missing NEXT-PLAN.md_",
  );
  const latestChat = readFileIfExists(
    path.join(recoveryDir, "chat-snapshots", "latest-chat.md"),
    "_No chat snapshot yet._",
  );

  const content = [
    "# Recovery Handover",
    "",
    `- Timestamp: ${stamp.iso}`,
    note ? `- Note: ${note}` : null,
    "",
    section("Next Chat Prompt", ["```text", prompt, "```"].join("\n")),
    section("Next 45 Minutes Plan", nextPlan),
    section("Latest Recovery State", latestRecovery),
    section("Latest Chat Snapshot", latestChat),
  ]
    .filter(Boolean)
    .join("\n");

  const handoverPath = path.join(
    handoverDir,
    `handover-${stamp.fileSafe}.md`,
  );
  const latestPath = path.join(handoverDir, "latest-handover.md");

  fs.writeFileSync(handoverPath, content, "utf8");
  fs.writeFileSync(latestPath, content, "utf8");

  console.log(`WROTE=${path.relative(rootDir, handoverPath).replace(/\\/g, "/")}`);
}

main();
