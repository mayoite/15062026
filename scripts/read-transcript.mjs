import fs from "node:fs";

const f = "C:\\Users\\ayush\\.claude\\projects\\E--combine-sites-claude0206--claude-worktrees-exciting-meninsky-a3af35\\5bada4cb-53b7-4eb0-bf28-bc69b9db9bd4.jsonl";
const n = Number(process.argv[2] ?? 59);

const lines = fs.readFileSync(f, "utf8").split(/\r?\n/).filter(Boolean);
for (const l of lines.slice(-n)) {
  let o;
  try { o = JSON.parse(l); } catch { continue; }
  const m = o.message;
  if (!m || !m.role) continue;
  const c = m.content;
  if (Array.isArray(c)) {
    for (const p of c) {
      if (p.type === "text") console.log(`[${m.role}] ${p.text.slice(0, 600)}`);
      else if (p.type === "tool_use") console.log(`[${m.role}:tool] ${p.name}`);
    }
  } else if (typeof c === "string") {
    console.log(`[${m.role}] ${c.slice(0, 600)}`);
  }
}
