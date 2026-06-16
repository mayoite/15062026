# Backend — storage & data

*Where metadata lives vs where bytes live.*

---

## One sentence

**Supabase holds catalog paths; Cloudflare R2 (`oando-asset-cdn`) holds catalog files; Drizzle Postgres holds planner app data — not blobs.**

---

## Three backends

| System | Technology | Stores |
|--------|------------|--------|
| **Catalog metadata** | Supabase Postgres | paths in `catalog_products`, `products`, … |
| **Catalog bytes** | Cloudflare R2 | images, GLBs, theme JSON |
| **Planner app data** | Drizzle + `DATABASE_URL` | plans, teams, audits |

**Drizzle is not used for CDN uploads.**

---

## Supabase (paths only)

- `flagship_image`, `images[]`, `metadata.3d_model` → relative `/images/...`, `/models/...`
- `lib/assetPaths.ts` adds `NEXT_PUBLIC_ASSET_BASE_URL` at runtime

---

## Cloudflare R2

| Setting | Value |
|---------|--------|
| Canonical bucket | **`oando-asset-cdn`** |
| Public delivery | `oando-worker-proxy` + `NEXT_PUBLIC_ASSET_BASE_URL` |

Legacy: **`oando-assets-prod`** — retire after cutover.

---

## Environment (`.env.local`)

```env
CLOUDFLARE_R2_CATALOG_BUCKET=oando-asset-cdn
CLOUDFLARE_R2_BUCKET=oando-asset-cdn
NEXT_PUBLIC_ASSET_BASE_URL=https://oando-worker-proxy.mayoite.workers.dev
```

---

## Related

[`operations.md`](operations.md) · [`site.md`](site.md) · [`planner.md`](planner.md) · [`README.md`](README.md)