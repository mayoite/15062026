# Asset & CDN workflow

*One folder for catalog media: local layout, cloud upload, site, planner, backend.*

---

## One sentence

**Supabase stores paths, `oando-asset-cdn` (R2) stores catalog bytes, Next serves small SDKs from `public/cdn/`, and `asset-cdn/` is the local upload mirror.**

---

## Docs in this folder

| File | Who | Covers |
|------|-----|--------|
| [`site.md`](site.md) | Site / marketing | PDP images, model-viewer |
| [`planner.md`](planner.md) | Planner | tldraw, R3F/HDR, furniture GLBs |
| [`backend.md`](backend.md) | Backend | Supabase, R2, Drizzle, env |
| [`folders.md`](folders.md) | Everyone | `public/cdn/` vs `asset-cdn/` |
| [`operations.md`](operations.md) | Ops | Upload scripts, buckets, deploy |

---

## Quick reference

| Layer | Location |
|-------|----------|
| Catalog bytes (cloud) | R2 **`oando-asset-cdn`** |
| Catalog paths (DB) | Supabase |
| App SDKs (deploy) | **`public/cdn/`** |
| Local mirror (upload) | **`asset-cdn/`** |

```bash
npm.cmd run assets:cdn:upload
node scripts/count-r2-objects.mjs oando-asset-cdn
```

Also: `Readme.md` · `docs/SCRIPTS.md` · `asset-cdn/README.md`

---
*Start here. Edit the topic files above when something changes.*