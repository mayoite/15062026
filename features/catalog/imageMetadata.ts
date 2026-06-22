import fs from "node:fs";
import path from "node:path";
import localCatalogIndex from "@/lib/site-data/localCatalogIndex.json";

type LocalCatalogIndexItem = {
  id: string;
  slug: string;
  category_id: string;
  name: string;
  images?: string[];
  flagship_image?: string;
};

type ProductImageLookup = {
  categoryId?: string | null;
  name: string;
  slug?: string | null;
};

export type ResolvedProductImages = {
  images: string[];
  flagshipImage: string | null;
  source:
    | "catalog-index-slug"
    | "catalog-index-name"
    | "catalog-dir-slug"
    | "catalog-dir-canonical"
    | "explicit-candidate";
  matchedSlug?: string;
};

const PUBLIC_ROOT = path.join(process.cwd(), "public");

const explicitLocalAssetCandidates: Record<string, string[]> = {
  "meeting-tables/Exquisite": ["/images/catalog/oando-tables--exquisite"],
  "meeting-tables/Collaborate": ["/images/products/meeting-table-6pax.webp"],
  "meeting-tables/Conference Video Setup": ["/images/products/meeting table top render.webp"],
  "meeting-tables/Executive Meeting Table": ["/images/products/meeting-table-10pax.webp"],
  "meeting-tables/Compact Meeting Table": ["/images/products/meeting-table-6pax.webp"],
  "oando-tables/Opus": ["/images/catalog/oando-tables--opus-2"],
  "oando-tables/Curvivo": ["/images/catalog/oando-tables--curvivo-meet"],
  "oando-tables/Letz": ["/images/catalog/oando-tables--letz-think"],
  "oando-tables/Sleek": ["/images/catalog/oando-tables--sleek-tab"],
  "oando-storage/Wooden": ["/_unused/product_others/imported/storage/image-14.webp"],
  "oando-storage/Prelam": ["/images/catalog/oando-storage--prelam-storage"],
  "oando-storage/Metal": ["/_unused/product_others/imported/storage/image-73.webp"],
  "oando-storage/Heavy Dut": ["/images/catalog/oando-storage--heavy-duty-racks"],
  "oando-chairs/Myel": ["/images/products/myel-chair-1.webp"],
  "oando-chairs/Sway": ["/images/products/imported/sway/image-1.webp"],
  "oando-chairs/Arvo": ["/images/catalog/oando-seating--arvo"],
  "oando-chairs/Halo": ["/images/products/imported/halo/image-1.webp"],
  "oando-chairs/Fluid X": ["/images/products/fluid-x-chair-1.webp"],
  "oando-soft-seating/Luna": ["/images/catalog/oando-seating--moonlight"],
  "oando-soft-seating/Luxar": ["/images/products/imported/classy"],
  "oando-soft-seating/Cone": ["/images/catalog/oando-soft-seating--cocoon"],
  "oando-soft-seating/Tectara": ["/images/products/imported/workstations-copy"],
  "oando-soft-seating/Twig": ["/images/products/imported/fluid"],
  "oando-other-seating/Sleek Cafe": ["/images/catalog/oando-seating--cafe-sleek"],
  "oando-other-seating/Wing": ["/images/catalog/oando-seating--breeze"],
  "oando-workstations/Trio": ["/images/catalog/oando-workstations--trio-2"],
  "others/Nuvora Pod": ["/images/products/nuvora-pod-1.webp"],
  "others/Nuvora Pod 2": ["/images/products/nuvora-pod-2.webp"],
  "others/Nuvora Pod 3": ["/images/products/nuvora-pod-3.webp"],
  "others/Paper Tray": ["/images/products/dauble paper tray.webp"],
  "cafe/Cafeteria Seating": ["/images/products/chair-cafeteria.webp"],
  "projects/Abdul Hai Office": [
    "/images/projects/project-gallery-01.webp",
    "/images/projects/project-gallery-02.webp",
  ],
  "projects/DMRC Office": ["/images/projects/DMRC/dmrc-facility.webp"],
  "projects/Titan Corporate": ["/images/projects/Titan/27-06-2025 Image 05_edited_edited.webp"],
  "projects/Usha International": ["/images/projects/Usha/DSC_0077_edited.webp"],
};

function toFsPath(relativePath: string): string {
  return path.join(PUBLIC_ROOT, relativePath.replace(/^\/+/, ""));
}

function fileExists(relativePath: string): boolean {
  return relativePath.startsWith("/") && fs.existsSync(toFsPath(relativePath));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCatalogCategoryId(categoryId: string | null | undefined): string | null {
  if (!categoryId) return null;
  switch (categoryId) {
    case "oando-workstations":
      return "workstations";
    case "oando-tables":
    case "meeting-tables":
      return "tables";
    case "oando-storage":
    case "storages":
      return "storage";
    case "oando-soft-seating":
      return "soft-seating";
    case "oando-seating":
    case "oando-other-seating":
      return "seating";
    case "oando-educational":
    case "education":
      return "educational";
    case "oando-collaborative":
      return "collaborative";
    default:
      return categoryId.replace(/^oando-/, "");
  }
}

export function catalogSlugForProduct(
  categoryId: string | null | undefined,
  name: string,
): string | null {
  const normalizedCategoryId = normalizeCatalogCategoryId(categoryId);
  if (!normalizedCategoryId) return null;
  return `oando-${normalizedCategoryId}--${slugify(name)}`;
}

function sortCatalogImages(images: string[]): string[] {
  return images.slice().sort((left, right) =>
    left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" }),
  );
}

function listCatalogImages(relativeDir: string): string[] {
  const dirPath = toFsPath(relativeDir);
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    return [];
  }

  return sortCatalogImages(
    fs
      .readdirSync(dirPath)
      .filter((file) => /^image-\d+\.(jpg|jpeg|png|webp)$/i.test(file))
      .map((file) => path.posix.join(relativeDir.replace(/\/+$/, ""), file)),
  );
}

function resolveExplicitCandidateImages(categoryId: string | null | undefined, name: string): string[] {
  const candidates = explicitLocalAssetCandidates[`${categoryId}/${name}`] ?? [];
  const resolved: string[] = [];

  for (const candidate of candidates) {
    if (/\.(jpg|jpeg|png|webp)$/i.test(candidate)) {
      if (fileExists(candidate)) resolved.push(candidate);
      continue;
    }

    const images = listCatalogImages(candidate);
    resolved.push(...images);
  }

  return sortCatalogImages([...new Set(resolved)]);
}

function resolveFromCatalogIndexBySlug(
  slug: string | null | undefined,
): ResolvedProductImages | null {
  if (!slug) return null;
  const entry = (localCatalogIndex as LocalCatalogIndexItem[]).find((item) => item.slug === slug);
  if (!entry) return null;

  const images = sortCatalogImages((entry.images ?? []).filter((image) => fileExists(image)));
  if (images.length === 0) return null;

  return {
    images,
    flagshipImage: images[0] ?? entry.flagship_image ?? null,
    source: "catalog-index-slug",
    matchedSlug: entry.slug,
  };
}

function resolveFromCatalogIndexByName(
  categoryId: string | null | undefined,
  name: string,
): ResolvedProductImages | null {
  const normalizedCategoryId = normalizeCatalogCategoryId(categoryId);
  if (!normalizedCategoryId) return null;

  const entry = (localCatalogIndex as LocalCatalogIndexItem[]).find(
    (item) =>
      item.category_id === normalizedCategoryId &&
      item.name.localeCompare(name, undefined, { sensitivity: "accent" }) === 0,
  );
  if (!entry) return null;

  const images = sortCatalogImages((entry.images ?? []).filter((image) => fileExists(image)));
  if (images.length === 0) return null;

  return {
    images,
    flagshipImage: images[0] ?? entry.flagship_image ?? null,
    source: "catalog-index-name",
    matchedSlug: entry.slug,
  };
}

function resolveFromCatalogDirectory(slug: string, source: ResolvedProductImages["source"]): ResolvedProductImages | null {
  const images = listCatalogImages(`/images/catalog/${slug}`);
  if (images.length === 0) return null;

  return {
    images,
    flagshipImage: images[0] ?? null,
    source,
    matchedSlug: slug,
  };
}

export function resolveProductImages(lookup: ProductImageLookup): ResolvedProductImages | null {
  const directIndexMatch = resolveFromCatalogIndexBySlug(lookup.slug);
  if (directIndexMatch) return directIndexMatch;

  if (lookup.slug) {
    const directDirMatch = resolveFromCatalogDirectory(lookup.slug, "catalog-dir-slug");
    if (directDirMatch) return directDirMatch;
  }

  const canonicalSlug = catalogSlugForProduct(lookup.categoryId, lookup.name);
  if (canonicalSlug) {
    const canonicalIndexMatch = resolveFromCatalogIndexBySlug(canonicalSlug);
    if (canonicalIndexMatch) return canonicalIndexMatch;

    const canonicalDirMatch = resolveFromCatalogDirectory(canonicalSlug, "catalog-dir-canonical");
    if (canonicalDirMatch) return canonicalDirMatch;
  }

  const nameMatch = resolveFromCatalogIndexByName(lookup.categoryId, lookup.name);
  if (nameMatch) return nameMatch;

  const explicitImages = resolveExplicitCandidateImages(lookup.categoryId, lookup.name);
  if (explicitImages.length > 0) {
    return {
      images: explicitImages,
      flagshipImage: explicitImages[0] ?? null,
      source: "explicit-candidate",
    };
  }

  return null;
}

export function hasLocalAssetSource(categoryId: string | null | undefined, name: string, slug?: string | null): boolean {
  return resolveProductImages({ categoryId, name, slug }) !== null;
}
