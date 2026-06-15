import fs from "fs";
import path from "path";

const root = process.cwd();
const ignore = new Set(["node_modules", ".git", ".next", "public", "dist"]);

const patterns = [
  /sb_secret_[A-Za-z0-9_-]{10,}/i,
  /sb_publishable_[A-Za-z0-9_-]{10,}/i,
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*/i,
  /SUPABASE_ADMIN_SERVICE_ROLE_KEY\s*=\s*/i,
  /NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*/i,
  /postgresql:\/\/[\w@:\-\.\/%\$\+\=]+/i,
  /CLOUDFLARE_API_TOKEN\s*=\s*/i,
  /OPENAI_API_KEY\s*=\s*/i,
];

function walk(dir) {
  const results = [];
  for (const name of fs.readdirSync(dir)) {
    if (ignore.has(name)) continue;
    const full = path.join(dir, name);
    try {
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        results.push(...walk(full));
      } else if (stat.isFile()) {
        results.push(full);
      }
    } catch (e) {
      // ignore
    }
  }
  return results;
}

function scan() {
  const files = walk(root);
  const hits = [];
  for (const file of files) {
    // only scan text files
    if (file.includes(".png") || file.includes(".jpg") || file.includes(".jpeg") || file.includes(".gif") || file.includes(".d.ts")) continue;
    let content;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch (e) {
      continue;
    }
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const p of patterns) {
        if (p.test(line)) {
          hits.push({ file, line: i + 1, text: line.trim() });
        }
      }
    }
  }

  if (hits.length === 0) {
    console.log("No likely secrets found.");
    return 0;
  }

  console.error(`Found ${hits.length} potential secret(s):`);
  for (const h of hits) {
    console.error(`${h.file}:${h.line}: ${h.text}`);
  }
  console.error("Please remove secrets from the repository and add them to local .env files.");
  return 1;
}

process.exitCode = scan();
