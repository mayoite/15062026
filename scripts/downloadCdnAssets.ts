import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import {
  buildBasenameIndex,
  copyWebAsset,
  localAssetExists,
  resolveMissingAssetPath,
} from "./lib/cdnAssetResolver";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const CDN_BASE_URL = "https://oando-worker-proxy.mayoite.workers.dev";
const PUBLIC_DIR = path.resolve(process.cwd(), "public");

async function downloadFile(
  url: string,
  destPath: string,
  relPath: string,
  basenameIndex: Map<string, string[]>,
): Promise<boolean> {
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (localAssetExists(relPath)) {
    return true;
  }

  const resolution = resolveMissingAssetPath(relPath, basenameIndex);
  if (resolution.kind === "copy") {
    copyWebAsset(resolution.sourceWebPath, relPath);
    console.log(`✅ Copied local fallback: ${resolution.sourceWebPath} -> ${relPath}`);
    return true;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`⚠️ Failed to download: ${url} (Status: ${res.status})`);
      return false;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
    console.log(`✅ Downloaded: ${url} -> ${path.relative(process.cwd(), destPath)}`);
    return true;
  } catch (err) {
    console.error(`❌ Error downloading ${url}:`, err);
    return false;
  }
}

async function run() {
  console.log("🔍 Scanning for CDN assets to download locally...");
  const assetPaths = new Set<string>();

  // 1. Read from localCatalogIndex.json
  const localIndex = path.resolve(process.cwd(), "lib/site-data/localCatalogIndex.json");
  if (fs.existsSync(localIndex)) {
    try {
      const content = fs.readFileSync(localIndex, "utf8");
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.images && Array.isArray(item.images)) {
            for (const img of item.images) {
              if (typeof img === "string") assetPaths.add(img);
            }
          }
          if (item.flagship_image && typeof item.flagship_image === "string") {
            assetPaths.add(item.flagship_image);
          }
        }
      }
    } catch (e) {
      console.error("Error reading localCatalogIndex.json:", e);
    }
  }

  // 2. Read from catalog-seating.json
  const seatingPath = path.resolve(process.cwd(), "scripts/catalog-seating.json");
  if (fs.existsSync(seatingPath)) {
    try {
      const content = fs.readFileSync(seatingPath, "utf8");
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.images && Array.isArray(item.images)) {
            for (const img of item.images) {
              if (typeof img === "string") assetPaths.add(img);
            }
          }
        }
      }
    } catch (e) {
      console.error("Error reading catalog-seating.json:", e);
    }
  }

  // 3. Read from Supabase DB tables if connected
  if (supabaseUrl && supabaseAnonKey) {
    try {
      console.log(`Connecting to Supabase at ${supabaseUrl}...`);
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Check catalog_products
      const { data: catProdData, error: catProdErr } = await supabase
        .from("catalog_products")
        .select("images, flagship_image, scene_images, metadata");
      
      if (!catProdErr && catProdData) {
        for (const p of catProdData) {
          if (p.images && Array.isArray(p.images)) {
            for (const img of p.images) assetPaths.add(img);
          }
          if (p.flagship_image) assetPaths.add(p.flagship_image);
          if (p.scene_images && Array.isArray(p.scene_images)) {
            for (const img of p.scene_images) assetPaths.add(img);
          }
          if (p.metadata && typeof p.metadata === "object") {
            const m = p.metadata as Record<string, unknown>;
            if (m.threeDModelUrl) assetPaths.add(m.threeDModelUrl as string);
            if (m["3d_model"]) assetPaths.add(m["3d_model"] as string);
          }
        }
      }

      // Check products
      const { data: prodData, error: prodErr } = await supabase
        .from("products")
        .select("images, flagship_image, metadata");

      if (!prodErr && prodData) {
        for (const p of prodData) {
          if (p.images && Array.isArray(p.images)) {
            for (const img of p.images) assetPaths.add(img);
          }
          if (p.flagship_image) assetPaths.add(p.flagship_image);
          if (p.metadata && typeof p.metadata === "object") {
            const m = p.metadata as Record<string, unknown>;
            if (m.threeDModelUrl) assetPaths.add(m.threeDModelUrl as string);
            if (m["3d_model"]) assetPaths.add(m["3d_model"] as string);
          }
        }
      }

      // Check product_images table if exists
      const { data: pImgData, error: pImgErr } = await supabase
        .from("product_images")
        .select("image_url");
      if (!pImgErr && pImgData) {
        for (const pi of pImgData) {
          if (pi.image_url) assetPaths.add(pi.image_url);
        }
      }
    } catch (dbErr) {
      console.warn("Could not query Supabase tables for assets:", dbErr);
    }
  }

  // Filter asset paths: we only care about local paths that are hosted on the CDN (starting with /images/ or /models/ etc.)
  const localRelativePaths = Array.from(assetPaths)
    .map(p => p.trim())
    .filter(p => p.startsWith("/") && !p.startsWith("//"));

  console.log(`Found ${localRelativePaths.length} unique asset paths referenced.`);

  let successCount = 0;
  const basenameIndex = buildBasenameIndex("images");

  for (const relPath of localRelativePaths) {
    const cdnUrl = `${CDN_BASE_URL}${relPath}`;
    const localDest = path.join(PUBLIC_DIR, relPath.replace(/\//g, path.sep));

    const success = await downloadFile(cdnUrl, localDest, relPath, basenameIndex);
    if (success) {
      successCount++;
    }
  }

  console.log(`Finished downloading CDN assets locally. Success: ${successCount}/${localRelativePaths.length}`);
}

run().catch(console.error);
