# Planner — assets & CDN

*Workspace planner (`app/planner/`, `features/planner/`): tldraw, 3D viewer, catalog GLBs.*

---

## One sentence

**Planner SDKs (tldraw, Three.js HDR, model-viewer decoders) ship from `public/cdn/`; furniture GLBs and catalog thumbnails use the same R2 paths as the site.**

---

## Same-origin SDKs (deployed with Next)

| Asset | URL today | Target layout |
|-------|-----------|---------------|
| tldraw icons, fonts, i18n | `/tldraw-assets/` | `/cdn/tldraw@x.y.z/` |
| HDR environment maps | `/cdn/*.hdr` | `/cdn/env/*.hdr` |
| model-viewer decoders | `/cdn/vendor/...` | unchanged |

### tldraw

- CSS: `tldraw/tldraw.css` in `app/planner/(workspace)/layout.tsx`
- Assets: `getAssetUrls({ baseUrl: "/tldraw-assets/" })` in `PlannerCanvas.tsx`, `SharedTldrawEngine.tsx`
- npm: `tldraw`, `@tldraw/assets` — versions should match

### 3D viewer (React Three Fiber)

- `PlannerViewer.tsx`, `SceneEnvironment.tsx` (`/cdn/lebombo_1k.hdr`)
- `SharedR3FEngine.tsx` (`potsdamer_platz_1k.hdr`)

### Blueprint PDF

- `blueprintPdf.ts` — `pdfjs-dist` from npm, not R2

---

## Cloud catalog assets (R2)

| Use | Path pattern | Code |
|-----|--------------|------|
| Catalog images | `/images/catalog/...` | `plannerCatalogCore.ts` |
| Furniture GLB | `/models/chairs/.../*.glb` | `assetPipeline.ts` registry |
| Plan thumbnail | R2 URL (optional) | Drizzle `plans.thumbnail_url` |

---

## Commands

```bash
npm.cmd run assets:cdn:sync
npm.cmd run assets:cdn:upload
npm.cmd run assets:cdn:catalog
```

---

## Related

[`site.md`](site.md) · [`backend.md`](backend.md) · [`operations.md`](operations.md) · [`README.md`](README.md)