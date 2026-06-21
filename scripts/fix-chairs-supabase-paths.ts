/**
 * fix-chairs-supabase-paths.ts
 *
 * Updates Supabase products table: replaces /images/chairs/{slug}/ paths
 * with /images/catalog/oando-seating--{slug}/ and .jpg/.png → .webp
 *
 * Usage: npx tsx scripts/fix-chairs-supabase-paths.ts
 */

import fs from "fs";
import path from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

function remapPath(p: string): string | null {
  const match = p.match(/^\/images\/chairs\/([^/]+)\/(.+)\.(jpe?g|png)$/i);
  if (!match) return null;

  const slug = match[1];
  const destSlug = `oando-seating--${slug}`;
  const destDir = path.resolve(`public/images/catalog/${destSlug}`);

  // Find the correct webp filename by matching original name position
  if (!fs.existsSync(destDir)) return null;

  const files = fs.readdirSync(destDir).filter(f => f.endsWith(".webp")).sort();
  // The original files were sorted naturally and converted sequentially
  // We need to find index based on original filename ordering
  // Since we can't reconstruct that here, use the image number from the filename
  const numMatch = match[2].match(/(\d+)/);
  if (!numMatch) return `/images/catalog/${destSlug}/${files[0]}`;

  const num = parseInt(numMatch[1], 10);
  const webpFile = `image-${num.toString().padStart(2, "0")}.webp`;

  if (files.includes(webpFile)) {
    return `/images/catalog/${destSlug}/${webpFile}`;
  }

  // Fallback: just use the index
  return files[0] ? `/images/catalog/${destSlug}/${files[0]}` : null;
}

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Fetching all products...");
  const { data: products, error } = await supabase
    .from("products")
    .select("id, slug, images, flagship_image, scene_images");

  if (error) {
    console.error("❌ Query failed:", error.message);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log("No products found");
    return;
  }

  console.log(`Found ${products.length} products. Checking for /images/chairs/ paths...`);

  let updated = 0;

  for (const product of products) {
    const updates: Record<string, unknown> = {};
    let changed = false;

    // Update flagship_image
    if (product.flagship_image && product.flagship_image.includes("/images/chairs/")) {
      const newPath = remapPath(product.flagship_image);
      if (newPath) {
        updates.flagship_image = newPath;
        changed = true;
      }
    }

    // Update images array
    if (product.images && Array.isArray(product.images)) {
      const newImages = product.images.map((img: string) => {
        if (img.includes("/images/chairs/")) {
          return remapPath(img) || img;
        }
        return img;
      });

      if (JSON.stringify(newImages) !== JSON.stringify(product.images)) {
        updates.images = newImages;
        changed = true;
      }
    }

    // Update scene_images array
    if (product.scene_images && Array.isArray(product.scene_images)) {
      const newSceneImages = product.scene_images.map((img: string) => {
        if (img.includes("/images/chairs/")) {
          return remapPath(img) || img;
        }
        return img;
      });

      if (JSON.stringify(newSceneImages) !== JSON.stringify(product.scene_images)) {
        updates.scene_images = newSceneImages;
        changed = true;
      }
    }

    if (changed) {
      const { error: updateErr } = await supabase
        .from("products")
        .update(updates)
        .eq("id", product.id);

      if (updateErr) {
        console.error(`  ❌ ${product.slug}: ${updateErr.message}`);
      } else {
        console.log(`  ✓ ${product.slug}`);
        updated++;
      }
    }
  }

  console.log(`\n✅ Updated ${updated} products in Supabase`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
