# Performance and Core Web Vitals Audit Report

**Audit Path:** `21062026/04-performance-core-web-vitals.md`  
**Date:** June 21, 2026  
**Auditor:** Agent 2 (Performance & Resource Specialist)  

---

## Executive Scorecard

| Parameter | Description | Score (1-10) | Status |
|---|---|---|---|
| **16** | Code splitting implementation for large dependencies | 9.0/10 | Excellent |
| **17** | Image loading optimization | 9.5/10 | Near Perfect |
| **18** | Largest Contentful Paint (LCP) reduction strategies | 9.0/10 | Excellent |
| **19** | Cumulative Layout Shift (CLS) mitigation | 9.0/10 | Excellent |
| **20** | First Input Delay / Interaction to Next Paint (INP) | 8.5/10 | Very Good |

**Overall Core Web Vitals Score:** **9.0 / 10**

---

## Detailed Audit Findings & Recommendations

### Parameter 16: Code Splitting Implementation for Large Dependencies
**Score:** 9.0 / 10

#### Findings
The planner application makes extensive use of heavy client-side libraries, primarily:
- **Three.js / React Three Fiber (R3F)** (approx. 600KB+ minified)
- **Fabric.js** (approx. 250KB+ minified)
- **Model-Viewer** (approx. 350KB+ minified)

The project implements excellent code-splitting and lazy-loading boundaries to prevent these libraries from bloating the initial bundle for marketing and content pages:
1. **Fabric.js & Three.js in Workspace:**  
   In [PlannerWorkspaceRoute.tsx](file:///e:/16062026/features/planner/ui/PlannerWorkspaceRoute.tsx#L10-L16), the main planner workspace component (`PlannerWorkspace`) is imported dynamically using `next/dynamic` with `ssr: false` and a loading fallback skeleton (`PlannerSkeleton`). Fabric.js is confined within this boundary.
2. **Three.js Dynamic Boundary inside Planner:**  
   Inside the editor workspace, the 3D viewer ([Planner3DViewer](file:///e:/16062026/features/planner/3d/Planner3DViewer.tsx)) is dynamically loaded on-demand via [PlannerWorkspace.tsx](file:///e:/16062026/features/planner/editor/PlannerWorkspace.tsx#L254) with `ssr: false`. This ensures Three.js chunks are only downloaded when the user switches to the 3D layout view.
3. **Model-Viewer Integration:**  
   On product detail pages ([ProductViewer.tsx](file:///e:/16062026/app/(site)/products/%5Bcategory%5D/%5Bproduct%5D/ProductViewer.tsx#L221)), the `<model-viewer>` component is loaded dynamically via the [loadModelViewer](file:///e:/16062026/lib/ui/loadModelViewer.ts) helper utility only after the user actively requests the interactive 3D viewer. This keeps the initial page weight minimal.

#### Citations
- Dynamic load of editor shell: [PlannerWorkspaceRoute.tsx](file:///e:/16062026/features/planner/ui/PlannerWorkspaceRoute.tsx#L10-L16)
- Dynamic load of Three.js viewer: [PlannerWorkspace.tsx](file:///e:/16062026/features/planner/editor/PlannerWorkspace.tsx#L254)
- Dynamic load of model-viewer: [ProductViewer.tsx](file:///e:/16062026/app/(site)/products/%5Bcategory%5D/%5Bproduct%5D/ProductViewer.tsx#L221)

#### Recommendations
- Keep monitoring bundle size distributions using `@next/bundle-analyzer` to verify no shared utility files are accidentally dragging Three.js/Fabric imports into the main server-rendered layout chunks.

---

### Parameter 17: Image Loading Optimization
**Score:** 9.5 / 10

#### Findings
1. **Next.js `Image` Usage:** All layout and content images use the Next.js `<Image>` component (`import Image from "next/image"`). Standard HTML `<img>` tags are restricted to non-production code (like test files and comments).
2. **Dynamic Formats & Sizing:** Next.js automatically serves images in modern formats (WEBP and AVIF) depending on client capabilities. Proper `sizes` attributes are passed to components (e.g. `sizes="(max-width: 768px) 100vw, 70vw"` in the gallery), instructing the Next.js image optimizer to generate appropriately scaled image variants.
3. **Placeholder Safety:** A custom helper component [SafeImage.tsx](file:///e:/16062026/components/SafeImage.tsx) is defined to wrap Next.js `Image`, providing custom error boundaries and loading states, though it is not yet fully integrated across all routes.

#### Citations
- Product gallery optimizations: [ProductGallery.tsx](file:///e:/16062026/components/ProductGallery.tsx#L58-L88)
- Safe image wrapper utility: [SafeImage.tsx](file:///e:/16062026/components/SafeImage.tsx)

#### Recommendations
- Refactor existing direct imports of `next/image` in page layouts to use the custom [SafeImage](file:///e:/16062026/components/SafeImage.tsx) wrapper. This ensures consistent error recovery, unified fallback asset styling, and standardized use of CSS `content-visibility` optimizations for off-screen images.

---

### Parameter 18: Largest Contentful Paint (LCP) Reduction Strategies
**Score:** 9.0 / 10

#### Findings
1. **LCP Image Preloading:** In the product gallery ([ProductGallery.tsx](file:///e:/16062026/components/ProductGallery.tsx#L82-L83)), the primary featured product image is configured with `priority` and `fetchPriority="high"`. This prompts the browser to start fetching the primary image before layout compilation completes, shaving valuable milliseconds off LCP.
2. **Font Loading Strategy:** In [fonts.ts](file:///e:/16062026/lib/fonts.ts), custom typography is loaded via Next.js `localFont` with `display: "swap"`. Fallbacks are set to standard system fonts (`sans-serif`), preventing render-blocking behavior during typeface compilation.
3. **Minimal Core Bundles:** Server-side rendering (SSR) is disabled (`ssr: false`) for complex components. The server delivers lightweight static HTML, and heavy Javascript elements are fetched concurrently during client hydration.

#### Citations
- High priority LCP image: [ProductGallery.tsx](file:///e:/16062026/components/ProductGallery.tsx#L82-L83)
- Optimized font configurations: [fonts.ts](file:///e:/16062026/lib/fonts.ts)

#### Recommendations
- Convert custom typefaces loaded in [fonts.ts](file:///e:/16062026/lib/fonts.ts) (such as CiscoSans and HelveticaNeue) from TTF/OTF formats to WOFF2. WOFF2 compression can reduce font file sizes by up to 70%, boosting FCP/LCP metrics on slower networks.

---

### Parameter 19: Cumulative Layout Shift (CLS) Mitigation
**Score:** 9.0 / 10

#### Findings
1. **Reserved Containers:** Critical image slots have strict boundaries. The product gallery main image wrapper uses CSS `min-height: clamp(24rem, 42vw, 40rem)` (see [cta.css](file:///e:/16062026/app/css/core/site/routes/pdp/cta.css#L130)), preventing page jumps when the image asset loads.
2. **Dynamic Loading Skeletal Placeholders:** In [PlannerWorkspaceRoute.tsx](file:///e:/16062026/features/planner/ui/PlannerWorkspaceRoute.tsx#L15), the dynamic import boundary uses `<PlannerSkeleton />`. The skeleton mimics the dimensions of the workspace toolbar and catalog sidebar, maintaining layout stability during chunk hydration.
3. **Image Ratio Locking:** Thumbnail items in [ProductGallery.tsx](file:///e:/16062026/components/ProductGallery.tsx#L51) have fixed width and height dimensions (`h-16 w-16` / `h-20 w-20`) to eliminate shift risks.

#### Citations
- Gallery container constraints: [cta.css](file:///e:/16062026/app/css/core/site/routes/pdp/cta.css#L130)
- Workspace layout skeleton: [PlannerWorkspaceRoute.tsx](file:///e:/16062026/features/planner/ui/PlannerWorkspaceRoute.tsx#L15)

#### Recommendations
- Validate that any dynamically loaded elements (like notifications, banners, or tooltips) have relative containers with pre-allocated bounding spaces to prevent structural shifts when pushed into the DOM.

---

### Parameter 20: First Input Delay (FID) / Interaction to Next Paint (INP) Mitigation
**Score:** 8.5 / 10

#### Findings
1. **Chunk Splitting:** Dynamic chunking reduces the script execution time of main-thread script evaluation at startup.
2. **Debounced History commits:** Dragging canvas elements uses debounced commits to prevent heavy JSON history serialization from blocking the main thread (see [plannerDebouncedUndo.ts](file:///e:/16062026/features/planner/store/plannerDebouncedUndo.ts)).
3. **Keystroke Search Blocking Risk:** In [CatalogPanel.tsx](file:///e:/16062026/features/planner/ui/CatalogPanel.tsx#L189), the search query matches catalog items directly inside a client-side filter reactively on every keystroke. While fast for small catalogs, large catalogs can block the main thread, degrading the INP metric.

#### Citations
- Debounced undo commit utility: [plannerDebouncedUndo.ts](file:///e:/16062026/features/planner/store/plannerDebouncedUndo.ts)
- Keystroke filtering in catalog: [CatalogPanel.tsx](file:///e:/16062026/features/planner/ui/CatalogPanel.tsx#L189)

#### Recommendations
- Add a debounce delay of 150-200ms to the search input handler in [CatalogPanel.tsx](file:///e:/16062026/features/planner/ui/CatalogPanel.tsx) to prevent synchronous catalog iteration from executing on every character entered.
