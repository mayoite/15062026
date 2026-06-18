# Backend — storage & paths

*Where catalog bytes live vs path strings in Supabase. Database topology → [`database.md`](database.md).*

---

## One sentence

**Supabase stores relative paths; R2 (`oando-asset-cdn`) stores catalog bytes; Drizzle on `DATABASE_URL` stores planner rows — not blobs.**

---

## Path flow (catalog)

- DB fields: `flagship_image`, `images[]`, `metadata.3d_model` → `/images/...`, `/models/...`
- Runtime: `lib/assetPaths.ts` → `normalizeAssetPath()` + `NEXT_PUBLIC_ASSET_BASE_URL`
- Delivery: Cloudflare worker → **`oando-asset-cdn`**

---

## Cloudflare R2

| Setting | Value |
|---------|--------|
| Canonical bucket | **`oando-asset-cdn`** |
| Public delivery | `oando-worker-proxy` + `NEXT_PUBLIC_ASSET_BASE_URL` |

Legacy: **`oando-assets-prod`** — retire after cutover.

### R2 vs S3

R2 exposes an **S3-compatible API**. Upload scripts hit `*.r2.cloudflarestorage.com` — not AWS S3. Main tradeoff: no egress fees via Cloudflare CDN.

---

## Environment (assets)

```env
CLOUDFLARE_R2_CATALOG_BUCKET=oando-asset-cdn
CLOUDFLARE_R2_BUCKET=oando-asset-cdn
NEXT_PUBLIC_ASSET_BASE_URL=https://oando-worker-proxy.mayoite.workers.dev
```

DB / Supabase env vars: [`database.md`](database.md).

---

## Layer map (bytes only)

| Layer | Where bytes live |
|-------|------------------|
| Catalog images / GLBs | **R2** (`oando-asset-cdn`) |
| App SDKs (model-viewer, tldraw, HDR) | **`public/cdn/`** (git + deploy) |
| Local upload mirror | **`asset-cdn/`** (gitignored heavy trees) |

Metadata and planner persistence are **not** in R2 — see [`database.md`](database.md).

---

## Catalog upload policy

| Command | When |
|---------|------|
| `npm.cmd run assets:cdn:upload` | **After any catalog image/model change** — full overwrite |
| `npm.cmd run assets:cdn:upload:incremental` | First-time gap-fill only (`--skip-existing`) |

Details and flags: [`operations.md`](operations.md).

---

## Target unbundled stack (reference)

| Need | Pick |
|------|------|
| SQL data | Postgres via **Drizzle** |
| Files | **R2** (`oando-asset-cdn`) |
| Auth | **Clerk** or **Better Auth** |
| Public delivery | Worker + `NEXT_PUBLIC_ASSET_BASE_URL` |

Swap map if leaving Supabase BaaS: [`database.md`](database.md) § troubleshooting.

---

## Related

[`START-HERE.md`](START-HERE.md) · [`database.md`](database.md) · [`operations.md`](operations.md) · [`site.md`](site.md) · [`planner.md`](planner.md) · [`README.md`](README.md)