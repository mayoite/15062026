/**
 * scrapeAfcChairs.ts
 *
 * Full scraper for afcindia.in seating products.
 * - Scrapes categories sequentially: mesh, leather, training, cafe
 * - Extracts all images (targeting min 7), dimensions, descriptions, brochures, 3D refs
 * - Splits "with headrest" and "without headrest" into separate catalog items
 * - Downloads all image and PDF assets locally to public/images/afc/ and public/docs/afc/
 * - Outputs a catalog JSON at scripts/catalog-seating-afc.json
 *
 * Usage:
 *   npx tsx scripts/scrapeAfcChairs.ts
 */

import { chromium, type Page, type Browser } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

// ─── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = "https://www.afcindia.in";
const CATEGORIES = [
  { slug: "mesh-chair", label: "Mesh Chair" },
  { slug: "leather-chair", label: "Leather Chair" },
  { slug: "training-chair", label: "Training Chair" },
  { slug: "cafe-chair", label: "Cafe Chair" },
];

const OUTPUT_DIR = path.resolve(__dirname, "..");
const IMAGE_DIR = path.join(OUTPUT_DIR, "public", "images", "chairs");
const DOCS_DIR = path.join(OUTPUT_DIR, "public", "docs", "chairs");
const CATALOG_OUT = path.join(__dirname, "catalog-seating.json");

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ScrapedProduct {
  name: string;
  slug: string;
  category: string;
  categoryLabel: string;
  description: string;
  features: string[];
  dimensions: Record<string, string>;
  images: string[];          // local paths after download
  imageSourceUrls: string[]; // original CDN URLs
  brochures: { label: string; localPath: string; sourceUrl: string }[];
  certifications: { label: string; localPath: string; sourceUrl: string }[];
  hasHeadrest: boolean;
  headrestVariant: "with-headrest" | "without-headrest" | "none";
  galleryTitles: string[];
  h3Sections: string[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destPath)) {
      resolve();
      return;
    }
    ensureDir(path.dirname(destPath));
    const mod = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(destPath);
    mod.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (response) => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirect = response.headers.location;
        if (redirect) {
          file.close();
          fs.unlinkSync(destPath);
          downloadFile(redirect, destPath).then(resolve).catch(reject);
          return;
        }
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }
      response.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    }).on("error", (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

function fileExtFromUrl(url: string): string {
  const u = new URL(url);
  const pathname = decodeURIComponent(u.pathname);
  const ext = path.extname(pathname);
  return ext || ".jpg";
}

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Scrape a single product page ──────────────────────────────────────────────
async function scrapeProductPage(
  page: Page,
  productSlug: string,
  category: { slug: string; label: string }
): Promise<ScrapedProduct[]> {
  const url = `${BASE_URL}/products/${productSlug}`;
  console.log(`    📄 Scraping ${url}`);

  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await delay(500);

  // ── Name ──────────────────────────────────────────────────────────────────
  const productName = await page.$eval("h1", (e) => e.textContent?.trim() || "").catch(() => productSlug);

  // ── Description (first meaningful paragraph) ──────────────────────────────
  const paragraphs = await page.$$eval("p", (elems) =>
    elems.map((e) => e.textContent?.trim() || "").filter(Boolean)
  );
  const description = paragraphs.find((p) => p.length > 40) || paragraphs[0] || "";

  // ── Features (shorter paragraphs that describe product USPs) ──────────────
  const features = paragraphs
    .filter((p) => p.length > 20 && p.length < 300 && p !== description)
    .slice(0, 8);

  // ── All images ────────────────────────────────────────────────────────────
  const allImages = await page.$$eval("img", (imgs) =>
    imgs
      .map((i) => i.getAttribute("src") || "")
      .filter((s) => s.startsWith("https://cdn.prod.website-files.com"))
  );
  // Deduplicate
  const uniqueImages = [...new Set(allImages)];
  // Filter out site-wide logos and icons (keep product-specific images)
  const productImages = uniqueImages.filter((src) => {
    const decoded = decodeURIComponent(src).toLowerCase();
    return (
      !decoded.includes("afc_logo") &&
      !decoded.includes("afc-logo") &&
      !decoded.includes("logo-for") &&
      !decoded.includes("favicon") &&
      !decoded.endsWith(".svg") &&
      !decoded.includes("icon") &&
      !decoded.includes("social") &&
      !decoded.includes("arrow") &&
      !decoded.includes("placeholder")
    );
  });

  // ── Dimensions ────────────────────────────────────────────────────────────
  const dimensionTexts = await page.$$eval("p, span", (elems) =>
    elems
      .map((e) => e.textContent?.trim() || "")
      .filter((t) => t.includes("mm") && t.length < 200 && t.includes(":"))
  );
  const dimensions: Record<string, string> = {};
  for (const text of [...new Set(dimensionTexts)]) {
    const match = text.match(/^(.+?):\s*(.+mm.*)$/);
    if (match) {
      dimensions[match[1].trim()] = match[2].trim();
    }
  }

  // ── Downloads (brochures, certifications) ─────────────────────────────────
  const downloads = await page.$$eval("a", (anchors) =>
    anchors
      .filter((a) => {
        const href = a.getAttribute("href") || "";
        return href.endsWith(".pdf");
      })
      .map((a) => ({
        text: a.textContent?.trim() || "",
        href: a.getAttribute("href") || "",
      }))
  );

  const brochures: ScrapedProduct["brochures"] = [];
  const certifications: ScrapedProduct["certifications"] = [];
  for (const dl of downloads) {
    const label = dl.text || path.basename(decodeURIComponent(new URL(dl.href).pathname), ".pdf");
    if (
      dl.text.toLowerCase().includes("certification") ||
      dl.text.toLowerCase().includes("greenpro") ||
      dl.text.toLowerCase().includes("bifma")
    ) {
      certifications.push({ label, localPath: "", sourceUrl: dl.href });
    } else {
      brochures.push({ label, localPath: "", sourceUrl: dl.href });
    }
  }

  // ── H3 sections (for 3D model variant names like "Myel HB") ──────────────
  const h3Sections = await page.$$eval("h3", (elems) =>
    elems.map((e) => e.textContent?.trim() || "")
  );

  // ── Headrest detection ────────────────────────────────────────────────────
  // Check body text for explicit headrest mentions
  const bodyText = await page.evaluate(() => document.body.innerText);
  const bodyHasHeadrest = /headrest|high\s*back/i.test(bodyText);
  const bodyHasWithout = /without\s*headrest|medium\s*back/i.test(bodyText);

  // Also check H3 sections for "ProductName HB" or "ProductName MB" patterns
  // These indicate the 3D model section has variant-specific entries
  const h3HasHB = h3Sections.some((h) => /\bHB\b/i.test(h));
  const h3HasMB = h3Sections.some((h) => /\bMB\b/i.test(h));

  // A product should be split if we detect BOTH a high-back indicator AND
  // a medium-back/without-headrest indicator from any source
  const hasHeadrestMention = bodyHasHeadrest || h3HasHB;
  const hasWithoutHeadrestDimension = bodyHasWithout || h3HasMB;

  // If only HB is found (no MB), still split — it implies a non-HB variant exists
  const shouldSplit = (hasHeadrestMention && hasWithoutHeadrestDimension) ||
    (h3HasHB && !h3HasMB) || // "Sway HB" found but no MB → still has a base variant
    (h3HasMB && !h3HasHB);   // "Fluid MB" found but no HB → still has an HB variant

  // ── Gallery titles ────────────────────────────────────────────────────────
  const galleryTitles = await page.$$eval(
    ".image-gallery-title",
    (elems) => elems.map((e) => e.textContent?.trim() || "")
  );

  // ── Build product(s) ─────────────────────────────────────────────────────
  // If the page mentions both "with headrest" and "without headrest" dimensions,
  // split into two separate catalog items.
  const baseProduct: Omit<ScrapedProduct, "hasHeadrest" | "headrestVariant" | "name" | "slug" | "images" | "imageSourceUrls"> = {
    category: category.slug,
    categoryLabel: category.label,
    description,
    features,
    dimensions,
    brochures: [], // Completely omitted as per requirements
    certifications: [], // Completely omitted as per requirements
    galleryTitles,
    h3Sections,
  };

  const results: ScrapedProduct[] = [];

  if (shouldSplit) {
    // Split into two items
    console.log(`      🔀 Splitting "${productName}" into with/without headrest variants`);

    results.push({
      ...baseProduct,
      name: `${productName} (With Headrest)`,
      slug: `${productSlug}-with-headrest`,
      hasHeadrest: true,
      headrestVariant: "with-headrest",
      images: [],
      imageSourceUrls: [...productImages],
    });

    results.push({
      ...baseProduct,
      name: `${productName} (Without Headrest)`,
      slug: `${productSlug}-without-headrest`,
      hasHeadrest: false,
      headrestVariant: "without-headrest",
      images: [],
      imageSourceUrls: [...productImages],
    });
  } else {
    results.push({
      ...baseProduct,
      name: productName,
      slug: productSlug,
      hasHeadrest: hasHeadrestMention,
      headrestVariant: "none",
      images: [],
      imageSourceUrls: [...productImages],
    });
  }

  return results;
}

// ─── Scrape a category page to get product slugs ───────────────────────────────
async function getCategoryProducts(page: Page, categorySlug: string): Promise<string[]> {
  const url = `${BASE_URL}/sub-categories/${categorySlug}`;
  console.log(`  📂 Fetching category: ${url}`);
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

  const links = await page.$$eval("a", (anchors) =>
    anchors.map((a) => a.getAttribute("href") || "")
  );
  const productLinks = [...new Set(links.filter((l) => l.startsWith("/products/")))];
  return productLinks.map((l) => l.replace("/products/", ""));
}

// ─── Download all assets for a product ─────────────────────────────────────────
async function downloadProductAssets(product: ScrapedProduct): Promise<void> {
  const baseSlug = product.slug
    .replace(/-with-headrest$/, "")
    .replace(/-without-headrest$/, "");
  const productDir = path.join(IMAGE_DIR, baseSlug);
  
  if (fs.existsSync(productDir)) {
    // If directory exists, it means the user has curated it. 
    // Do NOT download any files to prevent overwriting or re-adding deleted junk.
    // Just read what's there and populate the catalog images array.
    const files = fs.readdirSync(productDir);
    const validImages = files.filter(f => !f.toLowerCase().endsWith(".svg"));
    // Sort naturally so image-01 comes before image-02
    validImages.sort(new Intl.Collator('en', { numeric: true, sensitivity: 'base' }).compare);
    product.images = validImages.map(f => `/images/chairs/${baseSlug}/${f}`);
    return;
  }

  ensureDir(productDir);

  // Download images
  for (let i = 0; i < product.imageSourceUrls.length; i++) {
    const srcUrl = product.imageSourceUrls[i];
    const ext = fileExtFromUrl(srcUrl);
    const filename = `image-${(i + 1).toString().padStart(2, "0")}${ext}`;
    const destPath = path.join(productDir, filename);
    const localPath = `/images/chairs/${baseSlug}/${filename}`;

    try {
      await downloadFile(srcUrl, destPath);
      if (!product.images.includes(localPath)) {
        product.images.push(localPath);
      }
    } catch (err: unknown) {
      console.warn(`      ⚠️ Failed to download image: ${srcUrl} — ${(err as any).message}`);
    }
  }

  // We do not download brochures/certifications locally.
  // Instead, set their localPath reference to the remote URL directly.
  for (const brochure of product.brochures) {
    brochure.localPath = brochure.sourceUrl;
  }

  for (const cert of product.certifications) {
    cert.localPath = cert.sourceUrl;
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 AFC India Chair Scraper");
  console.log("═".repeat(60));

  ensureDir(IMAGE_DIR);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const allProducts: ScrapedProduct[] = [];

  for (const category of CATEGORIES) {
    console.log(`\n📁 Category: ${category.label} (${category.slug})`);
    console.log("─".repeat(50));

    const productSlugs = await getCategoryProducts(page, category.slug);
    console.log(`  Found ${productSlugs.length} products`);

    for (const slug of productSlugs) {
      try {
        const products = await scrapeProductPage(page, slug, category);
        allProducts.push(...products);
        console.log(
          `      ✅ ${products.map((p) => p.name).join(", ")} — ${products[0].imageSourceUrls.length} images, ${Object.keys(products[0].dimensions).length} dims`
        );
      } catch (err: unknown) {
        console.error(`      ❌ Failed to scrape ${slug}: ${(err as any).message}`);
      }

      // Polite delay between requests
      await delay(300);
    }
  }

  await browser.close();

  console.log(`\n${"═".repeat(60)}`);
  console.log(`📦 Total scraped items: ${allProducts.length}`);
  console.log(`\n⬇️  Downloading assets...`);

  // Download all assets
  let downloaded = 0;
  for (const product of allProducts) {
    try {
      await downloadProductAssets(product);
      downloaded++;
      process.stdout.write(`\r  Downloaded ${downloaded}/${allProducts.length}: ${product.name.padEnd(40)}`);
    } catch (err: unknown) {
      console.error(`\n  ❌ Asset download failed for ${product.name}: ${(err as any).message}`);
    }
  }

  console.log(`\n\n✅ Asset download complete.`);

  // Write catalog JSON
  const catalogOutput = allProducts.map((p) => ({
    name: p.name,
    slug: p.slug,
    category: p.category,
    categoryLabel: p.categoryLabel,
    description: p.description,
    features: p.features,
    dimensions: p.dimensions,
    images: p.images,
    hasHeadrest: p.hasHeadrest,
    headrestVariant: p.headrestVariant,
  }));

  fs.writeFileSync(CATALOG_OUT, JSON.stringify(catalogOutput, null, 2));
  console.log(`\n📝 Catalog written to ${CATALOG_OUT}`);

  // Summary
  console.log(`\n${"═".repeat(60)}`);
  console.log("📊 Summary:");
  for (const cat of CATEGORIES) {
    const items = allProducts.filter((p) => p.category === cat.slug);
    const totalImages = items.reduce((s, p) => s + p.images.length, 0);
    console.log(`  ${cat.label}: ${items.length} items, ${totalImages} images`);
  }
  const splits = allProducts.filter((p) => p.headrestVariant !== "none");
  if (splits.length > 0) {
    console.log(`  Headrest splits: ${splits.length} items (${splits.length / 2} products split)`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
