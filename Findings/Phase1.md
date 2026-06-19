# Phase 1: CSS & Foundation

## Goal

Fix all missing CSS utilities and case-sensitive import failures so that later phases have a stable surface to build on. This is the safest phase — zero runtime risk.

## Estimated Time

2–3 hours

## Tasks

### 1.1 Add missing typography utilities

File: `app/css/core/typography/type.css`

Add these two `@utility` declarations at the end of the file (after the existing `tracking-max`):

```css
@utility typ-caption {
  font-family: var(--font-sans);
  font-size: var(--type-small-size);
  font-weight: var(--font-weight-copy-medium);
  letter-spacing: var(--type-letter-label);
  line-height: var(--type-leading-label);
  color: var(--text-body);
}

@utility typ-caption-lg {
  font-family: var(--font-sans);
  font-size: var(--type-body-size);
  font-weight: var(--font-weight-copy-regular);
  letter-spacing: var(--type-letter-copy);
  line-height: var(--type-leading-copy-sm);
  color: var(--text-body);
}
```

**Why:** `typ-caption` is referenced 31 times and `typ-caption-lg` 21 times across `Planner3DViewer.tsx`, `PlannerSessionDialog.tsx`, `ProjectSetupStep.tsx`, and `MobileDrawerSheet.tsx`. Without these utilities, text renders with browser defaults.

### 1.2 Add 3D viewer overlay utilities

File: `app/css/core/planner/planner-overlays.css`

Append these rules at the end of the file (after the existing `pw-status-selection` media query):

```css
/* ── 3D viewer overlay chrome ─────────────────────────────────────────────── */

.planner-workspace .planner-viewer-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-soft);
  background: var(--surface-glass);
  font-size: var(--pw-text-xs);
  font-weight: 600;
  letter-spacing: var(--pw-letter-ui);
  color: var(--text-body);
  backdrop-filter: blur(8px);
}

.planner-workspace .planner-viewer-chip-active {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, var(--surface-glass));
  color: var(--text-strong);
}

.planner-workspace .planner-viewer-surface {
  background: var(--surface-glass);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  padding: 0.75rem 1rem;
  font-size: var(--pw-text-xs);
  color: var(--text-body);
  backdrop-filter: blur(12px);
}
```

**Why:** `Planner3DViewer.tsx` uses these classes for its camera mode buttons, renderer info panel, empty-scene warning, and walk-mode controls. They were defined in the archived CSS but never migrated.

### 1.3 Fix case-sensitive test imports

**File A:** `tests/planner-onboarding-onboardingcoach.test.tsx`

Change line 4:
```diff
- import { OnboardingCoach, OANDO_ONBOARDING_STEPS } from "@/features/planner/onboarding/onboardingcoach";
+ import { OnboardingCoach, OANDO_ONBOARDING_STEPS } from "@/features/planner/onboarding/OnboardingCoach";
```

**File B:** `tests/planner-shared-document-documentbridge.test.ts`

Change line 8:
```diff
- import { captureDocument, restoreDocument, importFromOtherEngine, validateDocument } from "@/features/planner/shared/document/documentbridge";
+ import { captureDocument, restoreDocument, importFromOtherEngine, validateDocument } from "@/features/planner/shared/document/documentBridge";
```

**Why:** Linux file systems are case-sensitive. The tests import lowercase filenames but the actual files are `OnboardingCoach.tsx` (PascalCase) and `documentBridge.ts` (camelCase). This causes `Failed to resolve import` errors on CI.

### 1.4 Verify

Run these commands and confirm they pass:

```bash
npm run typecheck
npm run lint
```

If either fails, fix the errors before marking this phase complete.

## Verification Checklist

- [ ] `typ-caption` `@utility` exists in `type.css`
- [ ] `typ-caption-lg` `@utility` exists in `type.css`
- [ ] `planner-viewer-chip` CSS rule exists in `planner-overlays.css`
- [ ] `planner-viewer-chip-active` CSS rule exists in `planner-overlays.css`
- [ ] `planner-viewer-surface` CSS rule exists in `planner-overlays.css`
- [ ] `tests/planner-onboarding-onboardingcoach.test.tsx` imports `OnboardingCoach` (capital O, capital C)
- [ ] `tests/planner-shared-document-documentbridge.test.ts` imports `documentBridge` (capital B)
- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` exits 0

## What This Unblocks

Phase 2 (3D Viewer Swap) can now use the new CSS classes safely. Phase 5 (tldraw Purge) can run in parallel.