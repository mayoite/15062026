# Lighthouse Audit — Full Results (3 Routes)

*Run: 2026-06-11 17:10–17:15 IST*
*Tool: Lighthouse 13.4.0, Chrome headless, production build (`npm run build` + `npm run start`)*

## Scores

| Route | Performance | Accessibility | Best Practices | SEO | Agentic Browsing |
|-------|-------------|---------------|----------------|-----|------------------|
| `/` (Home) | **69** | **100** | **96** | **100** | — |
| `/catalog` | **52** | **100** | **96** | **92** | 55 |
| `/planner` | **75** | **96** | **96** | **100** | 100 |

## Evidence files

| Route | JSON | HTML |
|-------|------|------|
| Home | `lighthouse-home.report.json` | `lighthouse-home.report.html` |
| Catalog | `lighthouse-catalog.report.json` | `lighthouse-catalog.report.html` |
| Planner | `lighthouse-planner.report.json` | — |

## Reproduction

```bash
npm run build
npm run start &
# Wait ~5s for server to be ready
npx lighthouse http://localhost:3000 --output=json --output=html --output-path=results/audits/lighthouse-home --chrome-flags="--headless --no-sandbox --disable-gpu"
npx lighthouse http://localhost:3000/catalog --output=json --output=html --output-path=results/audits/lighthouse-catalog --chrome-flags="--headless --no-sandbox --disable-gpu"
npx lighthouse http://localhost:3000/planner --output=json --output-path=results/audits/lighthouse-planner.report.json --chrome-flags="--headless --no-sandbox --disable-gpu"
```

## Key weaknesses

**Performance (52–75 range):**
- `/catalog` is the weakest at 52 — image delivery, render-blocking resources, heavy JS
- `/` at 69 — LCP issues, legacy JS
- `/planner` best at 75 — SSG marketing page, lighter

**Root causes (cross-reference with performance-audit.md):**
1. `config/build/next.config.js` line 180: `ignoreBuildErrors: true` — masks optimizations
2. Heavy libs (tldraw, three, @react-three/fiber) NOT wrapped in `next/dynamic`
3. 19KB catalogData.ts eagerly shipped to client
4. Raw `<img>` tags bypassing Next.js image optimization (3 files)
5. No `optimizePackageImports` for heavy deps

**SEO (/catalog at 92 vs others at 100):**
- Missing or incomplete structured data on catalog pages

**Accessibility (/planner at 96 vs others at 100):**
- Minor issues on planner: likely the `TemplatePickerModal` backdrop div without role (see accessibility-audit.md)

## Immediate perf wins (ordered by impact)

1. Wrap tldraw/three imports in `next/dynamic({ ssr: false })` — saves ~200KB+ from initial bundle
2. Move catalogData to a JSON file loaded via fetch/RSC — removes 19KB from client JS
3. Replace 3 raw `<img>` with `<Image>` — enables lazy loading + webp/avif
4. Add `optimizePackageImports: ["three", "@react-three/fiber", "@react-three/drei", "tldraw"]` to next.config.js
5. Remove `ignoreBuildErrors: true` after confirming 0 typecheck errors (done today)
