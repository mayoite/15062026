# asset-cdn

Local mirror of catalog media for upload to Cloudflare R2. **Not deployed with Next.**

**Workflow docs:** [`docs/workflow/README.md`](../docs/workflow/README.md)

## Upload

```bash
npm.cmd run assets:cdn:upload
node scripts/count-r2-objects.mjs oando-asset-cdn
```

**Bucket:** `oando-asset-cdn` — see [`docs/workflow/operations.md`](../docs/workflow/operations.md)