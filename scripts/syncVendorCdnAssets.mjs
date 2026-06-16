#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = path.join(ROOT, "public");

const VENDOR_DOWNLOADS = [
  {
    url: "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.3.1/dist/model-viewer.min.js",
    dest: "cdn/vendor/model-viewer@4.3.1/model-viewer.min.js",
  },
  {
    url: "https://www.gstatic.com/draco/versioned/decoders/1.5.6/draco_decoder.js",
    dest: "cdn/vendor/draco/1.5.6/draco_decoder.js",
  },
  {
    url: "https://www.gstatic.com/draco/versioned/decoders/1.5.6/draco_decoder.wasm",
    dest: "cdn/vendor/draco/1.5.6/draco_decoder.wasm",
  },
  {
    url: "https://www.gstatic.com/draco/versioned/decoders/1.5.6/draco_wasm_wrapper.js",
    dest: "cdn/vendor/draco/1.5.6/draco_wasm_wrapper.js",
  },
  {
    url: "https://www.gstatic.com/basis-universal/versioned/2021-04-15-ba1c3e4/basis_transcoder.js",
    dest: "cdn/vendor/basis-universal/2021-04-15-ba1c3e4/basis_transcoder.js",
  },
  {
    url: "https://www.gstatic.com/basis-universal/versioned/2021-04-15-ba1c3e4/basis_transcoder.wasm",
    dest: "cdn/vendor/basis-universal/2021-04-15-ba1c3e4/basis_transcoder.wasm",
  },
];

const REQUIRED_LOCAL_PATHS = [
  "cdn/vendor/model-viewer@4.3.1/model-viewer.min.js",
  "cdn/vendor/draco/1.5.6/draco_wasm_wrapper.js",
  "cdn/vendor/basis-universal/2021-04-15-ba1c3e4/basis_transcoder.wasm",
  "tldraw-assets/fonts/IBMPlexSans-Medium.woff2",
  "tldraw-assets/translations/en.json",
  "cdn/lebombo_1k.hdr",
  "cdn/potsdamer_platz_1k.hdr",
];

async function downloadFile(url, destPath) {
  const absoluteDest = path.join(PUBLIC_DIR, destPath);
  const dir = path.dirname(absoluteDest);
  fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(absoluteDest) && fs.statSync(absoluteDest).size > 0) {
    console.log(`skip (exists): ${destPath}`);
    return true;
  }

  const response = await fetch(url);
  if (!response.ok) {
    console.error(`failed: ${url} (${response.status})`);
    return false;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(absoluteDest, buffer);
  console.log(`downloaded: ${destPath}`);
  return true;
}

function verifyRequiredPaths() {
  const missing = REQUIRED_LOCAL_PATHS.filter((relPath) => {
    const absolute = path.join(PUBLIC_DIR, relPath);
    return !fs.existsSync(absolute) || fs.statSync(absolute).size === 0;
  });

  if (missing.length > 0) {
    console.error("missing required local assets:");
    for (const relPath of missing) {
      console.error(`  - public/${relPath}`);
    }
    return false;
  }

  console.log(`verified ${REQUIRED_LOCAL_PATHS.length} required local assets`);
  return true;
}

async function main() {
  console.log("syncing vendor CDN assets into public/...");

  let ok = true;
  for (const item of VENDOR_DOWNLOADS) {
    const success = await downloadFile(item.url, item.dest);
    ok = ok && success;
  }

  ok = verifyRequiredPaths() && ok;

  if (!ok) {
    process.exit(1);
  }

  console.log("vendor CDN sync complete");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});