import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const transcripts = [
  path.join(
    process.env.USERPROFILE ?? "",
    ".cursor/projects/e-Goodsites-oando-consolidated/agent-transcripts/6f310ff3-2df5-46e6-873a-e0ee2bd9b497/6f310ff3-2df5-46e6-873a-e0ee2bd9b497.jsonl",
  ),
  path.join(
    process.env.USERPROFILE ?? "",
    ".cursor/projects/e-Goodsites-oando-consolidated/agent-transcripts/c2280be3-c41f-4843-ab32-d3a17f11d6f9/c2280be3-c41f-4843-ab32-d3a17f11d6f9.jsonl",
  ),
];

const files = new Map();

for (const transcript of transcripts) {
  if (!fs.existsSync(transcript)) {
    console.warn("skip missing", transcript);
    continue;
  }

  for (const line of fs.readFileSync(transcript, "utf8").split("\n")) {
    if (!line.includes('"Write"')) continue;

    try {
      const event = JSON.parse(line);
      for (const block of event.message?.content ?? []) {
        if (block.name !== "Write") continue;

        const rawPath = String(block.input?.path ?? "").replace(/\\/g, "/");
        const contents = block.input?.contents;
        const match = rawPath.match(/oando-consolidated\/(.+)$/i);
        if (match && contents != null) {
          files.set(match[1], contents);
        }
      }
    } catch {
      // skip malformed lines
    }
  }
}

console.log(`Recovered ${files.size} file(s) from transcript(s)`);

for (const [rel, contents] of files) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, contents);
  console.log("  +", rel);
}
