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
npm.cmd run assets:cdn:upload -- --force
npm.cmd run assets:cdn:audit
npm.cmd run assets:r2:create-bucket
node scripts/count-r2-objects.mjs oando-asset-cdn
```

Flags: `--dry-run`, `--limit=N`, `--only=images|models`, `--force`

Default upload skips keys already in R2.

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