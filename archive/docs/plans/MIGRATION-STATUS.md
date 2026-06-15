# Phase 2 Migration Status

*Created: 2026-06-11*

## Executive Summary

**Current State**: 176 active imports use legacy paths (@/features/oando-planner, @/features/buddy-planner)

**Blocker Identified**: Many modules referenced in legacy folders don't exist in canonical `features/planner/` yet. This prevents complete Phase 2 migration.

**Recommended Path**: Incremental migration - move what exists, document blockers, then migrate missing modules.

## What CAN Migrate Now

### Store/Data Modules (✅ Canonical equivalents exist)
- `@/features/oando-planner/data/plannerStore` → `@/features/planner/store/plannerStore`
- `@/features/oando-planner/data/aiStore` → `@/features/planner/store/aiStore`
- `@/features/oando-planner/data/catalogData` → `@/features/planner/store/catalogData`
- `@/features/oando-planner/data/favoritesStore` → `@/features/planner/store/favoritesStore`
- `@/features/oando-planner/data/toastStore` → `@/features/planner/store/toastStore`
- `@/features/oando-planner/data/versionStore` → `@/features/planner/store/versionStore`
- `@/features/oando-planner/lib/projectIndex` → `@/features/planner/lib/projectIndex`
- `@/features/oando-planner/r3f/presets` → `@/features/planner/lib/lightingPresets`

**Impact**: ~60-70% of imports in features/oando-planner/ui/editor/ and export/ modules

### Shared Auth Dependencies (✅ Can redirect to proper locations)
- `@/features/buddy-planner/lib/supabase` → `@/lib/supabase/client`
- `@/features/buddy-planner/types/auth` → `@/lib/auth/types` (after moving types)
- `@/features/buddy-planner/components/ui` → `@/features/shared/ui`
- `@/features/buddy-planner/lib/useDocumentTitle` → `@/lib/hooks/useDocumentTitle`

**Impact**: Breaks features/shared → buddy-planner dependency cycle (Plan 05 line 143)

## What CANNOT Migrate Yet (Missing from Canonical)

### Missing Lib Modules in oando-planner
- `lib/aiService` - AI assistant integration
- `lib/export/boqGenerator` - BOQ generation (partially exists but different)
- `lib/export/exportPDF`, `exportSVG`, `exportBOQ`, `exportPNG` - Export utilities
- `lib/quoteSubmission` - Quote submission logic
- `lib/quoteEngine` - Quote calculation
- `lib/quoteConfig` - Quote configuration
- `lib/shareProject` - Project sharing
- `lib/aiActionGuard` - AI validation
- `lib/plannerSavedProjectVersions` - Version management
- `lib/featureFlags` - Feature flag system

### Missing Modules in buddy-planner
- `lib/auditRepository` - Audit logging (used by app/api/audit/route.ts)
- `lib/smartWizard` - Smart configurator (used by app/api/configurator/smart-wizard/route.ts)
- `lib/schema/projectSchema` - Project validation schema
- Various stores: `uiStore`, `projectStore`, `elementsStore`, `guestAccessStore`, `canvasStore`
- Many hooks and utilities

### Missing Components
- `@/features/oando-planner/ui/editor/*` - Most editor components don't have canonical equivalents
- `@/features/buddy-planner/components/editor/*` - Buddy editor components

## Migration Plan

### Step 1: Migrate Available Store/Data Imports (Immediate)
**Files to update**: ~40 files in features/oando-planner/
**Risk**: Low - canonical modules verified to exist
**Validation**: TypeScript errors should decrease

### Step 2: Break Shared Auth Cycle (Immediate)
**Files to update**: 6 files in features/shared/auth/
**Risk**: Low - moving to standard locations
**Validation**: Import cycle broken, no shared → feature imports

### Step 3: Move Missing Modules to Canonical (Phase 3 Work)
**Required before full migration**:
1. Move/consolidate lib/export utilities
2. Move/consolidate quote system modules
3. Move/consolidate AI service modules
4. Decide on buddy-planner module fate (integrate or deprecate)

### Step 4: Update Remaining Imports (After Step 3)
**Files**: ~130 remaining imports
**Depends on**: Completing module consolidation

### Step 5: Archive Legacy Folders (Phase 5)
**Only after**: All active imports migrated and verified

## Recommendation

Execute Steps 1-2 immediately (what CAN migrate). This will:
- Reduce legacy imports by ~40%
- Break the documented shared auth dependency cycle
- Prove the migration pattern works
- Surface any integration issues early

Then proceed with Step 3 (moving missing modules) as separate focused tasks.

## Files Requiring Immediate Update

### Store/Data Import Updates (~40 files):
```
features/oando-planner/ui/editor/AIAssistantPanel.tsx
features/oando-planner/ui/editor/AutoSaveIndicator.tsx
features/oando-planner/ui/editor/AutoArrangeTool.tsx
features/oando-planner/ui/editor/EditorTopBar.tsx
features/oando-planner/ui/editor/ContextMenu.tsx
features/oando-planner/ui/editor/BOQPanel.tsx
features/oando-planner/ui/editor/LightingPresetControl.tsx
features/oando-planner/ui/editor/FurnitureCatalog.tsx
features/oando-planner/ui/editor/ProjectManagerModal.tsx
features/oando-planner/ui/editor/MaterialPresetControl.tsx
features/oando-planner/ui/editor/TagEditor.tsx
features/oando-planner/ui/editor/ZonePlanningTool.tsx
features/oando-planner/ui/editor/SpacingOverlay.tsx
features/oando-planner/ui/editor/WorkstationClusterTool.tsx
features/oando-planner/ui/editor/RoomTypeSuggestions.tsx
features/oando-planner/ui/editor/QuoteSummaryPanel.tsx
features/oando-planner/ui/editor/RightPanel.tsx
features/oando-planner/ui/editor/useEditorTopBarActions.ts
features/oando-planner/ui/editor/PropertiesPanel.tsx
features/oando-planner/ui/editor/ToastContainer.tsx
features/oando-planner/ui/editor/ToolbarMobile.tsx
features/oando-planner/dashboard/DashboardClient.tsx
features/oando-planner/lib/export/boqGenerator.ts
features/oando-planner/lib/export/exportPNG.ts
features/oando-planner/lib/export/exportPDF.ts
features/oando-planner/lib/export/exportSVG.ts
features/oando-planner/ui/editor/IntegrationsPanel.tsx
features/oando-planner/ui/editor/editorTopBarData.ts
(and more...)
```

### Shared Auth Updates (6 files):
```
features/shared/auth/lib/session.ts
features/shared/auth/lib/AuthProvider.tsx
features/shared/auth/components/AuthShell.tsx
features/shared/auth/components/LoginPage.tsx
features/shared/auth/components/SignupPage.tsx
features/shared/auth/components/ResendVerificationButton.tsx
```

## Next Actions

1. Confirm approach with team
2. Execute Step 1: Update store/data imports batch
3. Execute Step 2: Break shared auth cycle
4. Run typecheck and verify reduction in errors
5. Document Step 3 module migration requirements
6. Proceed with missing module consolidation
