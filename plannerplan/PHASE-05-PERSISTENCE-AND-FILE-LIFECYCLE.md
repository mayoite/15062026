# Phase 5 - Persistence and File Lifecycle

## Goal

Guarantee guest work survives refresh and can be saved, named, loaded, renamed, deleted, imported, exported, and migrated safely.

## Functional audit

- Autosave states: idle, saving, saved, failed, retrying, unavailable.
- Refresh after each mutation type and refresh during a pending save.
- Current draft versus named sessions; save, save-as-new, load, rename, delete, cancel.
- Duplicate names, blank names, long names, deleted current session, and storage quota failure.
- JSON export content, filename, schema/version, metadata, geometry, catalog references, and blueprint state.
- JSON import: valid current version, older version, malformed JSON, wrong product document, missing fields, huge file, and duplicate document ID.
- Offline IndexedDB/localStorage behavior, private-mode denial, corrupted records, and migration.
- Guest-to-member migration: no guest data, empty member, occupied member, repeated migration, and failed write.

## Task checklist

- [ ] **P5-01 State authority:** document Fabric runtime -> canonical document -> IndexedDB/local-session ownership and timing.
- [ ] **P5-02 Autosave:** idle/saving/saved/failure/retry states and rapid mutation coalescing.
- [ ] **P5-03 Refresh timing:** refresh after each mutation and during pending serialization/write.
- [ ] **P5-04 Session create/save:** current draft, save-as-new, duplicate name, invalid name and quota failure.
- [ ] **P5-05 Session manage:** list, select, load, rename, delete, cancel and deleted-current behavior.
- [ ] **P5-06 Replacement guard:** load/import/reset with dirty state follows an explicit confirm/cancel policy.
- [ ] **P5-07 Export JSON:** schema, version, metadata, geometry, references, filenames and MIME.
- [ ] **P5-08 Import JSON:** valid, old version, malformed, wrong schema, missing fields, large file and duplicate ID.
- [ ] **P5-09 Transactionality:** failed parse/normalize/load leaves live plan and persisted draft unchanged.
- [ ] **P5-10 Storage corruption:** malformed localStorage/IndexedDB records are isolated and recoverable.
- [ ] **P5-11 Offline/private mode:** denied APIs and offline reload provide explicit status without crash.
- [ ] **P5-12 Guest claim:** empty/occupied member, no guest data, failed copy and idempotent repeat.
- [ ] **P5-13 Privacy:** guest data remains local unless the user explicitly authorizes migration/cloud behavior.
- [ ] **P5-14 Versioning:** migration fixtures cover every supported document version.

## Data-loss invariants

- Validation finishes before live state replacement.
- Failed persistence never reports `Saved`.
- Guest claim never overwrites a nonempty member document.
- Delete affects only the selected named session.
- Import/export round-trip preserves normalized canonical content.

## Work

1. Define one source of truth between Fabric runtime, planner document, IndexedDB, and named local sessions.
2. Make every persistence failure visible and non-destructive.
3. Ensure load/import is transactional: parse and validate before replacing live state.
4. Add explicit conflict behavior when current unsaved state would be replaced.
5. Verify guest data is not uploaded or cloud-saved unexpectedly; current UI intentionally disables cloud save.
6. Preserve forward-compatible unknown fields where the schema requires it.
7. Test version migration and idempotency.

## Primary files

- `features/planner/hooks/usePlannerFabricAutosave.ts`
- `features/planner/persistence/`
- `features/planner/store/offlineStorage.ts`
- `features/planner/ui/PlannerSessionDialog.tsx`
- `features/planner/lib/fabricDocumentBridge.ts`
- `features/planner/model/`
- `tests/unit/planner-guestToAuthMigration.test.ts`

## Required tests

- Unit tests for parsers, schemas, migration, scope keys, and quota errors.
- Integration tests for transactional load/import and autosave recovery.
- E2E session CRUD, refresh restore, download/upload round-trip, offline reload, and guest migration.
- Compare normalized document before export and after import.

## Exit gate

No accepted user mutation is lost in normal refresh, and every destructive or replacement operation is deliberate, validated, recoverable, and covered by a round-trip test.
