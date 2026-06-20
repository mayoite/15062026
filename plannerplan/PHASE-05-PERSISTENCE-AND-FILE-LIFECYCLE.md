# Phase 5 — Persistence and File Lifecycle

## Goal

Guarantee guest work survives refresh and can be saved, named, loaded, renamed, deleted, imported, exported, and migrated safely. No accepted user mutation is ever silently lost.

---

## State ownership (define and document this first)

Before writing any test, document the authoritative data flow. The planner has **two independent persistence layers**:

### Layer 1 — Autosave (IndexedDB, `persistence/persistence.ts`)

```
Fabric canvas (live session)
  └─► exportDraft() → serialized Fabric JSON
        └─► usePlannerFabricAutosave.schedulePersist()
              └─► buildSessionEnvelope(store) → PlannerSessionEnvelope (v2.0.0)
                    └─► createAutoSaver(projectId).scheduleSave(snapshot)
                          └─► saveProject(project) → IndexedDB "planner-workspace-db"."projects"
                          └─► saveHistoryEntry(entry) → IndexedDB "planner-workspace-db"."history"
```

- DB: `planner-workspace-db` (v1), stores: `projects`, `history`
- Guest project ID: `planner-guest-local`
- Member project ID: `planner-member-local` (or `planner-member-local:{planId}`)
- Autosave debounce: 5 000 ms
- History cap: 10 entries per project
- Restore: `loadProject(projectId)` → `parseSessionSnapshot()` → `applySessionWorkspace()` → `importDraft(storeJson)`

### Layer 2 — Named drafts / cloud sessions (`persistence/plannerDraft.ts`, `persistence/plannerSaves.ts`)

```
buildCurrentPlannerDocument() → PlannerDocument
  ├─► savePlannerDraftDocument(doc, scope) → localStorage
  │     key: "cad-suite:planner:draft:v1:user:{userId}:doc:{documentId}"
  │     envelope: { schemaVersion: 1, savedAt, expiresAt, document }
  │     TTL: 24 hours
  │
  └─► savePlannerDocumentToSupabase(supabase, doc, options) → cloud
        └─► savePlanToApi(doc, options) → PUT /api/plans/{id}
```

### Layer 3 — Session management hook (`hooks/usePlannerSession.ts`)

The **main orchestrator** for all save/load/import/export/delete. Manages:
- `handleSaveDraft()` — local draft via `savePlannerDraftDocument`
- `handleSaveCloud()` — cloud via `savePlannerDocumentToSupabase`
- `handleLoadPlan(entry)` — local draft or cloud load
- `handleDeletePlan(entry)` — local or cloud delete
- `handleImportFileChange(event)` — JSON import via `parsePlannerDocumentImportFile`
- `handleExportJson()` — JSON export via `createPlannerExportPayload`
- `handleOpen3d()` — saves draft to `VIEWER_PREVIEW_DRAFT_ID` slot, navigates to `/configurator`
- `handleUpsertManagedProduct()` — admin catalog products (Supabase)
- `handleDeleteManagedProduct()` — admin catalog products (Supabase)
- `syncSessionInventory()` — fetches auth user, role, cloud plans, admin plans, managed products

Auth flow: `getBrowserSessionUser(supabase)` → Supabase `profiles.role` → sets `authRole` (`"customer"` | `"admin"`)

### Guest-to-member migration (`persistence/persistence.ts`)

```
migrateGuestProjectToMember()
  └─► shouldMigrateGuestPlan(guest, member, alreadyClaimed)
        - if claimed (localStorage "planner.guest.claimed" === "1") → skip
        - if no guest snapshot → "no-guest-data"
        - if member has snapshot → "skipped" (never overwrites)
        - else → copy guest→member, markGuestPlanClaimed()
```

Every test must clearly state which layer of this stack it is asserting.

---

## Task checklist

- [ ] **P5-01 State authority:** document the 3-layer stack above in `docs/architecture/DATA_FLOW.md` or as comments. Confirm: autosave uses IndexedDB (`persistence.ts`), named drafts use localStorage (`plannerDraft.ts`), cloud uses Supabase API routes (`plannerSaves.ts` → `plannerCloudApi.ts`).
- [ ] **P5-02 Autosave states:** the `PlannerSaveStatus` type is `"idle" | "unsaved" | "saving" | "saved" | "error"`. Assert UI reflects each state:
  - `idle` → initial, no indicator
  - `unsaved` → dot or "Unsaved changes"
  - `saving` → spinner or "Saving…" (transitions via 5 200 ms timer)
  - `saved` → timestamp "Saved just now"
  - `error` → error indicator with `retrySave()` available
  Use Vitest mocking of `saveProject` (IndexedDB) to simulate failure.
- [ ] **P5-03 Refresh timing:** (a) place one object → wait for autosave debounce (5 s) → refresh → `loadProject(GUEST_PROJECT_ID)` returns the object → restored; (b) place object → refresh before 5 s debounce → object may be lost (document this behavior); (c) restored canvas must not contain duplicate objects.
- [ ] **P5-04 Local draft session save:**
  - `handleSaveDraft()` calls `savePlannerDraftDocument(doc, getDraftScope(LOCAL_CURRENT_DRAFT_ID))`.
  - Scope key: `cad-suite:planner:draft:v1:user:{userId}:doc:planner-local-current`.
  - Envelope includes `expiresAt` (24 h TTL).
  - Quota failure: `savePlannerDraftDocument` returns `null`; `handleSaveDraft` reports status message.
- [ ] **P5-05 Cloud save:**
  - `handleSaveCloud()` requires `isAuthenticated === true` and `supabase !== null`.
  - Calls `savePlannerDocumentToSupabase()` → `savePlanToApi()` → `PUT /api/plans/{id}`.
  - Admin role can save with `accessMode: "admin"` and a different `ownerUserId`.
  - After save: `setPlanName`, `setActiveDocumentId`, calls `syncSessionInventory()` to refresh list.
  - Test: mock Supabase + API; assert `PUT /api/plans/{id}` called with correct body.
- [ ] **P5-06 Session load:**
  - `handleLoadPlan(entry)` — local source: calls `loadPlannerDraftDocument(getDraftScope(id))`.
  - Cloud source: calls `loadPlannerDocumentFromSupabase(supabase, id, options)` → `loadPlanFromApi(id)` → `GET /api/plans/{id}`.
  - Both call `applyPlannerDocument(doc)` on success.
  - Admin mode: `plan.accessMode === "admin"` sets `activeCloudAccessMode`.
  - Missing plan: reports error, canvas unchanged.
- [ ] **P5-07 Session list:**
  - `buildPlannerSavedEntries()` merges: (1) local draft from `loadPlannerDraftDocument`, (2) cloud plans from `listPlannerDocumentsFromSupabase` → `listOwnerPlansFromApi()` → `GET /api/plans`.
  - Admin: also fetches `listAdminPlansFromApi()` → `GET /api/admin/plans?limit=100`.
  - Each entry: `PlannerSavedEntry` with `id`, `name`, `source` ("local"/"cloud"), `accessMode`, `canDelete`, `updatedAtLabel`, `itemCount`, `detail`.
- [ ] **P5-08 Session delete:**
  - Local: `deletePlannerDraftDocument(getDraftScope(id))` — removes localStorage key.
  - Cloud: `deletePlannerDocumentFromSupabase(supabase, id)` → `deletePlanFromApi(id)` → `DELETE /api/plans/{id}`.
  - Admin access mode: blocked ("Admin oversight does not allow browser-side delete").
  - After delete: `syncSessionInventory()` refreshes the list.
- [x] **P5-09 Replacement guard:** `handleLoadPlan` and `handleImportFileChange` now both confirm before calling `applyPlannerDocument()` when `shapeCount > 0 && saveStatus !== 'saved'`. Shows count of unsaved objects. If user cancels, canvas is unchanged.
- [x] **P5-10 Export JSON:** `handleExportJson()` already calls `URL.revokeObjectURL(url)` after `anchor.click()` (PlannerWorkspace.tsx:949). MIME `application/json` set on the Blob. Content-verification test still needed (valid JSON + reimportable). *(test needed)*
- [ ] **P5-11 Import JSON:** `parsePlannerDocumentImportFile(file)` → `parsePlannerDocumentImport(parsed)` → returns `{ ok, document, errors }`. Test: (a) valid → `applyPlannerDocument` called, draft saved; (b) malformed → errors shown, canvas unchanged; (c) wrong schema → errors shown; (d) after successful import, `activeCloudAccessMode` resets to `"owner"`.
- [x] **P5-12 Storage corruption (localStorage layer):** `loadPlannerDraftDocumentAtKey` already handles this. Non-envelope JSON → `status: 'invalid'`, key removed (plannerDraft.ts:165–170). JSON parse failure → `status: 'invalid'`, key removed (plannerDraft.ts:171–177). `cleanupExpiredPlannerDrafts` runs on every `loadPlannerDraftDocument` call (line 240/293). *(unit test still needed)*
- [ ] **P5-13 Storage corruption (IndexedDB layer):** `loadProject()` returns `undefined` on missing records. If IndexedDB `openDB` throws (e.g., Firefox private mode), `loadProject` rejects. Assert: `usePlannerFabricAutosave.restoreSnapshot` catches the error and returns `false`.
- [x] **P5-14 Draft expiry:** `isExpiredDraftEnvelope` checks `expiresAt` (plannerDraft.ts:82–105); expired keys removed immediately (line 151). `cleanupExpiredPlannerDrafts` sweeps all draft keys on every load/save (line 181). TTL = 24 h (`PLANNER_DRAFT_TTL_MS`). *(unit test still needed)*
- [ ] **P5-15 Guest migration:**
  - `migrateGuestProjectToMember()` is called in `restoreSnapshot()` when `guestMode === false`.
  - (a) no guest data → returns `"no-guest-data"`, no IndexedDB write.
  - (b) guest data + empty member → copies `planner-guest-local` snapshot to `planner-member-local`, sets `localStorage "planner.guest.claimed" = "1"`, returns `"migrated"`.
  - (c) guest data + occupied member → returns `"skipped"`, does NOT overwrite member.
  - (d) already claimed → returns `"skipped"` immediately.
  - (e) `saveProject` throws → migration fails but guest data is preserved (not deleted).
  - Use `GuestMigrationPersistence` injection for unit testing.
- [x] **P5-16 Privacy:** confirmed — `plannerDraft.ts` has zero `fetch` or `console.` calls. `persistence.ts` has zero `fetch` or `console.` calls. `plannerCloudApi.ts` is only imported by `plannerSaves.ts` and `usePlannerSession.ts` (verified by source search). Guest autosave path (persistence.ts) never touches network.
- [x] **P5-17 Version migration:** `loadPlannerDraftDocumentAtKey` calls `plannerDocumentSchema.parse(normalizePlannerDocument(parsed.document))` on every load (plannerDraft.ts:159). `normalizePlannerDocument` fills in missing fields. *(fixture test still needed)*
- [ ] **P5-18 Legacy IndexedDB migration:** `migrateLegacyIndexedDbIfNeeded()` copies projects from `buddy-planner-db` to `planner-workspace-db`. Flag: `localStorage "planner.indexeddb.migrated" = "1"`. Test: seed legacy DB, call `openDB()`, assert projects appear in new DB.

---

## Data-loss invariants (assert these in every save/load/import test)

- Validation completes before live state replacement.
- Failed persistence never reports `Saved` (status must remain `error` or `unsaved`).
- Guest claim never overwrites a non-empty member snapshot.
- Delete affects only the selected session (local or cloud).
- Import/export round-trip preserves normalized canonical content.
- Draft TTL (24 h) expiry removes only the expired draft, not others.

---

## API endpoints covered in this phase

| Endpoint | Method | Used by | Auth |
|---|---|---|---|
| `/api/plans` | GET | `listOwnerPlansFromApi()` | Cookie (Supabase session) |
| `/api/plans/{id}` | GET | `loadPlanFromApi(id)` | Cookie |
| `/api/plans/{id}` | PUT | `savePlanToApi(doc)` | Cookie |
| `/api/plans/{id}` | DELETE | `deletePlanFromApi(id)` | Cookie |
| `/api/admin/plans?limit=100` | GET | `listAdminPlansFromApi()` | Cookie (admin role) |

---

## Primary files

- `features/planner/hooks/usePlannerFabricAutosave.ts` — autosave hook (IndexedDB layer)
- `features/planner/hooks/usePlannerSession.ts` — **main session orchestrator** (cloud + local + import/export)
- `features/planner/persistence/persistence.ts` — IndexedDB CRUD, `createAutoSaver`, guest migration
- `features/planner/persistence/plannerDraft.ts` — localStorage named drafts with TTL
- `features/planner/persistence/plannerSaves.ts` — Supabase cloud save/load/list/delete
- `features/planner/persistence/plannerCloudApi.ts` — raw API fetch calls to `/api/plans`
- `features/planner/persistence/plannerImport.ts` — import validation
- `features/planner/persistence/plannerSession.ts` — session envelope builder/parser
- `features/planner/persistence/cloudPlanHydration.ts` — cloud plan → IndexedDB hydration for `?id=` URLs
- `features/planner/lib/sessionState.ts` — `LOCAL_CURRENT_DRAFT_ID`, `VIEWER_PREVIEW_DRAFT_ID`, export payload
- `features/planner/ui/PlannerSessionDialog.tsx`
- `features/planner/model/` (schema, normalize)
- `tests/unit/planner-guestToAuthMigration.test.ts`
- `tests/unit/planner-persistence.test.ts` ← create if absent

---

## Required tests

- Unit: `shouldMigrateGuestPlan()` — all 5 cases using `GuestMigrationPersistence` injection.
- Unit: `savePlannerDraftDocument` scope-key isolation (user-scoped vs unscoped).
- Unit: `cleanupExpiredPlannerDrafts` removes only expired entries.
- Unit: `parsePlannerDocumentImportFile` with valid/malformed/wrong-schema fixtures.
- Unit: `normalizePlannerDocument` fills in missing fields from fixture data.
- Integration: `createAutoSaver.scheduleSave` → `saveProject` called with correct projectId after debounce.
- Integration: `usePlannerSession.handleSaveCloud` → mock Supabase → assert `PUT /api/plans/{id}` body.
- Integration: `handleImportFileChange` with valid file → `applyPlannerDocument` called.
- E2E: place object → wait 6 s → refresh → restored (IndexedDB autosave).
- E2E: session dialog: save draft, load, rename, delete.
- E2E: download JSON → upload JSON → canvas matches.
- E2E: guest migration (empty member, occupied member).

---

## Exit gate

No accepted user mutation is lost in normal refresh. Every destructive or replacement operation is deliberate, validated, recoverable, and covered by a round-trip test. All 6 data-loss invariants are asserted by an automated test.
