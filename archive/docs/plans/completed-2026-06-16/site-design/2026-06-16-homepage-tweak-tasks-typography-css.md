# Homepage tweak — Tasks 3–4 (Typography + CSS)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development for every task. Use superpowers:dispatching-parallel-agents to run Task 3 (Agent B) and Task 4 (Agent C) in parallel with Task 1–2 (Agent A). Use superpowers:writing-plans for plan structure.

**Goal:** Finish Wave 2 typography class swaps and homepage CSS dedup/fallback sync on `/` per [`plans/HOMEPAGE-LAYOUT-TYPOGRAPHY.md`](../../HOMEPAGE-LAYOUT-TYPOGRAPHY.md) and [`README.md`](./README.md).

**Status (2026-06-16):** Tasks complete (per sub CONTENTS + parent update). Verifications passed.

**Architecture:** Eight sections in [`app/(site)/page.tsx`](../../../app/(site)/page.tsx). Typography uses shared `@utility typ-*` from [`app/css/core/typography/type.css`](../../../app/css/core/typography/type.css) (read-only). Homepage fallbacks live in [`app/css/core/site/routes/home/type-fallback.css`](../../../app/css/core/site/routes/home/type-fallback.css) and [`layout-fallback.css`](../../../app/css/core/site/routes/home/layout-fallback.css). Bundle: [`app/css/core/site/bundles/homepage.css`](../../../app/css/core/site/bundles/homepage.css).

**Tech Stack:** Next.js App Router, TypeScript strict, Tailwind v4 `@utility`, Vitest 4, Playwright.

**Constraints**

- Do **not** edit [`app/css/core/tokens/theme.css`](../../../app/css/core/tokens/theme.css) or [`app/css/core/typography/type.css`](../../../app/css/core/typography/type.css).
- **Skip ContactTeaser** — Wave 2 only (24-route blast radius).
- Agent B edits **inner** `className` on headings/links/labels only — not section wrappers (Agent A owns those).
- Agent C edits **CSS only** — no TSX except verify-only steps on already-landed markup.

**Parallel hunk boundary (shared files)**

| File | Agent A (Task 1–2) | Agent B (Task 3) | Agent C (Task 4) |
|------|-------------------|------------------|------------------|
| `TrustStrip.tsx` | `<section>` class, shell, border | KPI value/label classes | — |
| `Collections.tsx` | — | — | Toolbar `items-center` + browse link layout (verify) |
| `ShowcaseCarousel.tsx` | — | Browse link + slide title classes | — |

---

## Task 3 — Typography class swaps (Agent B)

**Branch:** `homepage-v2/typography-tsx`  
**ID:** `swap-component-classes`  
**Depends on:** nothing (rebase before edit per `AGENTS.md`)  
**Blocks:** Task 4 `remove-bespoke-type-css` (delete CSS utilities only after TSX stops referencing them)

**Allowed font weights on `/` after:** `300`, `400`, `500`, `700` only.

### Step 3.1 — Rebase and scope check

- [ ] **3.1.1** Rebase onto latest `homepage-v2` (or `main` if that is the integration branch).
- [ ] **3.1.2** Confirm diff touches only files listed in §3.6 — no `ContactTeaser.tsx`, no `contact-teaser.css`, no `theme.css`, no `type.css`.

```powershell
git status
git diff --name-only
```

### Step 3.2 — `PartnershipBanner.tsx` (verify only)

**File:** [`components/home/PartnershipBanner.tsx`](../../../components/home/PartnershipBanner.tsx)

Target: H2 `typ-subsection-title` → `home-heading`.

- [ ] **3.2.1** Confirm H2 already uses `home-heading` (landed). No edit required unless regression found.

**Current (correct):**

```tsx
<h2 className="home-heading">
  <span className="text-[color:var(--color-ocean-boat-blue-900)]">{title[0]}</span>{" "}
  <span className="text-accent-italic">{title[1]}</span>
</h2>
```

### Step 3.3 — `ShowcaseCarousel.tsx` (browse link + slide titles)

**File:** [`components/home/ShowcaseCarousel.tsx`](../../../components/home/ShowcaseCarousel.tsx)

| Element | Current | Target |
|---------|---------|--------|
| Browse link | `home-showcase-browse-link` + `typ-cta` (partial) | Keep layout class + `typ-cta` |
| Slide name | `home-showcase-card__title` | `typ-overlay-title text-inverse` |

- [ ] **3.3.1** Verify browse `Link` retains `typ-cta` (already at line 131):

```tsx
<Link href={browseLink} className={`${browseLinkClass} typ-cta`}>
```

- [ ] **3.3.2** Replace slide title class on the `<h3>` inside the carousel map (~line 161):

**Before:**

```tsx
<h3 className="home-showcase-card__title">{item.name}</h3>
```

**After:**

```tsx
<h3 className="typ-overlay-title text-inverse">{item.name}</h3>
```

- [ ] **3.3.3** Grep confirms zero remaining `home-showcase-card__title` in TSX:

```powershell
rg "home-showcase-card__title" components/
```

Expected: no matches.

### Step 3.4 — `TrustStrip.tsx` (KPI value weight + label)

**File:** [`components/home/TrustStrip.tsx`](../../../components/home/TrustStrip.tsx)

| Element | Current | Target |
|---------|---------|--------|
| KPI value | `typ-stat text-primary` | same class; weight `300` via utility (not `350`) |
| KPI label | `stats-block__label mt-2` | `typ-label mt-2` · `12px` / `500` |

- [ ] **3.4.1** Keep KPI value markup — `typ-stat` already maps to `var(--font-weight-display-light)` (`300`) in `type.css`:

```tsx
<p className="typ-stat text-primary">{value}</p>
```

- [ ] **3.4.2** Swap label class (~line 51):

**Before:**

```tsx
<p className="stats-block__label mt-2">{label}</p>
```

**After:**

```tsx
<p className="typ-label mt-2">{label}</p>
```

- [ ] **3.4.3** Do **not** edit the `<section>` wrapper, shell, or `scheme-panel` cells — Agent A owns layout hunks.

### Step 3.5 — `InteractiveTools.tsx` (card title + link)

**File:** [`components/home/InteractiveTools.tsx`](../../../components/home/InteractiveTools.tsx)

| Element | Current | Target |
|---------|---------|--------|
| Card title | `home-tool-heading--dark` | `typ-h3 text-inverse` · display · `400` |
| Card link | `home-tool-link home-tool-link--dark` | add `typ-cta`; keep layout/color modifiers |

- [ ] **3.5.1** Replace card title (~line 49):

**Before:**

```tsx
<h3 className="home-tool-heading--dark">{tool.title}</h3>
```

**After:**

```tsx
<h3 className="typ-h3 text-inverse">{tool.title}</h3>
```

- [ ] **3.5.2** Add `typ-cta` to Launch link (~line 51):

**Before:**

```tsx
<span className="home-tool-link home-tool-link--dark group-hover:gap-2">
```

**After:**

```tsx
<span className="home-tool-link home-tool-link--dark typ-cta group-hover:gap-2">
```

- [ ] **3.5.3** Grep confirms zero `home-tool-heading--dark` in home components:

```powershell
rg "home-tool-heading--dark" components/home/
```

Expected: no matches.

### Step 3.6 — Verify-only (already landed — do not re-edit)

- [ ] **3.6.1** [`components/home/Collections.tsx`](../../../components/home/Collections.tsx) — card title already `typ-overlay-title text-inverse` (~line 100). **Keep.**
- [ ] **3.6.2** [`components/home/WhyChooseUs.tsx`](../../../components/home/WhyChooseUs.tsx) — card titles already `typ-h3` (~line 69). **Keep.**

### Step 3.7 — Agent B verification

```powershell
npm.cmd run typecheck
```

- [ ] **3.7.1** `typecheck` passes (or only pre-existing unrelated failures documented in `docs/Failures.md`).

```powershell
npx next dev --webpack
```

Hard refresh `http://localhost:3000/`:

- [ ] **3.7.2** Showcase slide names use overlay scale: `clamp(1.25rem, 1.1rem + 0.7vw, 1.75rem)` at weight `300`.
- [ ] **3.7.3** Showcase browse link renders at `16px` / weight `500` (`typ-cta`).
- [ ] **3.7.4** Trust KPI values render at weight `300` (DevTools → computed `font-weight: 300`).
- [ ] **3.7.5** Trust KPI labels render at `12px` / weight `500` (`typ-label`).
- [ ] **3.7.6** Tools card titles match Why card title scale (`typ-h3`).
- [ ] **3.7.7** Tools “Launch” links render at `16px` / weight `500`.

### Task 3 files (exclusive ownership)

| Path | Action |
|------|--------|
| `components/home/PartnershipBanner.tsx` | Verify `home-heading` |
| `components/home/ShowcaseCarousel.tsx` | Slide title → `typ-overlay-title text-inverse` |
| `components/home/TrustStrip.tsx` | Label → `typ-label` |
| `components/home/InteractiveTools.tsx` | Title → `typ-h3 text-inverse`; link → add `typ-cta` |

**Forbidden:** any `app/css/**` edits (Agent C scope).

---

## Task 4 — CSS fallbacks, toolbar, tool cards (Agent C)

**Branch:** `homepage-v2/css-dedup`  
**IDs:** `sync-fallbacks`, `fix-invalid-weights`, `remove-bespoke-type-css`, `fix-tools-card-alignment`, `fix-collections-toolbar`  
**Depends on:** Task 3 merged or rebased (so deleted CSS utilities are unreferenced)  
**Blocks:** Task 5 integration gates (Agent D)

### Step 4.1 — Rebase and grep baseline

- [ ] **4.1.1** Rebase onto branch with Task 3 TSX swaps applied.
- [ ] **4.1.2** Record invalid-weight locations before edits:

```powershell
rg "font-weight:\s*350" app/css/core/site/routes/home/
```

Expected hits (remove all):

- `app/css/core/site/routes/home/base.css` — `.home-stats-value` (~line 390)
- `app/css/core/site/routes/home/sections.css` — `.home-planner-suite-metric__value` (~line 382)
- `app/css/core/site/routes/home/type-fallback.css` — `.home-planner-suite-metric__value` (~line 146)

### Step 4.2 — `base.css` — tool link alignment + weight cleanup

**File:** [`app/css/core/site/routes/home/base.css`](../../../app/css/core/site/routes/home/base.css)

- [ ] **4.2.1** Confirm `@utility home-tool-link` keeps `margin-top: auto` (~lines 580–588). **Already present — do not remove.**

```css
@utility home-tool-link {
  margin-top: auto;
  padding-top: 1.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  transition: gap var(--motion-fast) var(--ease-standard),
              color var(--motion-fast) var(--ease-standard);
}
```

- [ ] **4.2.2** Trim font rules from `@utility home-tool-link--dark` (~lines 612–626) — layout/color only; typography comes from `typ-cta`:

**After (keep margin-top, drop font-*):**

```css
@utility home-tool-link--dark {
  margin-top: auto;
  padding-top: 1.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-accent);
  transition: gap var(--motion-fast) var(--ease-standard),
              color var(--motion-fast) var(--ease-standard);
}
```

- [ ] **4.2.3** Delete `@utility home-tool-heading--dark` block (~lines 628–637) — TSX now uses `typ-h3`.
- [ ] **4.2.4** Fix `@utility home-stats-value` weight `350` → `var(--font-weight-display-light)` (~line 390):

```css
@utility home-stats-value {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: var(--font-weight-display-light);
  line-height: 0.96;
  letter-spacing: -0.045em;
  color: var(--text-heading);
}
```

- [ ] **4.2.5** Trim `@utility home-tool-title` (~lines 575–578) to layout-only if still referenced elsewhere; remove `font-size` / `font-weight` overrides (target: `typ-h3` owns typography).

### Step 4.3 — `sections.css` — remove weight `350`

**File:** [`app/css/core/site/routes/home/sections.css`](../../../app/css/core/site/routes/home/sections.css)

- [ ] **4.3.1** In `@utility home-planner-suite-metric__value` (~line 382), replace `font-weight: 350` with `font-weight: var(--font-weight-display-light)`.

### Step 4.4 — `showcase.css` — remove obsolete title utility

**File:** [`app/css/core/site/routes/home/showcase.css`](../../../app/css/core/site/routes/home/showcase.css)

- [ ] **4.4.1** Delete entire `@utility home-showcase-card__title` block (~lines 107–117). Caption utility `home-showcase-card__caption` **stays**.

```powershell
rg "home-showcase-card__title" app/ components/
```

Expected after Task 3 + 4.4: no matches.

### Step 4.5 — `cards.css` — collection overlay title pattern

**File:** [`app/css/core/components/cards.css`](../../../app/css/core/components/cards.css)

No `home-collection-card__title` rule exists (TSX uses `typ-overlay-title`). Overlay text-shadow lives in fallbacks.

- [ ] **4.5.1** Confirm no bespoke collection title font-size/weight rules in `cards.css`. If any `home-collection-card__title` block appears, delete it.
- [ ] **4.5.2** Keep structural rules (`.home-collection-card`, `__overlay`, `__footer`, `__arrow`) unchanged.

### Step 4.6 — `type-fallback.css` — sync fallbacks + trim bespoke type

**File:** [`app/css/core/site/routes/home/type-fallback.css`](../../../app/css/core/site/routes/home/type-fallback.css)

**Add / verify fallbacks** (mirror [`type.css`](../../../app/css/core/typography/type.css) token values):

- [ ] **4.6.1** Add `.typ-stat` fallback (missing today):

```css
.typ-stat {
  font-family: var(--font-display);
  font-size: clamp(40px, 5vw, 67px);
  font-weight: var(--font-weight-display-light, 300);
  letter-spacing: -0.06em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
```

- [ ] **4.6.2** Verify `.typ-overlay-title`, `.typ-h3`, `.typ-cta` blocks (~lines 197–223) match `type.css` — **already present; confirm values, do not duplicate.**

- [ ] **4.6.3** Add `.home-inline-link` fallback (used by Trust logos CTA):

```css
.home-inline-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-primary);
  font-family: var(--font-sans);
  font-size: var(--type-body-size, 16px);
  font-weight: var(--font-weight-copy-semibold, 500);
  transition: color var(--motion-fast) var(--ease-standard);
}
```

- [ ] **4.6.4** Keep `.home-collection-card .typ-overlay-title` text-shadow (~lines 225–227) — this is the collection overlay title pattern.

**Delete / trim bespoke rules:**

- [ ] **4.6.5** Delete `.home-showcase-card__title` block (~lines 229–239).
- [ ] **4.6.6** Delete `.home-tool-title` block (~lines 342–348).
- [ ] **4.6.7** Trim `.home-tool-link--dark` (~lines 386–398) to layout/color only (remove `font-family`, `font-size`, `font-weight`, `letter-spacing`, `line-height` — `typ-cta` owns those).
- [ ] **4.6.8** Fix `.home-planner-suite-metric__value` `font-weight: 350` → `var(--font-weight-display-light, 300)` (~line 146).
- [ ] **4.6.9** Delete `.home-tool-heading--dark` fallback block (~lines 375–384) if still present after base.css utility removal.

### Step 4.7 — `layout-fallback.css` — sync layout + type fallbacks

**File:** [`app/css/core/site/routes/home/layout-fallback.css`](../../../app/css/core/site/routes/home/layout-fallback.css)

- [ ] **4.7.1** Update `.home-tool-link` / `.home-tool-link--dark` (~lines 388–406) — keep `margin-top: auto`; remove `font-size: 0.875rem` and `font-weight: 500` from the shared rule (typography via `typ-cta`):

```css
.home-tool-link,
.home-tool-link--dark {
  margin-top: auto;
  padding-top: 1.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.home-tool-link--dark {
  color: var(--color-accent);
}
```

- [ ] **4.7.2** Add `.home-inline-link` layout fallback (mirror `base.css` `@utility home-inline-link`):

```css
.home-inline-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}
```

- [ ] **4.7.3** Delete `.home-tool-heading--dark` fallback (~lines 377–386) — unreferenced after Task 3.
- [ ] **4.7.4** Delete `.home-tool-title--dark` color-only rule (~lines 373–375) if `typ-h3 text-inverse` covers dark tool cards.

### Step 4.8 — `Collections.tsx` toolbar alignment (verify)

**File:** [`components/home/Collections.tsx`](../../../components/home/Collections.tsx)

Per layout plan: header row `items-center`; browse link `inline-flex whitespace-nowrap`.

- [ ] **4.8.1** Confirm toolbar row uses `items-center` (~line 23):

```tsx
className="mb-8 flex items-center justify-between gap-6"
```

- [ ] **4.8.2** Confirm catalog CTA uses `inline-flex` + `whitespace-nowrap` (~line 52):

```tsx
className="home-catalog-cta group typ-label ml-2 inline-flex items-center gap-1.5 whitespace-nowrap sm:ml-4"
```

- [ ] **4.8.3** If either class is missing, add it — **do not** change typography classes (`typ-label` stays).

### Step 4.9 — Post-edit grep gates

- [ ] **4.9.1** Zero `font-weight: 350` under home route CSS:

```powershell
rg "font-weight:\s*350" app/css/core/site/routes/home/
```

Expected: no matches.

- [ ] **4.9.2** Zero `home-showcase-card__title` sitewide:

```powershell
rg "home-showcase-card__title" app/ components/
```

Expected: no matches.

- [ ] **4.9.3** Zero `home-tool-heading--dark` sitewide:

```powershell
rg "home-tool-heading--dark" app/ components/
```

Expected: no matches.

### Step 4.10 — Agent C verification

```powershell
npm.cmd run typecheck
npm.cmd run lint
```

- [ ] **4.10.1** Static analysis passes on touched CSS paths.

```powershell
npx next dev --webpack
```

Hard refresh `http://localhost:3000/`:

- [ ] **4.10.2** Collection + showcase slide titles share one overlay scale (`clamp(1.25rem, 1.1rem + 0.7vw, 1.75rem)` max `28px` at common desktop widths).
- [ ] **4.10.3** Collections “Browse full catalog” arrow stays **inline** with label (no wrap) at `sm+`.
- [ ] **4.10.4** Tool card “Launch” links **baseline-align** across the two cards (`margin-top: auto` on `.home-tool-link`).
- [ ] **4.10.5** Invalid weight `350` absent from computed styles on `/` KPI cells.

### Task 4 files (exclusive ownership)

| Path | Action |
|------|--------|
| `app/css/core/site/routes/home/base.css` | Tool link alignment; trim dark link/title utilities; fix `home-stats-value` weight |
| `app/css/core/site/routes/home/sections.css` | Fix planner metric weight `350` |
| `app/css/core/site/routes/home/showcase.css` | Delete `home-showcase-card__title` utility |
| `app/css/core/components/cards.css` | Confirm no bespoke collection title font rules |
| `app/css/core/site/routes/home/type-fallback.css` | Add `typ-stat`, `home-inline-link`; trim bespoke; fix `350` |
| `app/css/core/site/routes/home/layout-fallback.css` | Sync tool-link + `home-inline-link` fallbacks |
| `components/home/Collections.tsx` | Verify toolbar alignment only |

**Forbidden:** `theme.css`, `type.css`, `ContactTeaser.tsx`, `contact-teaser.css`.

---

## Merge order + integration handoff

```
Task 1–2 (Agent A, layout)  ──┐
Task 3   (Agent B, typ TSX)  ──┼──► Task 5 (Agent D, verify gates)
Task 4   (Agent C, CSS)      ──┘
```

After Tasks 3 + 4 land, Agent D runs:

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run test:e2e:nav
npx next dev --webpack
```

Update status rows in [`plans/HOMEPAGE-LAYOUT-TYPOGRAPHY.md`](../../../plans/HOMEPAGE-LAYOUT-TYPOGRAPHY.md) for `swap-component-classes`, `fix-invalid-weights`, `remove-bespoke-type-css`, `sync-fallbacks`, `fix-tools-card-alignment`, `fix-collections-toolbar`.

---

## Subagent-driven-development

### Task 3 (Agent B)

1. **Implementer** — execute §3.2–3.5 edits; §3.6 verify-only.
2. **Spec reviewer** — every typography row in design doc §2 addressed; ContactTeaser untouched.
3. **Code quality reviewer** — no CSS file edits; no invalid weights introduced.

### Task 4 (Agent C)

1. **Implementer** — execute §4.2–4.9 CSS edits; §4.8 verify-only.
2. **Spec reviewer** — fallbacks exist for every `typ-*` class Task 3 applies; zero `350` weights remain.
3. **Code quality reviewer** — no token/type.css edits; deleted utilities have zero TSX/CSS references.

---

## References

| Doc | Path |
|-----|------|
| Execution plan | `plans/site-design/README.md` |
| Layout + typography spec | `plans/HOMEPAGE-LAYOUT-TYPOGRAPHY.md` |
| Final0704 visual reference | `plans/site-design/2026-06-16-final0704-design-reference.md` |
| CSS architecture | `docs/CSS-ARCHITECTURE.md` |

---

*Status: Wave 2 — pending (Wave 1 landed 2026-06-16).*