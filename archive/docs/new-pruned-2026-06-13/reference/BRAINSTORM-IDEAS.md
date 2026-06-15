# Brainstorming Session Ideas

*Created: 2026-06-11 — 5-agent brainstorm after expert review*

## Session Overview

After the 5-expert critique identified gaps in docs/new/, a second session with 5 brainstorming agents generated 30+ fresh product, technical, growth, user research, and DX ideas.

---

## 1. Creative Product Ideas (Designer Agent)

### Implemented in plans:
- **Vastu Compliance Overlay** → Added to 02-PLANNER.md
- **Family Planning Mode ("Sabha View")** → Added to 02-PLANNER.md
- **Room Photo Reference Import** → Added to 02-PLANNER.md
- **Hindi + Regional Language Support** → Added to 02-PLANNER.md

### Not yet added (candidates for future milestones):
- **Material Swatch Confidence Strip** — Physical swatches by mail for high-ticket items
- **"Furniture I saw at my friend's house" search** — Upload photo, AI identifies Oando matches
- **Monsoon-proof material filter** — Humidity-resistant finish badge in catalog
- **Budget slider with real-time BOQ** — Drag slider, planner suggests items that fit budget

---

## 2. Technical Architecture Ideas (Architect Agent)

### Implemented in plans:
- **Branded DB Client Types** → Added to 05-BACKEND-AND-DATA.md
- **`import 'server-only'` at DB entry points** → Added to 05-BACKEND-AND-DATA.md
- **`planner_saves` schema codegen from TypeScript** → Added to 05-BACKEND-AND-DATA.md
- **WhatsApp BOQ Share API** → Added to 05-BACKEND-AND-DATA.md

### Not yet added (high-value technical ideas):
- **`AsyncSlice<T>` typed utility for Zustand** — Discriminated union pattern for all async state
- **Supabase RLS policy test suite** — Verify user can't read other users' planner_saves
- **`PlannerDocument` version adapter tests** — Test v1→v2→v3 schema migrations
- **Tldraw→R3F boundary contract** — Typed adapter layer between 2D shapes and 3D scene

---

## 3. Growth & Monetisation Ideas (Growth Agent)

### Implemented in plans:
- (WhatsApp BOQ Share already listed above)

### High-priority candidates:
- **EMI Calculator Embedded in BOQ** — "₹1,24,000 or ₹5,200/month for 24 months" removes sticker shock
- **Designer Pro B2B Tier** — ₹2,499–₹4,999/month for interior designers: unlimited projects, white-label PDF, commission tracking
- **Showroom Kiosk Mode** — Customer walks into Oando showroom, staff hand them tablet running planner in kiosk mode, design captured, quote emailed
- **Architect/Builder Partnership Program** — Pre-approved layouts for common apartment floor plans (2BHK, 3BHK), builder gets referral fee
- **"Complete this room" upsell** — After placing bed, AI suggests matching nightstand + wardrobe
- **WhatsApp Bot Follow-up** — 24h after BOQ submission, WhatsApp bot asks "Ready to place order?" with one-tap call-scheduling

---

## 4. User Research Ideas (UX Specialist Agent)

### High-confidence pain points identified:

1. **Vastu Compliance** — (already in plans) Families won't approve layouts that violate Vastu; overlay solves this
2. **Family Review Flow** — Spouse/parent approval required; "Send for Approval" generates share link, collects feedback
3. **"Will this fit my doorway?" anxiety** — Door/stair width checker: user enters doorway dimensions, planner flags items that won't fit
4. **Side-by-side layout comparison** — User creates 3 variations, views them in split-screen grid, family votes
5. **Bilingual BOQ output** — PDF shows item names in English + Hindi/regional language
6. **Photo-matched finish selector** — User uploads photo of their existing furniture; AI suggests Oando items with matching finish
7. **Vastu-compliant room templates** — Pre-designed layouts already compliant (bed head east, kitchen southeast, etc.)
8. **Real room photo trace mode** — Upload phone photo, trace walls over it, more accurate than manual measurement

---

## 5. Developer Experience Ideas (DX Expert Agent)

### High-impact DX improvements:

1. **`dev-setup.sh` one-command bootstrap** — Checks Node version, copies .env, runs typecheck, prints error count, tells you Jest is broken upfront
2. **`tools/scripts/count-legacy-imports.ts`** — Greps for legacy imports, outputs count per folder, logs to CSV — makes 176-import progress measurable
3. **"Which DB do I use?" decision tree doc** — Flowchart: user data → Admin DB, catalog → Catalog DB, metadata → DO Postgres
4. **`npm run db:which` interactive CLI** — Asks "What are you storing?" → recommends correct DB + shows example code
5. **Phase 0 automated gate script** — Runs typecheck, counts errors, checks Jest, verifies planner_saves migration exists, outputs red/green checklist
6. **Import boundary ESLint plugin** — Auto-fails if `shared` imports from `features`, if client code imports `auth-admin.ts`
7. **Migration progress dashboard** — Visual HTML page: shows 176→current count, phase completion %, links to blockers

---

## Prioritisation Recommendations

### P0 (Must have before launch):
- Vastu compliance overlay (high differentiation, low effort)
- EMI calculator in BOQ (removes purchase barrier)
- WhatsApp BOQ share (India-market table stakes)
- Hindi/regional language UI (addressable market expansion)
- Branded DB client types + `server-only` imports (prevents critical bugs)
- `dev-setup.sh` + legacy import counter (DX floor-raisers)

### P1 (Competitive advantage):
- Designer Pro B2B tier (revenue stream)
- Family review flow (matches buying behavior)
- Door width checker (trust signal)
- Side-by-side layout comparison (decision confidence)
- Showroom kiosk mode (offline channel)
- `AsyncSlice<T>` pattern (code quality)

### P2 (Future milestones):
- Photo-matched finish selector (AI showcase)
- Architect partnership program (B2B2C channel)
- Material swatch by mail (premium segment)
- Migration progress dashboard (internal tooling)

---

## Integration Status

| Plan File | Brainstorm Ideas Added | Status |
|---|---|---|
| 02-PLANNER.md | 4 ideas (Vastu, Sabha View, Photo Import, Hindi) | ✅ Complete |
| 05-BACKEND-AND-DATA.md | 4 ideas (Branded types, server-only, codegen, WhatsApp) | ✅ Complete |
| 07-CAPABILITY-MATRIX.md | 0 (EMI calculator candidate) | 🔲 Pending |
| 14-UX-PATTERNS.md | 0 (Family review, Door checker candidates) | 🔲 Pending |
| 15-STRATEGIC-GAPS.md | 0 (Designer tier, Kiosk mode candidates) | 🔲 Pending |
| 13-REPO-CLEANUP.md | 0 (dev-setup.sh, import counter candidates) | 🔲 Pending |

**Next step:** Incorporate remaining high-priority ideas into relevant plan files.
