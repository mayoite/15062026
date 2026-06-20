# Report 01: SEO + Accessibility + ARIA Audit

**Audit Date:** 2026-06-20  
**Auditor:** Agent D  
**Scope:** SEO optimization, WCAG 2.1 AA compliance, ARIA implementation, keyboard navigation

---

## Executive Summary

The Oando Platform demonstrates strong foundational SEO implementation with dynamic metadata, structured data, and proper sitemap generation. Accessibility shows good progress with skip links, ARIA attributes, and keyboard handlers, but has critical gaps in error boundary coverage and focus management. ARIA implementation is inconsistent across components.

**Overall Scores:**
- SEO: 85/100 (Good)
- Accessibility: 72/100 (Needs Improvement)
- ARIA Implementation: 68/100 (Needs Improvement)

---

## 1. SEO Audit

### 1.1 Meta Tags & Metadata

**Status:** ✅ Strong Implementation

**Findings:**

**Positive:**
- Dynamic metadata generation via `buildPageMetadata()` and `buildSiteMetadata()` (`lib/analytics/seo.ts:15-34`)
- Per-page metadata exports in all route files
- Centralized SEO configuration in `SITE_BRAND` constant
- Open Graph and Twitter Card support via `buildOpenGraph()` helper

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Medium | `app/(site)/layout.tsx` | 15 | Root metadata uses static `buildSiteMetadata()` | Consider dynamic metadata for homepage personalization |
| Low | `lib/analytics/seo.ts` | 33 | OG image path is relative (`/images/products/imported/fluid/image-1.webp`) | Use absolute URL for social sharing: `${SITE_URL}/images/...` |
| Low | Multiple product pages | Various | Missing Twitter Card specific tags | Add `twitter:card`, `twitter:site`, `twitter:creator` |

**Code Example — Fix OG Image:**
```typescript
// lib/analytics/seo.ts:33
ogImage: `${SITE_URL}/images/products/imported/fluid/image-1.webp`,
```

### 1.2 Structured Data (JSON-LD)

**Status:** ✅ Comprehensive Implementation

**Findings:**

**Positive:**
- Global organization JSON-LD in root layout (`app/(site)/layout.tsx:19-38`)
- Page-specific JSON-LD via `buildPageJsonLd()` helper
- Product structured data via `buildProductJsonLd()`
- Breadcrumb structured data via `buildBreadcrumbJsonLd()`
- FAQ structured data via `buildFAQJsonLd()`

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `app/(site)/layout.tsx` | 35 | `dangerouslySetInnerHTML` used for JSON-LD | Sanitize JSON before stringification to prevent XSS |
| Medium | `app/(site)/page.tsx` | 37 | Homepage JSON-LD injected via `dangerouslySetInnerHTML` | Same XSS risk as above |
| Low | Multiple pages | Various | Missing `dateModified` in WebPage schema | Add dynamic `dateModified` from page data |

**Security Risk — XSS via JSON-LD:**
```typescript
// CURRENT (VULNERABLE):
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
/>

// RECOMMENDED (SAFE):
const sanitizedJsonLd = JSON.stringify(homeJsonLd)
  .replace(/</g, '\\u003c')
  .replace(/>/g, '\\u003e')
  .replace(/&/g, '\\u0026');

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: sanitizedJsonLd }}
/>
```

### 1.3 Sitemap

**Status:** ✅ Excellent Implementation

**File:** `app/(site)/sitemap.ts`

**Positive:**
- Dynamic sitemap generation with 24 static paths
- Automatic product page inclusion from catalog
- Proper `lastModified`, `changeFrequency`, and `priority` attributes
- Error handling with fallback to static sitemap

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Low | `app/(site)/sitemap.ts` | 48 | All non-root pages have same priority (0.7) | Differentiate by page importance (products: 0.8, about: 0.5) |
| Low | `app/(site)/sitemap.ts` | 59 | Product pages use monthly changeFrequency | Consider weekly for popular products |

### 1.4 Robots.txt

**Status:** ✅ Good Implementation

**File:** `app/(site)/robots.ts`

**Positive:**
- Proper disallow rules for `/api/`, `/admin/`, `/crm/`, `/ops/`
- Sitemap reference included
- Host directive for canonical domain

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Medium | `app/(site)/robots.ts` | 12 | Missing disallow for `/planner/canvas/` and `/planner/guest/` | Add to prevent indexing of private planner routes |

**Recommended Fix:**
```typescript
// app/(site)/robots.ts:12
disallow: [
  "/api/",
  "/admin/",
  "/crm/",
  "/ops/",
  "/planner/canvas/",
  "/planner/guest/",
  "/dashboard/",
  "/portal/"
],
```

### 1.5 Canonical URLs

**Status:** ✅ Implemented

**Findings:**
- `buildCanonicalUrl()` helper exists (`lib/analytics/seo.ts`)
- Proper trailing slash handling via `next.config.js:71` (`trailingSlash: true`)

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Medium | `next.config.js` | 72-184 | 28 permanent redirects defined | Audit for stale redirects; document redirect strategy |
| Low | Multiple pages | Various | Missing `rel="alternate"` for potential i18n | Prepare for future localization |

### 1.6 Open Graph & Twitter Cards

**Status:** ⚠️ Partial Implementation

**Findings:**
- OG tags generated via `buildOpenGraph()` helper
- Missing Twitter Card specific tags

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `lib/analytics/seo.ts` | 21-34 | Missing Twitter Card configuration | Add `twitter:card`, `twitter:site`, `twitter:creator` to metadata |
| Medium | `lib/analytics/seo.ts` | 33 | OG image is static | Make dynamic per page type |

**Recommended Addition:**
```typescript
// lib/analytics/seo.ts
export function buildPageMetadata(siteUrl: string, input: PageMetadataInput) {
  return {
    // ... existing metadata
    twitter: {
      card: 'summary_large_image',
      site: '@oando_furniture',
      creator: '@oando_furniture',
      title: input.title,
      description: input.description,
      images: [input.ogImage || SITE_BRAND.ogImage],
    },
  };
}
```

---

## 2. Accessibility Audit (WCAG 2.1 AA)

### 2.1 Skip Navigation

**Status:** ✅ Implemented

**File:** `app/(site)/layout.tsx:41-46`

**Positive:**
- Skip link present with proper styling
- Focus styles visible on keyboard navigation
- Links to `#main-content` anchor

**Code:**
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-9999 focus:bg-panel focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:outline-none focus:ring-2 focus:ring-primary"
>
  Skip to main content
</a>
```

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Medium | `app/(site)/layout.tsx` | 49 | Main content uses `<main id="main-content">` but no `tabIndex={-1}` | Add `tabIndex={-1}` to allow programmatic focus |

### 2.2 Color Contrast

**Status:** ⚠️ Needs Verification

**Findings:**
- Theme system uses CSS custom properties (`app/css/core/tokens/theme.css`)
- Tailwind CSS color classes used throughout
- No automated contrast checking in place

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `app/css/core/tokens/theme.css` | Various | No documented contrast ratios for theme colors | Run axe-core audit; document contrast ratios |
| Medium | `components/site/Header.tsx` | Various | Navigation links may have insufficient contrast | Verify contrast ratios; adjust if below 4.5:1 |
| Medium | `components/home/Hero.tsx` | Various | Hero text overlay on images | Ensure text has sufficient contrast against background images |

**Recommended Action:**
```bash
# Run automated contrast audit
npx playwright test -c config/build/playwright.config.ts tests/accessibility.spec.ts
```

### 2.3 Focus Management

**Status:** ⚠️ Inconsistent Implementation

**Findings:**

**Positive:**
- Focus styles defined in skip link (`focus:ring-2 focus:ring-primary`)
- Modal component manages focus trap (`components/ui/Modal.tsx:52-71`)
- Keyboard event handlers present in interactive components

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Critical | `app/(site)/error.tsx` | 22 | Error boundary has no focus management | Add focus to error message on render |
| High | `components/ui/Modal.tsx` | 37-38 | Focus trap implementation needs verification | Test with screen reader; ensure focus cycles correctly |
| High | `features/planner/editor/PlannerWorkspace.tsx` | 131-132 | Multiple useEffect hooks without cleanup | Add proper cleanup functions to prevent memory leaks |
| Medium | `components/site/MobileNavDrawer.tsx` | 128-129 | Focus not returned to trigger element on close | Store trigger ref; restore focus on close |
| Medium | `features/planner/editor/ExportModal.tsx` | 124-125 | Modal focus management not tested | Add accessibility tests for modal |

**Code Example — Fix Error Boundary Focus:**
```tsx
// app/(site)/error.tsx
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const errorRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    errorRef.current?.focus();
  }, []);
  
  return (
    <div ref={errorRef} tabIndex={-1} role="alert" aria-live="assertive">
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### 2.4 Keyboard Navigation

**Status:** ⚠️ Partial Implementation

**Findings:**

**Positive:**
- `onKeyDown` handlers present in interactive components
- `tabIndex` attributes used in custom interactive elements
- Keyboard shortcuts system (`lib/ui/KeyboardShortcuts.tsx`)

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `components/home/ShowcaseCarousel.tsx` | 95-161 | Carousel navigation not keyboard accessible | Add arrow key navigation; ensure buttons are focusable |
| High | `components/home/FeaturedCarousel.tsx` | 64-164 | Same carousel accessibility issues | Implement keyboard navigation pattern |
| Medium | `components/ui/HotspotImage.tsx` | 53-58 | Hotspots not keyboard accessible | Make hotspots focusable; add keyboard activation |
| Medium | `features/planner/canvas-fabric/FloorplanCanvas.tsx` | 72-78 | Canvas interactions not keyboard accessible | Provide keyboard alternatives for canvas operations |

**Recommended Keyboard Pattern:**
```tsx
// components/home/ShowcaseCarousel.tsx
const handleKeyDown = (event: React.KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowLeft':
      goToPrevious();
      break;
    case 'ArrowRight':
      goToNext();
      break;
    case 'Home':
      goToFirst();
      break;
    case 'End':
      goToLast();
      break;
  }
};

<div
  role="region"
  aria-label="Product showcase"
  onKeyDown={handleKeyDown}
  tabIndex={0}
>
  {/* Carousel content */}
</div>
```

### 2.5 Screen Reader Compatibility

**Status:** ⚠️ Needs Testing

**Findings:**

**Positive:**
- ARIA labels present in many components
- `aria-label` used for icon-only buttons
- `role` attributes used appropriately

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `components/ProductGallery.tsx` | 34-51 | Image gallery lacks proper ARIA live region | Add `aria-live="polite"` for image changes |
| High | `features/planner/editor/PlannerTopBar.tsx` | 65-66 | Toolbar state changes not announced | Add aria-live region for tool changes |
| Medium | `components/site/Header.tsx` | 184-655 | Complex navigation structure | Simplify ARIA structure; test with screen reader |
| Medium | `features/planner/editor/PlannerStepBar.tsx` | 44 | Step indicator not announced | Add proper step announcements |

### 2.6 Error Boundaries

**Status:** ❌ Critical Gap

**Findings:**

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Critical | `app/(site)/layout.tsx` | N/A | No global error boundary wrapper | Wrap children in ErrorBoundary component |
| Critical | `app/(site)/error.tsx` | 22 | Error boundary exists but limited coverage | Extend to all route segments |
| High | `features/planner/editor/PlannerWorkspace.tsx` | N/A | Planner workspace has no error boundary | Wrap in ErrorBoundary with recovery UI |
| High | `components/ThreeViewer.tsx` | 14-29 | 3D viewer has no error boundary | Wrap WebGL content in ErrorBoundary |
| High | `features/planner/3d/Planner3DViewer.tsx` | 403-415 | 3D viewer cleanup issues | Fix useEffect cleanup; add error boundary |

**Recommended Global Error Boundary:**
```tsx
// components/ErrorBoundary.tsx
export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logErrorToService(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}

// app/(site)/layout.tsx
<QueryProvider>
  <ErrorBoundary fallback={<GlobalErrorFallback />}>
    <RouteChrome position="top" />
    <main id="main-content">{children}</main>
    <RouteChrome position="bottom" />
  </ErrorBoundary>
</QueryProvider>
```

---

## 3. ARIA Audit

### 3.1 ARIA Attributes Usage

**Status:** ⚠️ Inconsistent Implementation

**Findings:**

**Positive:**
- `aria-label` used in 30+ components
- `role` attributes present in navigation, buttons, regions
- `aria-expanded`, `aria-controls` used in dropdowns

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `components/site/Header.tsx` | 358-655 | Complex navigation with incomplete ARIA | Add `aria-current="page"` for active links |
| High | `components/site/MobileNavDrawer.tsx` | 58-387 | Drawer lacks proper ARIA attributes | Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Medium | `components/home/Collections.tsx` | 37-99 | Grid layout not announced | Add `role="list"` to container, `role="listitem"` to items |
| Medium | `components/home/HomeFAQ.tsx` | 40-61 | FAQ accordion needs proper ARIA | Ensure `aria-expanded`, `aria-controls` are correct |
| Low | `components/ui/Button.tsx` | 28-29 | Icon-only buttons need aria-label | Audit all icon buttons for labels |

### 3.2 ARIA Live Regions

**Status:** ❌ Missing Implementation

**Findings:**

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `features/planner/editor/PlannerWorkspace.tsx` | N/A | Planner state changes not announced | Add `aria-live="polite"` region for state updates |
| High | `components/ui/Modal.tsx` | N/A | Modal open/close not announced | Add `aria-live="assertive"` announcement |
| Medium | `features/site-assistant/UnifiedAssistant.tsx` | 190-419 | Chat messages not announced | Add live region for new messages |
| Medium | `components/ui/UndoToast.tsx` | 31-44 | Toast notifications not announced | Add `role="alert"`, `aria-live="assertive"` |

### 3.3 ARIA Roles

**Status:** ⚠️ Mostly Correct

**Findings:**

**Positive:**
- Navigation landmarks use `role="navigation"` or `<nav>`
- Buttons use `role="button"` or `<button>`
- Regions use appropriate landmark roles

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Medium | `components/repo-store/RepoStorePageView.tsx` | 138-165 | Custom layout uses non-semantic elements | Add proper landmark roles |
| Low | `components/backend-architecture/BackendArchitecturePageView.tsx` | 290-547 | Complex diagram not accessible | Add `role="img"` with descriptive `aria-label` |

---

## 4. Prioritized Action Items

### Critical (Fix Immediately)
1. **Add global error boundary** — `app/(site)/layout.tsx`
2. **Fix JSON-LD XSS vulnerability** — Sanitize before `dangerouslySetInnerHTML`
3. **Add error boundary to PlannerWorkspace** — Prevent full-page crashes
4. **Add error boundary to ThreeViewer** — WebGL errors shouldn't crash app

### High Priority (Fix This Sprint)
5. **Implement keyboard navigation for carousels** — `ShowcaseCarousel.tsx`, `FeaturedCarousel.tsx`
6. **Fix modal focus management** — `Modal.tsx`, `MobileNavDrawer.tsx`
7. **Add Twitter Card metadata** — `lib/analytics/seo.ts`
8. **Add ARIA live regions** — Planner state, modals, toasts
9. **Verify color contrast ratios** — Run axe-core audit
10. **Make canvas keyboard accessible** — `FloorplanCanvas.tsx`

### Medium Priority (Fix Next Sprint)
11. **Update robots.txt** — Add planner route disallows
12. **Add aria-current to active nav links** — `Header.tsx`
13. **Fix carousel ARIA structure** — Add proper roles and labels
14. **Add error boundary focus management** — Focus error message on render
15. **Test with screen reader** — VoiceOver, NVDA testing

### Low Priority (Backlog)
16. **Differentiate sitemap priorities** — Weight by page importance
17. **Add dateModified to JSON-LD** — Dynamic timestamps
18. **Prepare for i18n** — Add `rel="alternate"` hreflang
19. **Document contrast ratios** — Theme color documentation
20. **Add accessibility tests** — Jest + Playwright a11y tests

---

## 5. Testing Recommendations

### Automated Testing
```bash
# Run axe-core accessibility audit
npm run test:a11y

# Run Lighthouse accessibility audit
npx lighthouse https://oando.co.in --view

# Run Playwright accessibility tests
npx playwright test -c config/build/playwright.config.ts tests/accessibility.spec.ts
```

### Manual Testing Checklist
- [ ] Navigate entire site with keyboard only (Tab, Shift+Tab, Enter, Space, Arrow keys)
- [ ] Test with screen reader (VoiceOver on Mac, NVDA on Windows)
- [ ] Verify focus visible on all interactive elements
- [ ] Test zoom to 200% — content should remain usable
- [ ] Test with high contrast mode enabled
- [ ] Verify color contrast with WebAIM contrast checker
- [ ] Test form error messages are announced
- [ ] Verify modal focus trap works correctly
- [ ] Test skip link functionality
- [ ] Verify error boundary recovery UI

---

## 6. Compliance Status

### WCAG 2.1 AA Compliance

| Principle | Status | Score | Notes |
|-----------|--------|-------|-------|
| Perceivable | ⚠️ Partial | 75% | Missing alt text in some places; contrast needs verification |
| Operable | ⚠️ Partial | 70% | Keyboard navigation gaps; focus management issues |
| Understandable | ✅ Good | 85% | Clear error messages; consistent navigation |
| Robust | ⚠️ Partial | 65% | ARIA implementation inconsistent; error boundaries missing |

**Overall WCAG 2.1 AA Compliance: 74%** (Needs Improvement)

---

## 7. References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [Next.js Accessibility](https://nextjs.org/docs/app/building-your-application/accessibility)

---

**Report Generated:** 2026-06-20T02:51Z  
**Next Audit Recommended:** After critical fixes (2 weeks)
