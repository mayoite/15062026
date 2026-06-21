/**
 * migrate-chairs-to-catalog.ts
 *
 * Converts images/chairs/ JPG/PNG to high-quality WebP,
 * moves them into images/catalog/oando-seating--{slug}/,
 * and updates Supabase products.images paths.
 *
 * Usage: npx tsx scripts/migrate-chairs-to-catalog.ts [--dry-run]
 */

import fs from "fs";
import path from "path";
import sharp from "sharp";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const DRY_RUN = process.argv.includes("--dry-run");
const CHAIRS_DIR = path.resolve("public/images/chairs");
const CATALOG_DIR = path.resolve("public/images/catalog");
const WEBP_QUALITY = 85;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  if (!fs.existsSync(CHAIRS_DIR)) {
    console.error("❌ public/images/chairs/ not found");
    process.exit(1);
  }

  const slugs = fs.readdirSync(CHAIRS_DIR).filter((f) =>
    fs.statSync(path.join(CHAIRS_DIR, f)).isDirectory()
  );

  console.log(`Found ${slugs.length} chair product folders`);
  if (DRY_RUN) console.log("🏜️  DRY RUN — no files will be written\n");

  const pathMap: Record<string, string> = {}; // old path → new path
  let totalConverted = 0;
  let totalSavedMB = 0;

  for (const slug of slugs) {
    const srcDir = path.join(CHAIRS_DIR, slug);
    const destSlug = `oando-seating--${slug}`;
    const destDir = path.join(CATALOG_DIR, destSlug);

    const files = fs.readdirSync(srcDir).filter((f) =>
      /\.(jpe?g|png)$/i.test(f)
    );

    if (files.length === 0) continue;

    if (!DRY_RUN && !fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Sort files naturally
    files.sort(new Intl.Collator("en", { numeric: true, sensitivity: "base" }).compare);

    for (let i = 0; i < files.length; i++) {
      const srcFile = path.join(srcDir, files[i]);
      const newName = `image-${(i + 1).toString().padStart(2, "0")}.webp`;
      const destFile = path.join(destDir, newName);

      const oldPath = `/images/chairs/${slug}/${files[i]}`;
      const newPath = `/images/catalog/${destSlug}/${newName}`;
      pathMap[oldPath] = newPath;

      if (!DRY_RUN) {
        const srcStat = fs.statSync(srcFile);
        await sharp(srcFile)
          .webp({ quality: WEBP_QUALITY })
          .toFile(destFile);
        const destStat = fs.statSync(destFile);
        totalSavedMB += (srcStat.size - destStat.size) / (1024 * 1024);
      }

      totalConverted++;
    }

    console.log(`  ✓ ${slug} → ${destSlug}/ (${files.length} images)`);
  }

  console.log(`\n📊 Converted: ${totalConverted} images`);
  if (!DRY_RUN) {
    console.log(`💾 Saved: ${totalSavedMB.toFixed(1)} MB`);
  }

  // Update Supabase
  if (!DRY_RUN && supabaseUrl && supabaseKey) {
    console.log("\n🔄 Updating Supabase product image paths...");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: products, error } = await supabase
      .from("products")
      .select("id, images, image_url")
      .or("image_url.like.%/images/chairs/%,images.cs.{/images/chairs/}");

    if (error) {
      // Fallback: fetch all products and filter locally
      console.log("  Using full-table scan fallback...");
      const { data: allProducts, error: err2 } = await supabase
        .from("products")
        .select("id, images, image_url");

      if (err2) {
        console.error("❌ Supabase query failed:", err2.message);
      } else {
        await updateProducts(supabase, allProducts || [], pathMap);
      }
    } else {
      await updateProducts(supabase, products || [], pathMap);
    }
  } else if (DRY_RUN) {
    console.log("\n🔄 Would update Supabase paths (dry run)");
    // Show sample mappings
    const sample = Object.entries(pathMap).slice(0, 5);
    for (const [old, nw] of sample) {
      console.log(`  ${old}\n  → ${nw}`);
    }
    if (Object.keys(pathMap).length > 5) {
      console.log(`  ... and ${Object.keys(pathMap).length - 5} more`);
    }
  }

  // Delete old chairs directory
  if (!DRY_RUN) {
    console.log("\n🗑️  Removing public/images/chairs/...");
    fs.rmSync(CHAIRS_DIR, { recursive: true, force: true });
    console.log("✅ Done! Old chairs/ directory removed.");
  } else {
    console.log("\n🗑️  Would remove public/images/chairs/ (dry run)");
  }
}

async function updateProducts(
  supabase: any,
  products: Array<{ id: string; images: string[] | null; image_url: string | null }>,
  pathMap: Record<string, string>
) {
  let updated = 0;

  for (const product of products) {
    let changed = false;
    let newImageUrl = product.image_url;
    let newImages = product.images ? [...product.images] : null;

    // Update image_url
    if (product.image_url && pathMap[product.image_url]) {
      newImageUrl = pathMap[product.image_url];
      changed = true;
    }

    // Update images array
    if (newImages) {
      for (let i = 0; i < newImages.length; i++) {
        if (pathMap[newImages[i]]) {
          newImages[i] = pathMap[newImages[i]];
          changed = true;
        }
      }
    }

    if (changed) {
      const updatePayload: any = {};
      if (newImageUrl !== product.image_url) updatePayload.image_url = newImageUrl;
      if (newImages) updatePayload.images = newImages;

      const { error } = await supabase
        .from("products")
        .update(updatePayload)
        .eq("id", product.id);

      if (error) {
        console.error(`  ❌ Failed to update ${product.id}: ${error.message}`);
      } else {
        updated++;
      }
    }
  }

  console.log(`  ✅ Updated ${updated} products in Supabase`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
