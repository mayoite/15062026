# Operations — upload & buckets

*Scripts and R2 admin. Upload ≠ deploy.*

---

## Canonical bucket

**`oando-asset-cdn`**

```env
CLOUDFLARE_R2_CATALOG_BUCKET=oando-asset-cdn
CLOUDFLARE_R2_BUCKET=oando-asset-cdn
```

---

## Commands

```bash
npm.cmd run assets:cdn:sync
npm.cmd run assets:cdn:catalog
npm.cmd run assets:cdn:upload
npm.cmd run assets:cdn:upload:incremental
npm.cmd run assets:cdn:audit
npm.cmd run assets:r2:create-bucket
node scripts/count-r2-objects.mjs oando-asset-cdn
```

Flags: `--dry-run`, `--limit=N`, `--only=images|models`, `--skip-existing`

**Policy:** `assets:cdn:upload` is a **full upload** — every local file overwrites its R2 key. Use `assets:cdn:upload:incremental` (or `--skip-existing`) only to gap-fill missing keys, not for catalog updates.

---

## Buckets (this account)

| Bucket | Status |
|--------|--------|
| `oando-asset-cdn` | **Active** |
| `oando-assets-prod` | Legacy — retire after cutover |
| `oando-catalog`, `oando-themes` | Deleted |

---

## Deploy checklist (later)

1. Finish upload (~2,828 files)
2. Wire worker to `oando-asset-cdn`
3. Confirm `NEXT_PUBLIC_ASSET_BASE_URL`
4. Smoke-test site + planner
5. Retire `oando-assets-prod`

---

## Related

[`folders.md`](folders.md) · [`backend.md`](backend.md) · [`docs/SCRIPTS.md`](../SCRIPTS.md) · [`README.md`](README.md)