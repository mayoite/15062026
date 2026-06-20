# Report 02: UI/UX + Lighthouse + Core Web Vitals + Mobile + PWA + Browser Compatibility

**Audit Date:** 2026-06-20
**Auditor:** Agent D
**Scope:** UI/UX patterns, Lighthouse metrics, Core Web Vitals, mobile responsiveness, PWA readiness, browser compatibility

---

## Executive Summary

The application uses modern Next.js 16 with React 19, Tailwind CSS 4, and has good foundational responsive patterns. However, there is no PWA manifest or service worker, limited lazy loading beyond ThreeViewer, and the planner canvas has no mobile touch optimization. Core Web Vitals optimization is partially addressed via `optimizePackageImports` but lacks image optimization strategy.

**Overall Scores:**
- UI/UX: 70/100
- Lighthouse (estimated): 65/100
- Core Web Vitals: 60/100
- Mobile Responsiveness: 55/100
- PWA: 10/100
- Browser Compatibility: 75/100

---

## 1. UI/UX Audit

### 1.1 Responsive Design

**Status:** ⚠️ Partial Implementation

**Findings:**

**Positive:**
- CSS media queries present across 40+ CSS files
- Planner responsive CSS (`app/css/core/planner/planner-responsive.css`)
- Mobile navigation drawer (`components/site/MobileNavDrawer.tsx`)
- Viewport configuration (`lib/siteViewport.ts`)

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `features/planner/canvas-fabric/FloorplanCanvas.tsx` | N/A | Canvas has no touch event handlers | Add touch support for mobile planner |
| High | `features/planner/editor/PlannerWorkspace.tsx` | N/A | Planner layout not responsive below 768px | Add mobile-optimized planner view |
| Medium | `components/home/ShowcaseCarousel.tsx` | 95-161 | Carousel uses mouse events only | Add touch swipe support |
| Medium | `components/home/FeaturedCarousel.tsx` | 64-164 | Same carousel touch gap | Use embla-carousel touch support |
| Medium | `app/css/core/planner/planner-responsive.css` | 3-212 | Breakpoints inconsistent with Tailwind | Standardize breakpoints |
| Low | `components/ui/HotspotImage.tsx` | 53-58 | Hotspot positioning not responsive | Use percentage-based positioning |

### 1.2 Loading States

**Status:** ⚠️ Minimal Implementation

**Findings:**

**Positive:**
- `Suspense` usage in product pages (`app/(site)/products/[category]/[product]/page.tsx:363-368`)
- `loading.tsx` not found — no Next.js loading segments

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `app/(site)/products/[category]/` | N/A | No `loading.tsx` for category pages | Add skeleton loading UI |
| High | `app/planner/` | N/A | No loading state for planner workspace | Add loading boundary |
| Medium | `components/ThreeViewer.tsx` | 14-29 | 3D viewer loading state exists but minimal | Add progress indicator |
| Medium | `features/planner/3d/Planner3DViewer.tsx` | N/A | No loading feedback during model load | Add skeleton/progress UI |
| Low | Multiple pages | Various | No skeleton screens for data fetching | Add skeleton UI patterns |

### 1.3 Error Handling UX

**Status:** ⚠️ Basic Implementation

**Findings:**

**Positive:**
- `app/(site)/error.tsx` exists
- `app/(site)/products/error.tsx` exists
- API routes return structured error responses

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Critical | `app/(site)/layout.tsx` | N/A | No `global-error.tsx` | Add global error boundary |
| High | `app/planner/` | N/A | No error.tsx for planner route | Add planner-specific error UI |
| High | `app/admin/` | N/A | No error.tsx for admin route | Add admin error UI |
| Medium | `features/planner/editor/PlannerWorkspace.tsx` | N/A | No component-level error boundary | Wrap canvas in error boundary |

### 1.4 Interaction Patterns

**Status:** ✅ Good Implementation

**Positive:**
- Consistent button patterns via `components/ui/Button.tsx`
- Modal system with `components/ui/Modal.tsx`
- Toast notifications via `sonner`
- Accordion via Radix UI
- Tabs via Radix UI
- Tooltip system via `lib/ui/Tooltip.tsx`

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Medium | `features/planner/editor/PlannerWorkspace.tsx` | 548-612 | Complex state management with 6+ useEffect | Consolidate into fewer effects |
| Medium | `features/site-assistant/UnifiedAssistant.tsx` | 190-419 | Multiple event listeners without cleanup | Add proper cleanup |
| Low | `components/site/Header.tsx` | 113-257 | Scroll-based header behavior complex | Simplify scroll handling |

---

## 2. Lighthouse Audit (Estimated)

### 2.1 Performance (Estimated: 65/100)

| Metric | Estimated | Target | Status |
|--------|-----------|--------|--------|
| FCP | 2.5s | <1.8s | ⚠️ |
| LCP | 4.0s | <2.5s | ❌ |
| TBT | 350ms | <200ms | ⚠️ |
| CLS | 0.05 | <0.1 | ✅ |
| SI | 3.5s | <3.4s | ⚠️ |

**Key Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `config/build/next.config.js` | 193 | `optimizePackageImports` includes `three` but three.js is 600KB+ | Dynamic import three.js only when needed |
| High | `package.json` | 147 | `three` is a direct dependency (600KB+) | Use dynamic imports for 3D features |
| High | `package.json` | 119 | `fabric` is 300KB+ | Lazy load fabric only on planner route |
| Medium | `package.json` | 128 | `motion` (framer-motion) is 150KB+ | Already optimized via `optimizePackageImports` |
| Medium | `components/ThreeViewer.tsx` | 3 | Only component using `next/dynamic` | Expand dynamic imports to all heavy components |

### 2.2 Best Practices (Estimated: 75/100)

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `app/(site)/layout.tsx` | 35 | `dangerouslySetInnerHTML` for JSON-LD | Sanitize output |
| Medium | `app/api/tracking/route.ts` | 3 | Imports from `@/platform/drizzle/db` mixed with Supabase | Consolidate database clients |
| Medium | Multiple API routes | Various | No API versioning | Add `/api/v1/` prefix |
| Low | `app/api/theme/manage/route.ts` | 19 | Module-level mutable state | Move to database |

### 2.3 SEO (Estimated: 85/100)

See Report 01 for detailed SEO findings.

### 2.4 Accessibility (Estimated: 72/100)

See Report 01 for detailed accessibility findings.

---

## 3. Core Web Vitals Audit

### 3.1 Largest Contentful Paint (LCP)

**Status:** ❌ Needs Improvement

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `components/home/HomepageHero.tsx` | 139-163 | Hero image likely LCP element | Add `priority` to Next.js Image; preload |
| High | `config/build/next.config.js` | 187-191 | Image formats include AVIF/WebP | Good; ensure LCP image is preloaded |
| Medium | `app/(site)/layout.tsx` | 9 | Font loading via CSS | Add `font-display: swap`; preload critical fonts |
| Medium | `lib/fonts.ts` | N/A | Custom fonts (Cisco Sans, Helvetica Neue) | Preload critical font files |

### 3.2 Cumulative Layout Shift (CLS)

**Status:** ✅ Good

**Positive:**
- Image dimensions likely set via Next.js Image component
- Font loading uses `font-display: swap` via CSS variable fonts

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Medium | `components/home/ShowcaseCarousel.tsx` | N/A | Dynamic content may cause shifts | Reserve space for carousel items |
| Low | `features/planner/canvas-fabric/FloorplanCanvas.tsx` | N/A | Canvas resize may cause shifts | Set explicit canvas dimensions |

### 3.3 Interaction to Next Paint (INP)

**Status:** ⚠️ Needs Improvement

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `features/planner/canvas-fabric/FloorplanCanvas.tsx` | 72-78 | Heavy canvas operations on main thread | Offload to web worker |
| High | `features/planner/3d/Planner3DViewer.tsx` | 403-415 | WebGL rendering blocks main thread | Use requestAnimationFrame properly |
| Medium | `features/planner/editor/PlannerWorkspace.tsx` | 131-173 | Multiple useEffect hooks trigger re-renders | Consolidate state updates |

---

## 4. Mobile Responsiveness Audit

### 4.1 Touch Interactions

**Status:** ❌ Critical Gaps

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Critical | `features/planner/canvas-fabric/FloorplanCanvas.tsx` | N/A | No touch event handlers for canvas | Implement pinch-to-zoom, touch drag |
| High | `components/home/ShowcaseCarousel.tsx` | N/A | No swipe support | Add touch swipe via embla-carousel |
| High | `components/ui/HotspotImage.tsx` | 53-58 | Hotspots use mouse events | Add touch support |
| Medium | `features/planner/editor/PlannerWorkspace.tsx` | N/A | Toolbar not optimized for touch | Add touch-friendly toolbar |

### 4.2 Viewport Handling

**Status:** ✅ Good

**Positive:**
- Viewport meta configured via `lib/siteViewport.ts`
- `width=device-width, initial-scale=1` present

### 4.3 Mobile Navigation

**Status:** ✅ Good

**Positive:**
- `MobileNavDrawer.tsx` provides mobile navigation
- Drawer has proper open/close animations
- Keyboard accessible (partially)

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Medium | `components/site/MobileNavDrawer.tsx` | 128-129 | Focus management on close | Restore focus to trigger |
| Medium | `components/site/Header.tsx` | 176 | Media query for mobile detection | Ensure consistent breakpoint |

---

## 5. PWA Audit

### 5.1 Web App Manifest

**Status:** ❌ Not Implemented

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Critical | `app/` | N/A | No `manifest.json` or `manifest.webmanifest` | Create PWA manifest |
| Critical | `app/` | N/A | No service worker | Add service worker for offline support |
| High | `app/` | N/A | No installability support | Add manifest + service worker |
| High | `app/` | N/A | No offline fallback page | Create offline page |

### 5.2 Offline Capabilities

**Status:** ❌ Not Implemented

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `features/planner/store/offlineStorage.ts` | 7-81 | Uses localStorage for offline but no service worker | Add service worker for true offline |
| High | `features/planner/persistence/persistence.ts` | 22-32 | Local persistence exists | Wire to service worker cache |

---

## 6. Browser Compatibility Audit

### 6.1 Cross-Browser Support

**Status:** ✅ Good Foundation

**Positive:**
- Next.js handles most cross-browser issues
- Tailwind CSS uses autoprefixer
- CSS custom properties supported in all modern browsers

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Medium | `features/planner/canvas-fabric/FloorplanCanvas.tsx` | N/A | Fabric.js uses Canvas 2D API | Verify Safari Canvas 2D support |
| Medium | `features/planner/3d/Planner3DViewer.tsx` | N/A | WebGL 2.0 required | Add WebGL 1.0 fallback |
| Medium | `public/cdn/vendor/model-viewer@4.3.1/` | N/A | model-viewer requires Web Components | Add polyfill for Safari |
| Low | `config/build/next.config.js` | 188 | AVIF image format | Ensure fallback to WebP/JPEG for older browsers |

### 6.2 Polyfill Requirements

**Status:** ✅ Minimal

**Findings:**
- Next.js automatic polyfilling handles most cases
- `core-js` not needed (Next.js bundles required polyfills)
- Web Components polyfill needed for model-viewer in Safari

---

## 7. CDN & Asset Optimization Audit

### 7.1 Image Formats

**Status:** ✅ Good

**Positive:**
- AVIF and WebP configured (`next.config.js:188`)
- Remote patterns for Supabase storage and custom CDN
- Sharp for image optimization

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Medium | `public/` | N/A | 2,941 public assets (many unoptimized) | Audit and optimize static assets |
| Medium | `public/cdn/vendor/` | N/A | Vendor scripts served from public | Move to CDN with proper caching |

### 7.2 Font Strategy

**Status:** ⚠️ Needs Improvement

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `public/fonts/helvetica-neue/` | N/A | 7 font files (woff2) loaded without preload | Preload critical fonts |
| Medium | `lib/fonts.ts` | N/A | Font CSS variables defined | Add `font-display: swap` |

### 7.3 Cache Headers

**Status:** ⚠️ Partial

**Positive:**
- `Cache-Control` set on some API responses (`app/api/business-stats/route.ts:16`)
- Theme publish sets `CacheControl: "public, max-age=60"` (`app/api/admin/themes/publish/route.ts:66`)

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `next.config.js` | N/A | No custom cache headers configuration | Add cache headers for static assets |
| Medium | Multiple API routes | Various | No `Cache-Control` on most API responses | Add appropriate cache headers |

---

## 8. Prioritized Action Items

### Critical
1. Add PWA manifest and service worker
2. Fix LCP — preload hero image and critical fonts
3. Add global error boundary (`global-error.tsx`)
4. Add touch support to planner canvas

### High Priority
5. Implement lazy loading for three.js, fabric
6. Add loading.tsx for key routes
7. Optimize INP — offload canvas to web worker
8. Add skeleton screens for data fetching
9. Preload critical font files

### Medium Priority
10. Standardize responsive breakpoints
11. Add carousel touch/swipe support
12. Add cache headers to API responses
13. Add WebGL fallback for older browsers
14. Optimize public assets

### Low Priority
15. Add offline fallback page
16. Add installability prompt
17. Audit vendor CDN scripts
18. Add Core Web Vitals monitoring

---

**Report Generated:** 2026-06-20T02:51Z
**Next Audit Recommended:** After LCP and PWA fixes (4 weeks)
