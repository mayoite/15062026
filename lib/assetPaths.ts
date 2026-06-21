// Client-safe asset path utilities
// Note: File system checks are only available server-side

import type fsType from "node:fs";
import type pathType from "node:path";

const configuredAssetBaseUrl = (
  process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
  process.env.ASSET_BASE_URL ||
  ""
)
  .trim()
  .replace(/\/+$/, "");

function hasAbsoluteUrl(value: string): boolean {
  return /^(?:https?:)?\/\//i.test(value) || /^[a-z][a-z0-9+.-]*:/i.test(value);
}

function applyAssetBase(value: string): string {
  if (!configuredAssetBaseUrl) return value;
  if (!value.startsWith("/")) return value;
  return `${configuredAssetBaseUrl}${value}`;
}

function isServer(): boolean {
  return typeof window === "undefined";
}

// Lazy-loaded Node.js modules (server-only)
let _fs: typeof fsType | null = null;
let _path: typeof pathType | null = null;

function getFs(): typeof fsType | null {
  if (!isServer()) return null;
  if (!_fs) {
    try {
      _fs = __non_webpack_require__("node:fs");
    } catch {
      return null;
    }
  }
  return _fs;
}

function getPath(): typeof pathType | null {
  if (!isServer()) return null;
  if (!_path) {
    try {
      _path = __non_webpack_require__("node:path");
    } catch {
      return null;
    }
  }
  return _path;
}

// Declare __non_webpack_require__ for TypeScript
declare const __non_webpack_require__: NodeRequire;

function toPublicFsPath(assetPath: string): string | null {
  const pathMod = getPath();
  if (!pathMod) return null;
  const normalized = assetPath.replace(/^\/+/, "").split("/").join(pathMod.sep);
  return pathMod.join(process.cwd(), "public", normalized);
}

function localAssetExists(assetPath: string): boolean {
  if (!isServer()) return false;
  if (!assetPath.startsWith("/")) return false;

  const fsMod = getFs();
  if (!fsMod) return false;

  try {
    const fsPath = toPublicFsPath(assetPath);
    return fsPath ? fsMod.existsSync(fsPath) : false;
  } catch {
    return false;
  }
}

function resolveLocalImageVariant(assetPath: string): string {
  if (!isServer()) return assetPath;

  if (localAssetExists(assetPath)) return assetPath;

  if (assetPath.toLowerCase().endsWith(".webp")) {
    const jpgCandidate = assetPath.replace(/\.webp$/i, ".jpg");
    if (localAssetExists(jpgCandidate)) return jpgCandidate;
    const jpegCandidate = assetPath.replace(/\.webp$/i, ".jpeg");
    if (localAssetExists(jpegCandidate)) return jpegCandidate;
    const pngCandidate = assetPath.replace(/\.webp$/i, ".png");
    if (localAssetExists(pngCandidate)) return pngCandidate;
  }

  return "/images/fallback/category.svg";
}

export function normalizeAssetPath(assetPath: string | null | undefined): string {
  if (!assetPath) return "";
  const normalized = String(assetPath).trim();
  if (!normalized) return "";
  if (hasAbsoluteUrl(normalized)) return normalized;
  const hasImageExtension = /\.(webp|png|jpe?g|gif|avif|svg)$/i.test(normalized);
  let candidatePath = normalized;
  let candidateLower = candidatePath.toLowerCase();

  // Legacy catalog exports referenced `/images/afc/*`; assets now live under `/images/catalog/*`.
  if (candidateLower.startsWith("/images/afc/")) {
    candidatePath = `/images/catalog/${candidatePath.slice("/images/afc/".length)}`;
    candidateLower = candidatePath.toLowerCase();
  }

  // Legacy homepage content used `/products/*.webp` while static files are under `/images/products/*`.
  if (hasImageExtension && candidateLower.startsWith("/products/")) {
    candidatePath = `/images/products/${candidatePath.slice("/products/".length)}`;
    candidateLower = candidatePath.toLowerCase();
  }

  // Canonicalize the legacy placeholder path on both server and client.
  if (candidateLower === "/images/fallback/category.webp") {
    return applyAssetBase("/images/fallback/category.svg");
  }

  // Phoenix seating assets are currently repo-backed as JPG files only.
  if (
    candidateLower.startsWith("/images/catalog/oando-seating--phoenix/image-") &&
    candidateLower.endsWith(".webp")
  ) {
    const match = candidateLower.match(/image-(\d+)\.webp$/);
    const imageIndex = match ? Number.parseInt(match[1], 10) : Number.NaN;
    if (Number.isNaN(imageIndex) || imageIndex < 1 || imageIndex > 3) return "/images/fallback/category.svg";
    return applyAssetBase(`/images/catalog/oando-seating--phoenix/image-${imageIndex}.jpg`);
  }

  // Resolve to an existing local variant when possible.
  if (candidatePath.startsWith("/images/") && hasImageExtension) {
    const resolvedVariant = resolveLocalImageVariant(candidatePath);
    if (!resolvedVariant) return applyAssetBase("/images/fallback/category.svg");
    return applyAssetBase(resolvedVariant);
  }

  return applyAssetBase(candidatePath);
}

export function normalizeAssetList(
  values: Array<string | null | undefined> | null | undefined,
): string[] {
  if (!Array.isArray(values)) return ["/images/fallback/category.svg"];
  const resolved = values
    .map((value) => normalizeAssetPath(value))
    .filter(Boolean) as string[];
  return resolved.length > 0 ? resolved : ["/images/fallback/category.svg"];
}
