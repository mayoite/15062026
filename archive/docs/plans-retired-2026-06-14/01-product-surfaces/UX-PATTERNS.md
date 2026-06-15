# 14 — UX Patterns

*Created: 2026-06-11 — Loading states, error states, empty states, mobile touch, onboarding, guest mode.*
*Updated: 2026-06-14 — Project setup gate; guest e2e helper.*

## Why This File Exists

Loading, error, empty, mobile, and onboarding patterns are release differentiators — not polish. This doc is the **spec**; the table below is **what ships today**.

---

## Live Implementation Audit (2026-06-14)

| Pattern | Spec | Shipped | Evidence |
|---|---|---|---|
| Project setup gate | Name project before canvas | **Yes** | `ProjectSetupGate.tsx`, `ProjectSetupStep.tsx` |
| Autosave indicator | "Saving…" / "Saved" pill | **Yes** | `PlannerSaveIndicator.tsx`, `usePlannerAutosave` |
| Canvas initial load | Progress / lazy Tldraw | **Partial** | Lazy bundle; no "45/105 catalog" loader |
| Guest → member claim | IndexedDB on signup path | **Partial** | `migrateGuestProjectToMember()` — no post-login banner spec |
| Onboarding overlay | 3 steps, dismissable | **Yes** | `OnboardingCoach` in `PlannerCanvasEnhancements.tsx` |
| Empty canvas | Designed empty state | **Yes** | M1 in `02-PLANNER.md` |
| Save failure banner | Persistent, non-dismissable | **Partial** | `error` status exists; banner UX not verified |
| Mobile bottom sheet properties | < 768 px | **Partial** | 0504 mobile panels imported/compiled; browser viewport audit still needed |
| Guest upgrade banner | After 30 s / first edit | **Not verified** | Spec only |
| Read-only share link | `/planner/share/[token]` | **No** | P2 |
| `AsyncState<T>` in stores | Discriminated unions | **Partial** | `PlannerSaveStatus` union; not all stores |
| Layer/object management | Search/filter/group/select/lock/reorder | **Partial** | 0504-inspired `LayerManagerPanel`; lint + browser UX audit open |
| Blueprint PDF workflow | Multi-page PDF trace controls | **Partial** | PDF import/session/move HUD tests pass; crop/rotate and browser QA open |

Cross-ref capability priority: `07-CAPABILITY-MATRIX.md` (guest funnel **Partial**).

---

## 1. Loading States

Every async operation must have a visible loading indicator.

### Pattern Matrix

| Scenario | Pattern | Component | Shipped? |
|---|---|---|---|
| Page navigation | Skeleton | `<PageSkeleton>` | Site partial |
| Canvas initial load | Progress + count | `<CanvasLoader>` | **Gap** |
| Catalog search | Inline spinner | `aria-busy` on input | Partial |
| Catalog item image | Blur-up LQIP | Next.js `<Image>` | Site catalog |
| Autosave | "Saving…" pill | `PlannerSaveIndicator` | **Yes** |
| AI advisor | Streaming indicator | `AiAdvisorChat` | Partial |
| 3D sync | Fade-in geometry | R3F viewer | Partial |
| BOQ PDF | Progress overlay | Export modal | Partial |
| PDF blueprint import | Loading + validation | `BlueprintPanel` | **Partial** |

### Rules

- Skeletons match final layout; no layout jump spinners on heavy areas
- `aria-busy="true"`, `aria-live="polite"` on dynamic updates
- Min visible duration 150 ms (anti-flicker)

---

## 2. Error States

| Type | Visibility | Shipped? |
|---|---|---|
| Field validation | Inline below input | Contact forms |
| Network timeout | Toast + retry | Partial |
| Canvas operation failure | Non-blocking toast | Partial |
| Save failure | Persistent banner | **Needs audit** |
| Auth expired | Redirect `?next=` | Appwrite flow |
| 404 / 500 | Dedicated pages | `not-found.tsx`, `error.tsx` |
| Catalog load failure | Empty + retry | Partial |

**Rules:** User-facing copy = what happened + what to do next. No stack traces in prod. Technical codes in `<details>`.

---

## 3. Empty States

| Surface | Message + CTA | Shipped? |
|---|---|---|
| Planner canvas (new) | Drag wall/furniture + template CTA | **Yes** (designed empty) |
| Guest local-only warning | "Saved in this browser only" | **Partial** |
| Saved projects list (zero) | CTA new plan | Portal stub |
| Catalog search (zero) | Clear search | Partial |
| BOQ panel (no items) | Add furniture hint | Partial |
| Layer manager (zero/filtered) | Clear search/filter | **Partial** |

---

## 4. Mobile Touch Patterns

| Gesture | Action | Shipped? |
|---|---|---|
| Tap canvas | Select / place | Tldraw default |
| Long press | Context menu | **Gap** |
| One-finger pan (empty) | Pan canvas | Tldraw default |
| Pinch zoom | Zoom | Yes |
| Catalog drag | Place on canvas | Partial on touch |
| Mobile planner drawers | Catalog/layers/properties as sheets | **Partial** via imported mobile panels; needs viewport proof |
| Double-tap wall length | Numeric keyboard | **Gap** |

### Mobile layout (spec)

| Viewport | Layout |
|---|---|
| < 640 px | Canvas full screen; panels as drawers |
| 640–1023 px | Collapsible side panel |
| ≥ 1024 px | Three-panel (catalog \| canvas \| properties) |

**Touch targets:** minimum 44×44 px. Length inputs: `inputmode="numeric"`.

---

## 5. Guest Mode Onboarding

Guest mode (`/planner/guest`) is the primary acquisition funnel.

### Guest rules (spec vs live)

| Rule | Spec | Live |
|---|---|---|
| Full canvas without login wall | Yes | **Yes** |
| IndexedDB only | Yes | **Yes** (`buddy-planner-db` name legacy) |
| Banner after first edit | Subtle persistent | **Not verified** |
| Export → signup prompt | Yes | **Not verified** |
| Claim on member canvas | IndexedDB → member slot | **Yes** + test |
| Server write on signup | `planner_saves` / Drizzle | **Gap** |

### Onboarding sequence (registered user)

1. `/planner` marketing landing — **shipped**
2. "Start planning" → `/planner/canvas` or guest — **shipped**
3. `OnboardingCoach` ≤ 3 steps — **shipped** (`features/planner/onboarding/steps.ts`)
4. Dismiss + never show again — **needs profile persistence audit**

### Coachmarks (progressive)

| Trigger | Message | Shipped? |
|---|---|---|
| Wall tool idle 10 s | "Start here — draw walls" | Partial via coach |
| After first wall | "Drag furniture" | Partial |
| After first shape | Autosave hint | Partial |
| 3+ items | BOQ export hint | **Gap** |

---

## 6. Read-Only Sharing

- `GET /planner/share/[shareToken]` — public, read-only canvas
- No BOQ pricing or PII for viewers
- **Status: Not implemented** (P2)

---

## 7. TypeScript Type Safety for UX State

Use discriminated unions for async UX state:

```typescript
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };
```

**Live:** `PlannerSaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error'` in `usePlannerAutosave.ts`.

---

## 8. Acceptance Criteria

- [x] Autosave visible indicator (planner)
- [x] Empty canvas with guidance (planner)
- [x] Onboarding overlay dismissable (planner)
- [x] Guest IndexedDB claim on member visit
- [ ] Every async surface has loading state
- [ ] Save failure persistent banner verified in browser
- [ ] Mobile bottom sheet properties < 768 px verified in browser
- [ ] Guest banner after first edit
- [ ] Touch targets 44×44 px audit
- [ ] `AsyncState<T>` in all planner store slices
- [ ] Layer manager UX browser audit after lint cleanup
- [ ] Blueprint PDF crop/rotate/large-file QA

## 0504 UX Rationale

The 0504 snapshot is strongest as a UX reference for professional planner affordances: layers, mobile panels, session dialogs, draft recovery, richer 3D controls, and workflow feedback. These are worth porting because they make the planner feel like a serious work tool. They must still be adapted to Oando's current tldraw canvas, flat-root structure, and design tokens so the user sees one planner instead of stitched-together donor UI.

---

## Cross-References

| Topic | Doc |
|---|---|
| M5 onboarding | `02-PLANNER.md` |
| Guest funnel strategy | `15-STRATEGIC-GAPS.md` §4 |
| Test gate | `06-TESTING.md` |
| Homepage UX | `01-SITE-UI.md` |
