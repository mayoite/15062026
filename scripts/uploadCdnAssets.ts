import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import {
  contentTypeForKey,
  createR2CatalogClient,
  resolveCatalogBucketName,
} from "./lib/r2Catalog";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const ROOT = process.cwd();
const ASSET_CDN_DIR = path.join(ROOT, "asset-cdn");
const PUBLIC_DIR = path.join(ROOT, "public");

// Catalog bytes only — SDKs live in public/cdn + public/tldraw-assets (deployed with Next).
const UPLOAD_ROOTS = ["images", "models"] as const;

type UploadRoot = (typeof UPLOAD_ROOTS)[number];

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function readLimit(): number | null {
  const arg = process.argv.find((item) => item.startsWith("--limit="));
  if (!arg) return null;
  const value = Number.parseInt(arg.slice("--limit=".length), 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function readOnlyRoot(): UploadRoot | null {
  const arg = process.argv.find((item) => item.startsWith("--only="));
  if (!arg) return null;
  const value = arg.slice("--only=".length).trim() as UploadRoot;
  return UPLOAD_ROOTS.includes(value) ? value : null;
}

function resolveSourceDir(root: UploadRoot): { absDir: string; label: string } | null {
  const assetCdnAbs = path.join(ASSET_CDN_DIR, root);
  if (fs.existsSync(assetCdnAbs)) {
    return { absDir: assetCdnAbs, label: `asset-cdn/${root}` };
  }

  const publicAbs = path.join(PUBLIC_DIR, root);
  if (fs.existsSync(publicAbs)) {
    return { absDir: publicAbs, label: `public/${root} (migrate to asset-cdn/${root})` };
  }

  return null;
}

function walkFiles(absDir: string, relPrefix: string): string[] {
  const files: string[] = [];

  function walk(currentAbs: string, currentRel: string) {
    for (const entry of fs.readdirSync(currentAbs, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const entryAbs = path.join(currentAbs, entry.name);
      const entryRel = path.posix.join(currentRel, entry.name);
      if (entry.isDirectory()) {
        walk(entryAbs, entryRel);
        continue;
      }
      if (entry.isFile() && (entry as any).size > 0) {
        files.push(path.posix.join(relPrefix, entryRel).replace(/^\/+/, ""));
      }
    }
  }

  walk(absDir, "");
  return files.sort();
}

async function objectExists(
  client: ReturnType<typeof createR2CatalogClient>,
  bucket: string,
  key: string,
): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadFile(
  client: ReturnType<typeof createR2CatalogClient>,
  bucket: string,
  key: string,
  absPath: string,
  dryRun: boolean,
  skipExisting: boolean,
): Promise<"uploaded" | "skipped" | "dry-run"> {
  if (dryRun) {
    console.log(`[dry-run] ${key}`);
    return "dry-run";
  }

  if (skipExisting && (await objectExists(client, bucket, key))) {
    return "skipped";
  }

  const body = fs.readFileSync(absPath);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentTypeForKey(key),
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  console.log(`uploaded: ${key}`);
  return "uploaded";
}

async function run() {
  const dryRun = hasFlag("--dry-run");
  // Policy: catalog updates must full-upload (overwrite). Use --skip-existing only for gap-fill.
  const skipExisting = hasFlag("--skip-existing");
  const limit = readLimit();
  const onlyRoot = readOnlyRoot();
  const bucket = resolveCatalogBucketName();
  const client = dryRun ? null : createR2CatalogClient();

  const roots = onlyRoot ? [onlyRoot] : [...UPLOAD_ROOTS];
  const keysToUpload: Array<{ key: string; absPath: string; sourceLabel: string }> = [];

  for (const root of roots) {
    const source = resolveSourceDir(root);
    if (!source) {
      console.warn(`skip: no local files for ${root}`);
      continue;
    }

    const relKeys = walkFiles(source.absDir, root);
    console.log(`scan ${source.label}: ${relKeys.length} files`);

    for (const key of relKeys) {
      keysToUpload.push({
        key,
        absPath: path.join(source.absDir, key.slice(`${root}/`.length).replace(/\//g, path.sep)),
        sourceLabel: source.label,
      });
    }
  }

  if (keysToUpload.length === 0) {
    console.error("No upload files found under asset-cdn/ or public/.");
    process.exit(1);
  }

  const selected = limit ? keysToUpload.slice(0, limit) : keysToUpload;
  console.log(
    `${dryRun ? "Dry run" : "Uploading"} ${selected.length}/${keysToUpload.length} objects → r2://${bucket}/`,
  );
  if (!dryRun && skipExisting) {
    console.log("Incremental mode: skipping keys that already exist in R2.");
  } else if (!dryRun) {
    console.log("Full upload: overwriting every local key in R2.");
  }

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const [index, item] of selected.entries()) {
    try {
      const result = await uploadFile(
        client!,
        bucket,
        item.key,
        item.absPath,
        dryRun,
        skipExisting,
      );
      if (result === "uploaded" || result === "dry-run") uploaded += 1;
      if (result === "skipped") skipped += 1;
      if ((index + 1) % 100 === 0) {
        console.log(`progress: ${index + 1}/${selected.length} (uploaded=${uploaded} skipped=${skipped} failed=${failed})`);
      }
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`failed: ${item.key} (${message})`);
    }
  }

  console.log(`Done. uploaded=${uploaded} skipped=${skipped} failed=${failed} bucket=${bucket}`);
  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});