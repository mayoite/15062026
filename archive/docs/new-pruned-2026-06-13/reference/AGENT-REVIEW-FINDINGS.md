# 5-Agent Review Findings (Files 01-11)

*Created: 2026-06-11 — Designer, Brainstormer, Critic, Technical Architect, Product Strategy*

## Executive Summary

**Critical gaps identified:**
- **Data loss risks**: No rollback for planner_saves, no guest-to-auth migration, dual-write race between Drizzle and Supabase
- **UI/UX gaps**: Missing interaction states, mobile touch specs, loading/error patterns
- **Strategic gaps**: No B2B designer tier, no showroom integration, no monetization strategy beyond one-time furniture sales

---

## 1. UI/UX Designer Findings

### 04-DESIGN-SYSTEM.md Gaps
- ❌ No interaction state tokens (disabled, loading, error, focus)
- ❌ No form input pattern library (text fields, dropdowns, validation states)
- ❌ No feedback component specs (toasts, modals, tooltips)
- ❌ Missing accessibility contrast ratios (WCAG 2.1 AA requirements)
- ❌ No loading skeleton patterns
- ✅ **Strength**: Excellent color/typography/motion token architecture

**Recommendation**: Add interaction state section with disabled/hover/active/focus states for all interactive elements; document toast/modal/tooltip patterns; add WCAG 2.1 AA contrast ratio table.

### 01-SITE-UI.md Gaps
- ❌ No loading states for slow connections (common in India tier-2/3 cities)
- ❌ Missing touch target size requirements (minimum 44×44px per WCAG 2.5.8)
- ❌ No error/empty state catalog
- ❌ Missing keyboard navigation specifications
- ❌ No data-light mode for low-bandwidth scenarios
- ✅ **Strength**: Good component-level acceptance criteria

**Recommendation**: Add mobile-first performance section addressing 3G speeds, low-end device support; document touch target sizes; create error/empty state catalog per surface.

### 02-PLANNER.md Gaps
- ❌ Vague canvas interaction feedback (no specific visual changes on hover/select/drag)
- ❌ No mobile touch gesture documentation (pan vs pinch vs drag)
- ❌ Missing undo/redo UI specifications (button position, keyboard shortcuts, visual feedback)
- ❌ No performance degradation handling (what happens on low-end devices?)
- ❌ Incomplete save error recovery UX
- ✅ **Strength**: Excellent India-market brainstorming ideas (Vastu, Sabha, Hindi)

**Recommendation**: Add canvas interaction specifications section with state-by-state UI behavior; document mobile touch gestures; specify undo/redo UI; add performance degradation graceful fallback.

---

## 2. Creative Brainstormer Ideas

### Bold Product Ideas for India Market

#### From 08-GEOMETRY-STATUS.md
1. **Monsoon Water Flow Analyzer** — Simulates rain seepage paths when walls/doors drawn; highlights furniture vulnerability zones. **Why**: Prevents water damage anxiety unique to Indian monsoon regions.

2. **"Will It Fit Through?" Gateway Check** — Flags furniture that won't pass through doors based on drawn dimensions; shows 3D delivery path animation. **Why**: Eliminates #1 purchase anxiety for online furniture buyers.

3. **Millimeter-Perfect Carpentry Export** — PDF with exact measurements/angles/cutting diagrams for local carpenters. **Why**: Indian market relies on custom carpentry; this connects digital plan to physical execution.

#### From 02-PLANNER.md
4. **Family "Sabha" Review Mode** — Multiple people on same Wi-Fi drop reaction pins on furniture; consensus view before quote. **Why**: Indian families decide together; this gives everyone a voice.

5. **EMI Calculator in BOQ** — Shows "₹1,24,000 or ₹5,200/month for 24 months" alongside total. **Why**: Removes sticker shock; aligns with India's EMI-first purchase culture.

#### From 07-CAPABILITY-MATRIX.md
6. **Showroom Kiosk Mode** — Customer walks into Oando showroom, staff hand them tablet; design captured, quote emailed. **Why**: Bridges online tool to offline sales channel; captures walk-in traffic.

---

## 3. Critical Analyst Findings

### 05-BACKEND-AND-DATA.md Critical Gaps
- 🔴 **CRITICAL**: No rollback procedure for planner_saves writes — if save partially completes (document written but thumbnail upload fails), no recovery path
- 🔴 **CRITICAL**: Guest-to-authenticated migration not addressed — when guest signs up, IndexedDB data has no migration path to planner_saves
- 🔴 **CRITICAL**: No concurrent edit conflict resolution — two browser tabs = last-write-wins = silent data loss
- 🔴 **CRITICAL**: RLS policies mentioned but not specified — unclear if they exist or need creation
- ⚠️ Inconsistency: Section 3 says planner_saves in Supabase Admin, but other docs question which DB it's in
- ⚠️ Admin service role key marked "Critical" but no prevention mechanism beyond code review

### 06-TESTING.md Critical Gaps
- 🔴 **CRITICAL**: No test for guest→auth data migration (critical user flow untested)
- 🔴 **CRITICAL**: No concurrent save conflict test
- 🔴 **CRITICAL**: No planner_saves RLS policy test (can user A read user B's saves?)
- ⚠️ Missing: No load testing specs for canvas with 100+ furniture items
- ⚠️ Missing: No test for partial save failures (what if thumbnail upload fails mid-save?)

### 09-PHASE0-STATUS.md Critical Gaps
- 🔴 **CRITICAL**: planner_saves marked BLOCKED but no unblocking criteria specified
- ⚠️ Missing: No verification gate for "Jest is fixed" — what does "fixed" mean? All tests green? Import resolution works?
- ⚠️ Missing: No rollback plan if Phase 0 fixes break existing functionality

### 10-MIGRATION-PHASES.md Critical Gaps
- 🔴 **CRITICAL**: No rollback procedures per phase — what if Phase 2 migration breaks production?
- 🔴 **CRITICAL**: Dual-write race not addressed — `app/api/plans/route.ts` writes to Supabase planner_saves while `plannerPersistence.ts` writes to Drizzle plans table
- ⚠️ Missing: No data migration verification tests (how do we prove Phase 3 module moves don't lose data?)
- ⚠️ Missing: No timeline estimates — phases could take weeks or months?

---

## 4. Technical Architect Suggestions

### High-Impact Technical Improvements

1. **`import "server-only"` at DB entry points** (05-BACKEND-AND-DATA.md)
   - Add to `platform/drizzle/db.ts` and `platform/supabase/auth-admin.ts`
   - **Why**: Next.js 14 throws build error if these enter client bundles; prevents admin key leak structurally

2. **Branded DB Client Types** (05-BACKEND-AND-DATA.md, 10-MIGRATION-PHASES.md)
   - `type DrizzleClient = typeof db & { _brand: 'drizzle' }`
   - `type AdminDbClient = SupabaseClient & { _brand: 'admin' }`
   - `type CatalogDbClient = SupabaseClient & { _brand: 'catalog' }`
   - **Why**: Makes passing wrong client a compile error, not runtime/code-review finding; zero runtime cost

3. **Resolve Dual-Write Race IMMEDIATELY** (10-MIGRATION-PHASES.md)
   - `app/api/plans/route.ts` → Supabase planner_saves
   - `plannerPersistence.ts` → Drizzle plans table
   - **Why**: Authenticated saves go to TWO databases with no coordination; high data loss risk

4. **planner_saves Schema Codegen from TypeScript** (05-BACKEND-AND-DATA.md)
   - Write column types in TS (`PlannerSavesRow`), generate SQL migration from type
   - **Why**: Current risk is schema-code drift; TS type becomes source of truth

5. **`AsyncSlice<T>` Pattern for Zustand** (06-TESTING.md, 02-PLANNER.md)
   - All async state uses discriminated union: `{ status: 'idle' | 'loading' | 'success' | 'error'; data?: T; error?: string }`
   - **Why**: Eliminates `loading && error` impossible states; makes testing deterministic

6. **Jest Fix Verification Checklist** (06-TESTING.md)
   - ✅ Old monorepo paths removed from roots
   - ✅ `@/components/draw/*` alias resolved
   - ✅ Setup files found
   - ✅ At least one test file runs without import errors
   - **Why**: "Jest fixed" is vague; this makes it testable

---

## 5. Product Strategy Gaps

### Strategic Positioning Weaknesses

#### No B2B Designer Workflow Differentiation (07-CAPABILITY-MATRIX.md)
- **Gap**: All users treated identically — no separate features for architects/interior designers vs homeowners
- **Impact**: Indian interior design is heavily intermediated; designers expect professional tools (layer management, client presentation modes, multi-project workspaces)
- **Risk**: Oando positions as consumer toy, not B2B sales tool; limits deal size and recurring revenue from highest-intent segment
- **Recommendation**: Add "Professional" tier with design-firm features

#### No Showroom/Dealer Integration Strategy (07-CAPABILITY-MATRIX.md)
- **Gap**: Zero mention of connecting digital plans to physical showrooms or dealer inventory
- **Impact**: Indian furniture market runs on showroom networks; planner that can't filter by showroom inventory or generate showroom appointments is disconnected from physical sales
- **Risk**: Tool becomes decoration, not sales driver
- **Recommendation**: Add showroom mode section to capability matrix; dealer dashboard to ops portal

#### No Monetization Beyond Furniture Sales (03-QUALITY-LEDGER.md)
- **Gap**: Quality ledger measures product quality but not revenue drivers
- **Impact**: No premium tier, no designer subscription, no upsells beyond initial quote
- **Risk**: Single transaction model; no recurring revenue; low LTV
- **Recommendation**: Add monetization strategy section; measure conversion funnel, not just quality

#### Missing Conversion Funnel Metrics (01-SITE-UI.md)
- **Gap**: Site UI plan has no conversion measurement — homepage → planner → guest → quote submission
- **Impact**: Can't measure if UI changes improve conversions
- **Risk**: Optimizing for beauty, not business outcomes
- **Recommendation**: Add conversion funnel acceptance criteria to 01-SITE-UI.md

---

## Priority Action Items

### P0 (Fix before any new feature work)
1. Resolve dual-write race (Drizzle plans vs Supabase planner_saves)
2. Add `import "server-only"` to DB modules
3. Document planner_saves RLS policies
4. Add guest→auth migration path
5. Add concurrent save conflict handling

### P1 (Required for launch)
6. Create branded DB client types
7. Document interaction states in design system
8. Add mobile touch gesture specs to planner
9. Add B2B designer tier to capability matrix
10. Add showroom integration strategy
11. Define conversion funnel metrics

### P2 (Post-launch differentiation)
12. Implement monsoon analyzer
13. Implement gateway fit check
14. Implement EMI calculator
15. Implement showroom kiosk mode
16. Add Jest fix verification checklist
