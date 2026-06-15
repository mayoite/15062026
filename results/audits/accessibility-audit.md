# Accessibility Audit

**Date:** 2025-07-01
**Scope:** components/, app/(site)/, features/planner/
**Method:** Static code analysis + test infrastructure review

---

## Summary

The codebase demonstrates generally strong accessibility practices, especially in the planner feature (comprehensive ARIA, focus traps, keyboard navigation). However, several issues were identified ranging from missing alt text to a backdrop div lacking proper semantics.

---

## P1 — Critical

### 1. Empty alt on meaningful category images

**File:** `components/home/CategoryGrid.tsx:52`

```tsx
<CategoryImage src={flagshipImage} alt="" />
```

**Issue:** Each category card displays a product image that conveys meaning (it represents the category). An empty `alt=""` marks it as decorative, but it is the primary visual cue for the card. Screen readers will skip it entirely, leaving the card purpose unclear.

**Fix:** Pass category name as alt, e.g. `alt={categoryName}`.

---

### 2. Backdrop div with onClick but no role/keyboard access

**File:** `features/planner/editor/templates/TemplatePickerModal.tsx:70`

```tsx
<div className="absolute inset-0 bg-black/30" onClick={onClose} />
```

**Issue:** This overlay closes the modal on click but has no `role`, no `aria-label`, and no keyboard handler. Keyboard-only users cannot activate it (though Escape works via the focus trap). Axe/WCAG 4.1.2 requires interactive elements to be keyboard-accessible.

**Fix:** Add `aria-hidden="true"` to the backdrop (since Escape key and the explicit Close button already provide keyboard-accessible dismissal), or convert to a `<button>` element.

---

## P2 — Moderate

### 3. Planner CatalogTile uses div[role="button"] — missing Space key

**File:** `features/planner/catalog/CatalogSidebar.tsx:261-272`

```tsx
<div
  onClick={() => onItemClick(item)}
  onKeyDown={(e) => { if (e.key === "Enter") onItemClick(item); }}
  tabIndex={0}
  role="button"
  aria-label={`Add ${item.name} to canvas`}
>
```

**Issue:** WCAG requires elements with `role="button"` to respond to both Enter AND Space keys. Only Enter is handled.

**Fix:** Add `if (e.key === " ") { e.preventDefault(); onItemClick(item); }`

---

### 4. Accessibility test not included in Playwright config

**File:** `playwright.config.ts:4` / `tests/accessibility.spec.ts`

**Issue:** The Playwright config sets `testDir: './tests/e2e'` but `accessibility.spec.ts` lives in `tests/` (root level). The test will NOT run in normal `npx playwright test` execution. `@axe-core/playwright` is installed but effectively dead code.

**Fix:** Either move the file to `tests/e2e/accessibility.spec.ts` or update `playwright.config.ts` testDir to `'./tests'`.

---

## P3 — Low / Best Practice

### 5. Hero background image uses alt="" (acceptable)

**File:** `components/home/Hero.tsx`

The Hero component correctly marks its background `<Image>` with `alt="" aria-hidden="true"` — this is correct for purely decorative background images. **No action needed.**

---

### 6. VisualIVR Back/Start Over buttons — icon aria-hidden

**File:** `components/support/VisualIVR.tsx`

```tsx
<button onClick={handleBack}><ArrowLeft /> Back</button>
<button onClick={handleReset}>Start Over</button>
```

**Issue:** These buttons DO have visible text content so they have an accessible name. The SVG icon should carry `aria-hidden="true"` (lucide provides this by default). **Low priority — likely already handled.**

---

### 7. Collections/Projects images rely on generic alt

**Files:**
- `components/home/Collections.tsx`
- `components/home/FeaturedCarousel.tsx:118` (`alt={product.name}`)
- `components/home/Projects.tsx`

These use the product/project name as alt text which is acceptable but could be more descriptive (e.g. "Photo of DeskPro workstation"). Low priority.

---

## Positive Findings

| Area | Quality |
|------|---------|
| Planner modal focus trap + Escape | Excellent |
| Planner tool rail aria-label, aria-pressed | Excellent |
| Planner mobile dock aria-pressed + nav landmark | Excellent |
| FAQ accordion aria-expanded/aria-controls | Excellent |
| Featured carousel keyboard arrow navigation | Excellent |
| Homepage hero progress dots with aria-label | Good |
| Form inputs in ContactTeaser, Newsletter, Header | All have ids + labels |
| Reviews form | Proper label[htmlFor] associations |

---

## jest-axe Status

`jest-axe` is **NOT** installed. The project uses `@axe-core/playwright` (Playwright-based, not Jest-based). The Playwright accessibility test exists but is **unreachable** due to testDir mismatch (see P2 item 4).

---

## Recommendations (prioritized)

1. **Move** `tests/accessibility.spec.ts` into `tests/e2e/` so axe actually runs
2. **Fix** CategoryGrid empty alt (P1 — affects all homepage visitors using AT)
3. **Fix** TemplatePickerModal backdrop semantics (P1 — planner users)
4. **Add** Space key to CatalogTile div[role="button"] (P2)
5. **Consider** adding more axe tests for other key pages (/products, /contact)
