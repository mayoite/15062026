# Multi-Stream Code Quality Improvement Plan

**Date:** 2026-06-20  
**Repository:** oando-platform  
**Based on:** Comprehensive Audit (Reports 01-08 + Executive Summary)  
**Overall Production Readiness:** 7.2 / 10 → **Target:** 9.0 / 10 within 12 weeks

---

## Plan Overview

This plan organizes remediation into **9 parallel streams** that can be worked on simultaneously by different developers or agents. Each stream has clear phases, success criteria, and dependencies.

**Total estimated effort:** 10-12 weeks (1 developer) or 3-4 weeks (3-4 developers in parallel)

### Stream Overview

- **Stream A: Security & Hardening** (5 phases, 2 weeks) — XSS, CSRF, validation, env vars, auth patterns
- **Stream B: Performance & Bundle** (5 phases, 2 weeks) — Code splitting, images, CWV, memory leaks, fonts
- **Stream C: Accessibility & Errors** (6 phases, 2.5 weeks) — Error boundaries, loading states, focus, ARIA, forms
- **Stream D: API & Database** (7 phases, 2 weeks) — Route consolidation, migrations, indexes, versioning
- **Stream E: Testing & QA** (5 phases, 2 weeks) — Canvas/3D tests, API tests, E2E stability, coverage
- **Stream F: Mobile & PWA** (6 phases, 2 weeks) — Manifest, service worker, offline, touch, responsive
- **Stream G: Internationalization** (6 phases, 3 weeks) — Framework setup, string extraction, routing, formatting, translations
- **Stream H: Documentation** (5 phases, 1.5 weeks) — Architecture, API, components, onboarding, runbook
- **Stream I: Legacy Cleanup** (5 phases, 1 week) — Appwrite removal, tldraw, dependencies, dead code, stores

### Progress Update (2026-06-20)
- **Stream D (Database)** — Indexes added, migrations made idempotent, schema + RLS docs published. Commit: `f2663274`.

---

## Stream A: Security & Hardening

**Current score:** 5.5/10 → **Target:** 9.0/10

### Phase A1: XSS Elimination (Days 1-3)
Eliminate 14 instances of unsanitized `dangerouslySetInnerHTML` across layout, pages, and components.

### Phase A2: CSRF Protection (Days 3-5)
Implement token-based CSRF protection on all mutation routes (POST/PUT/DELETE).

### Phase A3: Input Validation Centralization (Days 5-8)
Create centralized Zod schemas and apply validation to all API routes.

### Phase A4: Environment Hardcoding (Days 8-10)
Create `lib/config/env.ts` abstraction; eliminate 30+ hardcoded env var references.

### Phase A5: Auth Middleware Standardization (Days 10-14)
Consolidate 4 different auth patterns into single `withAuth()` middleware with RBAC.

---

## Stream B: Performance & Bundle Optimization

**Current score:** 5.5/10 → **Target:** 8.5/10

### Phase B1: Dynamic Imports & Code Splitting (Days 1-4)
Convert Three.js (600KB+), Fabric.js (300KB+), and PDF libs to dynamic imports.

### Phase B2: Image Optimization (Days 4-6)
Convert all images to `next/image` with lazy loading and optimization.

### Phase B3: Core Web Vitals Optimization (Days 6-9)
Achieve LCP < 2.5s, TBT < 200ms, INP < 200ms through preloading, task splitting, and consolidation.

### Phase B4: Memory Leak Fixes (Days 9-12)
Audit and fix all `useEffect` hooks without cleanup; add AbortController patterns.

### Phase B5: Font & CSS Optimization (Days 12-14)
Subset fonts, standardize breakpoints, reduce CSS bundle.

---

## Stream C: Accessibility & Error Handling

**Current score:** 4.5/10 → **Target:** 8.5/10

### Phase C1: Error Boundaries (Days 1-3) — CRITICAL
Create global, route, and component-level error boundaries; wrap canvas/3D.

### Phase C2: Loading States (Days 3-5)
Add `loading.tsx` to all route segments; create skeleton loading UI.

### Phase C3: Focus Management & Keyboard Navigation (Days 5-9)
Implement focus traps, roving tabindex, keyboard shortcuts, visible focus indicators.

### Phase C4: ARIA Completion (Days 9-12)
Add missing ARIA roles, labels, states across modals, tabs, buttons, canvas.

### Phase C5: Form Accessibility (Days 12-15)
Ensure all forms pass WCAG 2.1 AA guidelines with label association, error messaging.

### Phase C6: Accessibility Testing Infrastructure (Days 15-17)
Add automated a11y tests to E2E suite; integrate into release gate.

---

## Stream D: API & Database Architecture

**Current score:** 6.5/10 → **Target:** 9.0/10

### Phase D1: Route Consolidation (Days 1-3)
Merge 3 duplicate catalog routes + 4 overlapping AI routes into parameterized routes.

### Phase D2: Error Response Standardization (Days 4-6)
Create `ApiError` class and consistent error format across all routes.

### Phase D3: Database Migrations (Days 6-8)
Set up Drizzle Kit; generate initial migration; document workflow.

### Phase D4: Missing Indexes (Days 8-9)
Add indexes on all foreign keys and common query fields.

### Phase D5: Soft Deletes (Days 9-11)
Implement soft deletes for user data; add restore functionality.

### Phase D6: API Versioning (Days 11-14)
Move routes under `/api/v1/`; document versioning strategy.

---

## Stream E: Testing & Quality Assurance

**Current score:** 7.0/10 → **Target:** 9.0/10

### Phase E1: Canvas & 3D Test Coverage (Days 1-5)
Increase FloorplanCanvas (23% → 80%) and Viewer (18% → 80%) test coverage.

### Phase E2: API Route Tests (Days 5-8)
Add integration tests for all API route groups (plans, catalog, admin, AI).

### Phase E3: E2E Test Stability (Days 8-10)
Add retry logic, explicit waits, test isolation; remove flaky tests.

### Phase E4: Coverage Enforcement (Days 10-12)
Expand scope; raise thresholds to 80%+ statements; enforce in CI.

### Phase E5: Performance Testing (Days 12-14)
Add Lighthouse CI; create performance budgets; monitor bundle size.

---

## Stream F: Mobile & PWA

**Current score:** 4.5/10 → **Target:** 8.0/10

### Phase F1: PWA Manifest & Icons (Days 1-2)
Create `manifest.json` with app metadata; generate icons (72-512px).

### Phase F2: Service Worker (Days 2-4)
Implement `public/sw.js` with caching, offline fallback, install/activate events.

### Phase F3: Offline Status & Sync (Days 4-6)
Add online/offline banner, sync status, auto-sync on reconnect.

### Phase F4: Touch Optimization (Days 6-9)
Add pinch-to-zoom, long-press, touch swipe, 44x44px targets, DPR reduction.

### Phase F5: Responsive Layout Fixes (Days 9-12)
Add mobile-optimized views, fix breakpoints, test on iOS/Android.

### Phase F6: Browser Compatibility (Days 12-14)
Document supported browsers; add WebGL1 fallback, CSS fallbacks.

---

## Stream G: Internationalization

**Current score:** 0/10 → **Target:** 7.0/10

### Phase G1: Framework Setup (Days 1-3)
Install `next-intl`; create `messages/en.json`; configure locale routing.

### Phase G2: String Extraction (Days 3-7)
Extract all hardcoded user-facing strings from components; organize by namespace.

### Phase G3: Locale Routing (Days 7-9)
Implement `/en/` and `/hi/` prefix routing; add locale detection and persistence.

### Phase G4: Date/Number/Currency Formatting (Days 9-11)
Create locale-aware formatters using `Intl.*` APIs.

### Phase G5: Initial Translations (Days 11-15)
Create Hindi translation for core flows (login, planner, products).

### Phase G6: i18n Testing (Days 15-18)
Add locale switching tests, string completeness checks, layout tests.

---

## Stream H: Documentation

**Current score:** 5.5/10 → **Target:** 8.0/10

### Phase H1: Architecture Documentation (Days 1-3)
Create C4 diagrams, data flow diagrams, auth flow diagram.

### Phase H2: API Documentation (Days 3-5)
Create OpenAPI 3.0 spec; document all routes with examples.

### Phase H3: Component Documentation (Days 5-7)
Add JSDoc to components; create usage examples.

### Phase H4: Developer Onboarding (Days 7-9)
Create setup guide, contributing guide, common workflows.

### Phase H5: Operations Runbook (Days 9-11)
Document backup/restore, deployment, rollback, incident response.

---

## Stream I: Legacy Cleanup

**Current score:** 5.0/10 → **Target:** 9.0/10

### Phase I1: Appwrite Removal (Days 1-2) — CRITICAL
Delete `platform/appwrite/`, remove imports, verify auth works via Supabase only.

### Phase I2: tldraw Residue (Days 2-3)
Remove tldraw references from active code; clean schema comments.

### Phase I3: Dependency Audit (Days 3-4)
Run `depcheck`, remove unused packages, fix audit vulnerabilities.

### Phase I4: Dead Code Detection (Days 4-5)
Run `ts-prune`, `unimported`, `madge`; remove circular dependencies.

### Phase I5: Store Refactoring (Days 5-7)
Split `plannerStore.ts` (847 lines) into domain-specific slices.

---

## Execution Timeline (8 Weeks)

```
Week 1:  A1-A2 | B1-B2 | C1-C2 | H1 | I1-I2
Week 2:  A3-A4 | B3-B4 | C3-C4 | H2-H3 | I3-I4
Week 3:  A5 | B5 | C5-C6 | D1-D2 | H4
Week 4:  D3-D5 | E1-E2 | F1-F2 | H5
Week 5:  D6-D7 | E3-E4 | F3-F4 | G1-G2 | I5
Week 6:  E5 | F5-F6 | G3-G4
Week 7:  G5-G6 | Integration testing
Week 8:  Release gate validation | Final QA
```

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Production Readiness | 7.2/10 | 9.0/10 |
| Security Issues | 14 critical | 0 |
| Test Coverage | 40% | 75% |
| LCP | 4.0s | 2.5s |
| Accessibility (axe) | 72/100 | 95/100 |
| API Duplicates | 7 routes | 0 |
| i18n Locales | 0 | 2 (en, hi) |
| PWA Installable | No | Yes |
| Documentation | CONTENTS.md | Full architecture + API |

---

*Plan compiled from comprehensive audit reports 01-08. 2026-06-20.*
