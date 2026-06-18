# Site — assets & CDN

*Marketing site (`app/(site)/`): catalog images, PDP 3D viewer, fallbacks.*

---

## One sentence

**Site catalog media loads from R2 via `normalizeAssetPath()`; the PDP 3D viewer loads model-viewer + decoders from same-origin `public/cdn/vendor/`.**

---

## What the site loads

| Asset type | Source at runtime | Local / git |
|------------|-------------------|-------------|
| Product images | R2 (`/images/...`) | `asset-cdn/images/` mirror |
| Product GLB (PDP) | R2 (`/models/...`) | `asset-cdn/models/` mirror |
| Image fallbacks | Same-origin `/images/fallback/` | `public/images/fallback/` |
| model-viewer + Draco + KTX2 | Same-origin `/cdn/vendor/` | `public/cdn/vendor/` |

Site does **not** bundle bulk catalog binaries in the Next deploy.

---

## Path flow (images)

1. Supabase / `localCatalogIndex.json` → path string `/images/catalog/...`
2. `lib/assetPaths.ts` → `normalizeAssetPath()` / `normalizeAssetList()`
3. Production: `NEXT_PUBLIC_ASSET_BASE_URL` + path → worker → **`oando-asset-cdn`**

Used across:

- `app/(site)/products/[category]/[product]/page.tsx`
- `FilterGrid.tsx`, compare, quote-cart
- `features/catalog/adapters.ts`, `lib/catalog/*`

---

## PDP 3D viewer

`ProductViewer.tsx`:

- Loads **`@google/model-viewer`** via `lib/ui/loadModelViewer.ts`
- Decoder dirs from `lib/ui/selfHostedAssetUrls.ts`:
  - `/cdn/vendor/model-viewer@4.3.1/`
  - `/cdn/vendor/draco/1.5.6/`
  - `/cdn/vendor/basis-universal/2021-04-15-ba1c3e4/`
- Falls back to jsDelivr / gstatic only if local probe fails

Product `3d_model` path still goes through `normalizeAssetPath()` → cloud GLB URL.

---

## Dev vs production

| Env | Images / GLB |
|-----|----------------|
| `NEXT_PUBLIC_ASSET_BASE_URL` set | Cloud URLs (like prod) |
| Unset | Relative `/images/...` — needs local `asset-cdn/` or `public/images` |

---

## Commands

Upload and audit commands: [`operations.md`](operations.md).

---

## Related

[`planner.md`](planner.md) · [`backend.md`](backend.md) · [`database.md`](database.md) · [`operations.md`](operations.md) · [`README.md`](README.md)