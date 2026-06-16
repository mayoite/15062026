# asset-cdn

Local mirror of **catalog** media (`images/`, `models/`) for upload to Cloudflare R2. **Not deployed with Next.**

App SDKs (model-viewer, tldraw, HDR) live under **`public/cdn/`** and **`public/tldraw-assets/`** — not here.

**Workflow docs:** [`docs/workflow/folders.md`](../docs/workflow/folders.md)

## Upload

```bash
npm.cmd run assets:cdn:upload
node scripts/count-r2-objects.mjs oando-asset-cdn
```

**Bucket:** `oando-asset-cdn` — see [`docs/workflow/operations.md`](../docs/workflow/operations.md)