import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

type CatalogEntry = {
  id?: string;
  slug?: string;
  category_id?: string;
  name?: string;
  images?: string[];
  flagship_image?: string;
};

type SeatingEntry = {
  name: string;
  images?: string[];
  description?: string | null;
};

const REPO_ROOT = process.cwd();
const PUBLIC_ROOT = path.join(REPO_ROOT, "public");

function toFsPath(assetPath: string): string {
  return path.join(PUBLIC_ROOT, assetPath.replace(/^\/+/, "").split("/").join(path.sep));
}

function fileExists(assetPath: string): boolean {
  if (!assetPath.startsWith("/")) return false;
  return fs.existsSync(toFsPath(assetPath));
}

function normalizeImageName(name: string): string {
  return name.replace(/\s+/g, "-").toLowerCase();
}

function candidateNames(baseName: string): string[] {
  const match = baseName.match(/^image-(\d+)$/i);
  if (!match) return [baseName];
  const number = Number.parseInt(match[1], 10);
  if (!Number.isFinite(number)) return [baseName];
  const padded2 = `image-${String(number).padStart(2, "0")}`;
  return [baseName, padded2];
}

function candidateExtensions(ext: string): string[] {
  const normalized = ext.toLowerCase();
  const base = [normalized, ".webp", ".jpg", ".jpeg", ".png"];
  return Array.from(new Set(base));
}

function buildCandidates(assetPath: string): string[] {
  const parsed = path.posix.parse(assetPath);
  const baseVariants = candidateNames(parsed.name);
  const extVariants = candidateExtensions(parsed.ext || "");

  const candidates: string[] = [];
  for (const baseName of baseVariants) {
    for (const ext of extVariants) {
      if (!ext) continue;
      candidates.push(path.posix.join(parsed.dir, `${baseName}${ext}`));
    }
  }
  return Array.from(new Set(candidates));
}

async function copyOrConvert(sourcePath: string, targetPath: string): Promise<void> {
  const sourceFs = toFsPath(sourcePath);
  const targetFs = toFsPath(targetPath);
  const targetDir = path.dirname(targetFs);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const sourceExt = path.extname(sourcePath).toLowerCase();
  const targetExt = path.extname(targetPath).toLowerCase();

  if (sourceExt === targetExt) {
    fs.copyFileSync(sourceFs, targetFs);
    return;
  }

  if (targetExt === ".jpg" || targetExt === ".jpeg") {
    await sharp(sourceFs).jpeg({ quality: 90 }).toFile(targetFs);
    return;
  }

  if (targetExt === ".png") {
    await sharp(sourceFs).png().toFile(targetFs);
    return;
  }

  if (targetExt === ".webp") {
    await sharp(sourceFs).webp({ quality: 90 }).toFile(targetFs);
    return;
  }

  fs.copyFileSync(sourceFs, targetFs);
}

function collectCatalogImages(): string[] {
  const catalogPath = path.join(REPO_ROOT, "data", "site", "localCatalogIndex.json");
  const seatingPath = path.join(REPO_ROOT, "tools", "scripts", "catalog-seating.json");

  const catalogRaw = fs.readFileSync(catalogPath, "utf-8");
  const catalog = JSON.parse(catalogRaw) as CatalogEntry[];

  const seatingRaw = fs.readFileSync(seatingPath, "utf-8");
  const seating = JSON.parse(seatingRaw) as SeatingEntry[];

  const images: string[] = [];

  for (const entry of catalog) {
    const list = Array.isArray(entry.images) ? entry.images : [];
    for (const image of list) {
      if (typeof image === "string") images.push(image);
    }
  }

  for (const entry of seating) {
    const list = Array.isArray(entry.images) ? entry.images : [];
    for (const image of list) {
      if (typeof image === "string") images.push(image);
    }
  }

  return Array.from(new Set(images));
}

async function main(): Promise<void> {
  const images = collectCatalogImages();
  let created = 0;
  let skipped = 0;
  let unresolved = 0;

  for (const imagePath of images) {
    if (fileExists(imagePath)) {
      skipped++;
      continue;
    }

    const candidates = buildCandidates(imagePath);
    const existing = candidates.find((candidate) => candidate !== imagePath && fileExists(candidate));

    if (!existing) {
      unresolved++;
      continue;
    }

    await copyOrConvert(existing, imagePath);
    created++;
  }

  console.log("Catalog image sync complete.");
  console.log(`Created: ${created}`);
  console.log(`Already present: ${skipped}`);
  console.log(`Unresolved: ${unresolved}`);
}

main().catch((error) => {
  console.error("Catalog image sync failed:", error);
  process.exit(1);
});
