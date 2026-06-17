# Final0704 Design Reference — Homepage Visual/UX Patterns

*2026-06-16 · Research-only*

## Source (design ideas only — not code copy)

| Resource | URL |
|----------|-----|
| **Repo** | [github.com/mayoite/Final0704](https://github.com/mayoite/Final0704) |
| **Live preview** | [oneandonly-cad-suite.vercel.app](https://oneandonly-cad-suite.vercel.app) |

**Rules for agents:**

1. **Borrow:** surface alternation, vertical rhythm intent, typography hierarchy, card layout patterns, hero scrim/CTA feel.
2. **Do not copy:** file paths, class names, hex literals, 11-section stack, data shapes, or TSX/CSS verbatim.
3. **Implement in this repo** using `home-*` utilities, `typ-*` tokens, and the 8-section order in [`app/(site)/page.tsx`](../../app/(site)/page.tsx).

**Canonical source files in Final0704** (read for ideas, not paste):

| Area | Path |
|------|------|
| Page order | [`src/app/page.tsx`](https://github.com/mayoite/Final0704/blob/main/src/app/page.tsx) |
| Hero | [`src/components/home/HomepageHero.tsx`](https://github.com/mayoite/Final0704/blob/main/src/components/home/HomepageHero.tsx) |
| Collections | [`src/components/home/Collections.tsx`](https://github.com/mayoite/Final0704/blob/main/src/components/home/Collections.tsx) |
| Trust | [`src/components/home/TrustStrip.tsx`](https://github.com/mayoite/Final0704/blob/main/src/components/home/TrustStrip.tsx) |
| Tools | [`src/components/home/InteractiveTools.tsx`](https://github.com/mayoite/Final0704/blob/main/src/components/home/InteractiveTools.tsx) |
| Why | [`src/components/home/WhyChooseUs.tsx`](https://github.com/mayoite/Final0704/blob/main/src/components/home/WhyChooseUs.tsx) |
| Dark band (not on our `/`) | [`src/components/home/ProcessSection.tsx`](https://github.com/mayoite/Final0704/blob/main/src/components/home/ProcessSection.tsx) |

**Related plans in this repo:**

- [`plans/HOMEPAGE-LAYOUT-TYPOGRAPHY.md`](../HOMEPAGE-LAYOUT-TYPOGRAPHY.md)
- [`plans/site-design/README.md`](./README.md)

---

## Sources reviewed

| Area | Final0704 paths |
|------|-----------------|
| Page orchestration | `src/app/page.tsx` |
| Section components | `src/components/home/*` (Hero, Partnership, Collections, TrustStrip, ShowcaseCarousel, InteractiveTools, WhyChooseUs, ProcessSection, HomeFAQ) |
| Homepage CSS | `src/app/homepage.css` |
| Typography | `src/app/typography.css` |
| Surfaces / scheme | `src/app/theme-utilities.css`, `src/app/surfaces.css` |
| Layout geometry | `src/app/layout-geometry.css` |
| Docs | `.07docs/README.md`, `IMPORTANTFILES/docs/` (no homepage layout spec — runtime code is canonical) |

---

## 1. Section order and background alternation

### Final0704 DOM order (11 sections)

| # | Section | Background treatment | Notes |
|---|---------|-------------------|-------|
| 1 | `HomepageHero` | **Inverse** (`bg-inverse`) | Full-bleed imagery + dark scrim |
| 2 | `PartnershipBanner` | **Page** (`home-section--white`) | Compact; slight negative top margin overlaps hero |
| 3 | `Collections` | **Soft** (`home-section--soft`) | Sunken band; content in `home-frame` panel |
| 4 | `TrustStrip` | **Warm sand** (`#f6f1e9`) | Custom neutral — *not* `--surface-soft`; breaks adjacent soft bands |
| 5 | `ShowcaseCarousel` | **Page** (`--surface-page`) | Light reading band |
| 6 | `InteractiveTools` | **Page** (`scheme-page`) | Light band with elevated panel cards |
| 7 | `WhyChooseUs` | **Soft** (`scheme-section-soft`) | Sunken band; feature cards on `scheme-panel` |
| 8 | `ProcessSection` | **Dark** (`#0d0d0d`) | Second inverse moment; gold accent top border |
| 9 | `HomeFAQ` | **Page** (`home-section--white`) | FAQ inside `home-frame` |
| 10 | `ContactTeaser` | **Soft** (contact card on `--surface-soft`) | Closing sunken band |

**Final0704 rhythm (surfaces):**  
`inverse → page → soft → sand → page → page → soft → dark → page → soft`

**Design intent:** Alternate **reading bands** (page) with **sunken bands** (soft/sand). Reserve **inverse/dark** for hero + one mid-page “systems” moment (Process). Avoid back-to-back identical surfaces — Trust’s sand band specifically separates Collections (soft) from Showcase (page).

### E:\16062026 landed (8 sections, order fixed — Wave 1, 2026-06-16)

| # | Section | Surface | Final0704 analogue |
|---|---------|---------|-------------------|
| 1 | Hero | inverse | Same — we keep carousel + glass proof (not in Final0704) |
| 2 | Partnership | page | Same |
| 3 | Collections | soft + `home-frame` | Same framed soft band |
| 4 | TrustStrip | **page** + `border-t` | Final0704 uses warm sand `#f6f1e9`; we use page + border for the same break effect |
| 5 | Showcase | page | Same |
| 6 | InteractiveTools | **page** + light cards | **Aligned** — Final0704 `scheme-page` + `scheme-panel` cards |
| 7 | WhyChooseUs | page | Final0704 uses soft; we stay page (product choice) |
| 8 | ContactTeaser | soft | Same bookend |

**Landed rhythm:** `inverse → page → soft → page → page → page → page → soft`

### Key deltas vs Final0704

| Pattern | Final0704 | E:\16062026 |
|---------|-----------|-------------|
| Section count | 11 (includes Process, FAQ on `/`) | 8 (FAQ on `/about` only) |
| Dark / inverse bands | Hero + **ProcessSection** | Hero + **InteractiveTools** |
| Tools section surface | **Light page** with panel cards | **Light page** with `home-tool-card` ✓ (Wave 1) |
| Why section surface | **Soft** sunken band | **Page** — intentional divergence |
| Trust surface | Custom **sand** (`#f6f1e9`) | **Page** + `border-t` — same visual break, token-native |
| Adjacent soft bands | Avoided via sand Trust band | **Fixed** — Trust moved to page (Wave 1) |

**Takeaway for tweak work:** Match the *spirit* (no adjacent identical surfaces, one mid-page dark band, soft bookends around contact) using this repo’s 8-section stack — not a literal copy of Final0704’s 11-section order.

---

## 2. Typography hierarchy

### Final0704 role map

| Role | Class / pattern | Family | Size / weight | Character |
|------|-----------------|--------|---------------|-----------|
| Hero H1 | Inline clamp on `<h1>` | display | `clamp(2.35rem…3.65rem)` mobile; `clamp(3.65rem…4.95rem)` md+ | Ultra-light (200–270); tight tracking (-0.05em); ~10ch max width |
| Section H2 | `typ-section-title` | display | `clamp(1.75rem, 4vw, 2.75rem)` | Weight 300; -0.04em tracking; balanced wrap |
| Section subtitle | `typ-section-subtitle` | sans | body-lg token | Muted body under H2 (Why section) |
| Image overlay title | Inline on cards | display | `text-xl md:text-2xl font-light` | White on gradient; no shared utility |
| Feature card H3 | Inline `text-xl font-medium` | sans/display mix | ~1.25rem | Medium weight on panel cards |
| KPI value | `typ-stat` | display | `clamp(2.5rem, 5vw, 4.2rem)` | Weight 300; tabular nums |
| KPI label | `stats-block__label` | sans | ~0.75rem | Uppercase / semibold |
| Body | `page-copy-sm` / `typ-body-sm` | sans | 1rem | Regular 400 |
| Label / kicker | `typ-label` | sans | 0.72rem | Uppercase; 0.11em tracking; weight 500 |
| CTA / links | `typ-cta` or inline `text-sm font-semibold` | sans | 1rem / 0.875rem | Semibold; arrow suffix |
| Accent in H2 | `text-primary italic` span | — | inherits H2 | Brand color + italic emphasis word |

### E:\16062026 role map (target utilities)

| Role | Class | Notes vs Final0704 |
|------|-------|-------------------|
| Hero H1 | `home-hero-title-homepage` | Weight **300** (not 200); text-shadow; multi-line stagger |
| Section H2 | `home-heading` | Slightly larger max (`2.9rem` vs `2.75rem`); uses `--text-heading` |
| Image overlay | `typ-overlay-title text-inverse` | Shared utility — **more systematic** than Final0704 inline sizes |
| Feature card H3 | `typ-h3` | Display family, weight 400 |
| KPI value | `typ-stat` | Same scale; fix invalid weight 350 → 300 |
| KPI label | `typ-label` | 12px / 500 (vs Final0704 0.75rem bespoke) |
| Body | `page-copy-sm` | Aligned |
| Label | `typ-label` / `home-kicker` | Aligned |
| CTA | `typ-cta` | 16px / 500 target (vs Final0704 0.875rem inline links) |

### Typography design cues to preserve

1. **Display-light headline voice** — large H1/H2 stay thin (300), never bold display.
2. **One section title scale** — all H2s share a single clamp ladder; accent word is italic + brand color, not a second size.
3. **Overlay titles lighter than section titles** — card names on imagery are smaller and lighter than section H2.
4. **Labels are uppercase, tracked, small** — kickers, browse links, KPI labels share the label cadence.
5. **Stats are display, not sans** — KPI numbers feel editorial, not dashboard.

---

## 3. Vertical spacing rhythm

### Final0704 — per-section bespoke padding (no unified token)

| Section | `padding-block` pattern | Relative density |
|---------|------------------------|------------------|
| Hero | `pt-20 md:pt-24` + inner `py-12 md:py-16` | Tallest; bespoke |
| Partnership | `py-7 md:py-9` (+ negative margin) | **Most compact** |
| Collections | `py-10 md:py-12` | Medium |
| Trust | `py-8 md:py-10` | **Compact** (stats strip) |
| Showcase | `py-12 md:py-20` | Medium–generous |
| Tools | `py-16 md:py-20` | Generous |
| Why | `py-18 md:py-22` | **Most generous** |
| Process | `py-10 md:py-14` | Medium |
| FAQ | `py-10 md:py-14` | Medium |
| Contact | Inherited from teaser / section wrapper | Medium |

**Pattern:** Hero is bespoke. Mid-page bands vary by content weight — stats and partnership are tight; Why and Tools breathe more. No single `section-y-*` utility in Final0704 TSX.

### E:\16062026 — tokenized rhythm (target)

| Token | Value | Usage |
|-------|-------|-------|
| `--section-space-sm` | `clamp(3.5rem, 5vw, 4.5rem)` | `section-y-sm` on sections 2–8 |
| Hero | `pt-20 md:pt-24` + inner `py-10 md:py-16 lg:py-20` | Bespoke (unchanged) |

**Design intent of `section-y-sm`:** Collapse Final0704’s four padding systems into **two** — hero bespoke + one marketing rhythm — so Partnership, Trust, Showcase, Tools, Why, and Contact share identical block padding.

### E:\16062026 padding (post–Wave 1)

| Section | Padding | Status |
|---------|---------|--------|
| Partnership | `section-y-sm` | ✓ normalized |
| Trust | `section-y-sm` | ✓ normalized |
| Showcase | `section-y-sm` | ✓ TSX; dead fallback removed |
| Collections | `section-y-sm` | ✓ aligned |

---

## 4. Shell / max-width behavior

### Final0704

| Utility | Max width | Horizontal padding | Used by |
|---------|-----------|-------------------|---------|
| `home-shell` | **1680px** | 1.5rem → 2.5rem (md+); 0 at 1536px+ | Partnership, Collections, Trust, FAQ |
| `container` | **1680px** | Same as above | Showcase, Tools, Why, Process |

**Pattern:** One wide marketing shell (1680px). Collections/Trust/FAQ nest a `home-frame` panel inside the shell. Content breathes wide on large displays.

### E:\16062026

| Utility | Max width | Used by |
|---------|-----------|---------|
| `home-shell-xl` | **1320px** (`--container-home-max`) | Target for **all** eight sections |
| `home-shell` | 1680px | Legacy wide shell (Collections was on this; now normalized) |
| `container` | 1680px | TrustStrip **outlier** today |

**Design intent of narrower shell:** Tighter editorial column — section headers, carousels, and KPI grids align to one vertical rhythm at 1320px. Final0704’s 1680px feels more “showroom”; E:\16062026’s 1320px feels more “magazine”.

**Landed:** All eight sections use `home-shell-xl` (1320px), including TrustStrip (Wave 1).

---

## 5. Hero treatment

### Final0704

| Element | Treatment |
|---------|-----------|
| Layout | Single column; `container` centers copy vertically |
| Imagery | One static hero image; subtle scale-in animation |
| Scrim | **Left-weighted** horizontal gradient: `from-black/80 via-black/50 to-transparent` + bottom fade `h-48` |
| H1 | Stacked words, staggered motion reveal; no kicker below CTAs |
| CTAs | `btn-hero-primary` (dark pill) + `btn-hero-secondary` (glass pill); `home-actions` row |
| Proof panel | **None** |
| Carousel | **None** |
| Progress dots | **None** |

### E:\16062026 (enhanced hero)

| Element | Treatment |
|---------|-----------|
| Layout | **Two-column grid** on lg: copy left, glass proof panel right (`home-hero__layout`) |
| Imagery | **Multi-image carousel** with crossfade; `AnimatePresence` |
| Scrim | **Dual system**: bottom-heavy vertical gradient + lg horizontal gradient; stronger opacity (88/62/48) |
| H1 | `home-hero-title-homepage` with text-shadow; accent italic on last line |
| CTAs | Same button family; primary uses `btn-primary`, secondary `btn-accent` |
| Proof panel | **Glass card** (`home-hero-proof-panel`): badge, lead, support, CTA link; blur + inset highlight |
| Progress dots | Bottom-centered pill indicators (`home-hero-progress`) |
| Kicker | **Above CTAs**; bronze label color (Wave 1 — clearer hierarchy than Final0704, which has no kicker) |

**Design cues to keep from E:\16062026:** Proof panel and carousel are deliberate upgrades — not in Final0704. When polishing, preserve scrim legibility and panel glass treatment; don’t regress to single-image/no-proof layout.

**Shared cues from Final0704:** Full-bleed inverse band, min-height ~78–85vh, header offset `pt-20 md:pt-24`, pill CTAs with hover lift.

---

## 6. Collections and showcase card patterns

### Collections (Final0704)

- Section: soft band + top/bottom borders.
- Inner **framed panel** (`home-frame home-frame--standard`) — content floats on panel, not directly on soft bg.
- Header row: H2 left; prev/next circles + text link right (`items-end` alignment).
- Cards: **3:4 aspect**, `rounded-huge`, `surface-overlay-24` scrim on image.
- Title: bottom-left on image; **circular arrow chip** bottom-right (panel-strong bg).
- Carousel: Swiper; 1→2→3→4 breakpoints; 24px gap.

### Collections (E:\16062026)

- Same soft + border + frame pattern ✓
- `home-shell-xl` (narrower than Final0704 `home-shell`)
- `section-y-sm` (taller block padding than Final0704 `py-10/12`)
- `home-heading` + `typ-overlay-title` on cards (systematic overlay type)
- `typ-label` catalog CTA with `whitespace-nowrap` (arrow inline fix)
- Shared `home-collection-card` overlay/footer pattern

### Showcase (Final0704)

- Page background; `py-12 md:py-20`.
- Embla carousel; slides at 100% → 45% → 35% width.
- Cards: `rounded-blob`, **4:5 aspect**, gradient `from-black/80` overlay.
- Title: `text-2xl font-light` white at bottom; description fades in on hover.
- Nav: circular chevron buttons + underline-style browse link.

### Showcase (E:\16062026)

- `home-showcase-section--light` + `section-y-sm` + `home-shell-xl`
- Same Embla mechanics; uses `home-showcase-*` CSS component classes
- Target: `typ-overlay-title` for slide names; `typ-cta` for browse link
- Section title via `home-heading` with accent italic span (richer than Final0704 plain `typ-section-title`)

**Card pattern summary:**

| Pattern | Final0704 | E:\16062026 |
|---------|-----------|-------------|
| Collection aspect | 3:4 | 3:4 (via card CSS) |
| Showcase aspect | 4:5 | 4:5 |
| Overlay | Gradient + opacity hover | Gradient + component overlay |
| Title on image | Light display, bottom-anchored | `typ-overlay-title text-inverse` |
| Header toolbar | Circle nav + text link | Same structure |
| Framed collections | Yes (`home-frame`) | Yes ✓ |

---

## 7. Tools section — light band (aligned with Final0704)

### Final0704 — Tools on page surface

[`InteractiveTools.tsx`](https://github.com/mayoite/Final0704/blob/main/src/components/home/InteractiveTools.tsx):

- `scheme-page` background + `border-t border-theme-soft`.
- **Panel cards** (`scheme-panel scheme-border`): soft icon tile, medium title, muted body, “Launch →” at card bottom.
- Four tools in `sm:grid-cols-2 xl:grid-cols-4`; `min-h-[170px]`; hover lift `-translate-y-1`.

### E:\16062026 — landed (Wave 1)

[`InteractiveTools.tsx`](../../components/home/InteractiveTools.tsx):

- `home-section--white` + light `home-tool-card` / `home-tool-icon` / `home-tool-link`.
- **Two** tools (Oando Planner, Planning service) in `md:grid-cols-2`.
- Same **ideas** as Final0704: page band, elevated cards, launch link at bottom — implemented with this repo’s utilities, not `scheme-*` classes.

**Wave 2 cue from Final0704:** ensure `margin-top: auto` on launch links so card baselines align when copy lengths differ.

### Dark band reference (not on our `/`)

Final0704 reserves inverse drama for **`ProcessSection`** — gold top border, step numerals, divided grid. We have no Process on `/`; borrow that language only if a future section needs a mid-page dark moment.

---

## 8. Intentional divergences (keep these)

| Topic | Final0704 | E:\16062026 | Why |
|-------|-----------|-------------|-----|
| Sections on `/` | 11 | 8 | FAQ on `/about`; no Process band |
| Hero proof panel | No | Yes | Product upgrade — glass trusted-by card |
| Hero carousel | Single image | Multi-image + dots | Product upgrade |
| Trust surface | Sand `#f6f1e9` | Page + `border-t` | Token-native break between soft Collections and page Showcase |
| Why surface | Soft sunken band | Page | Locked product choice |
| Shell width | `home-shell` 1680px | `home-shell-xl` 1320px | Tighter editorial column |
| Padding | Per-section bespoke `py-*` | Unified `section-y-sm` | Fewer rhythm systems |

### Remaining Wave 2 gaps (typography/CSS — not layout)

| Issue | Status |
|-------|--------|
| Bespoke title classes (`home-showcase-card__title`, etc.) | Pending → `typ-overlay-title`, `typ-h3`, `typ-cta` |
| KPI weight `350` in home CSS | Pending → `300` |
| Tool link `margin-top: auto` baseline | Pending |
| `homepage-data.test.ts` drift | Wave 3 |

### Partnership banner

| Aspect | Final0704 | E:\16062026 |
|--------|-----------|-------------|
| Inner layout | `home-frame` centered flex | `home-partnership-panel` custom panel |
| H2 class | `typ-section-title` | `home-heading` (target ✓) |
| Overlap hero | `-mt-3 md:-mt-4` | No negative margin |
| Shell | `home-shell` 1680px | `home-shell-xl` 1320px |

---

## 9. Actionable design cues (ideas from Final0704 — no code copy)

### Already landed (Wave 1)

1. **Background alternation** — Trust on page breaks soft+soft with Collections.
2. **`section-y-sm` + `home-shell-xl`** — unified rhythm and shell.
3. **Light Tools** — page band + panel cards (Final0704 pattern).
4. **Collections frame** — soft band → `home-frame` → Swiper cards.
5. **Hero kicker above CTAs** — clearer hierarchy than Final0704 (no kicker there).
6. **Mobile catalog CTA** — “Browse full catalog” visible below `sm`.
7. **Showcase eyebrow** — `typ-label` slot populated (“Selected projects”).

### Wave 2 — borrow typography discipline from Final0704

1. **One overlay title scale** on collection/showcase cards (`typ-overlay-title`).
2. **Label cadence** — uppercase tracked kickers, browse links, KPI labels (`typ-label`).
3. **Launch links baseline-aligned** — Final0704 cards use equal min-height + bottom-anchored CTA row.
4. **Browse link hover** — muted → strong with inline arrow (`typ-cta` + `whitespace-nowrap`).

### Do not regress

1. Hero proof panel + image carousel (E:\16062026 upgrades over Final0704).
2. Eight-section order (no Process/FAQ on `/`).
3. Light Tools on page surface (aligned with Final0704 — do not revert to dark inverse).
4. Page-band Why (differs from Final0704 soft Why — locked).

### Optional future borrow (not scheduled)

- **Why subtitle + pill bullets** — Final0704 Why has `typ-section-subtitle` + rounded chips under H2; we use card grid only today.
- **Process dark band** — gold top border + step numerals if a dark mid-page section is added later.

---

## 10. Quick reference — landed E:\16062026 rhythm

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Hero          │ INVERSE  │ bespoke py   │ home-shell-xl │
│ 2. Partnership   │ PAGE     │ section-y-sm │ home-shell-xl │
│ 3. Collections   │ SOFT     │ section-y-sm │ home-shell-xl │ + home-frame
│ 4. Trust         │ PAGE     │ section-y-sm │ home-shell-xl │ + border-t
│ 5. Showcase      │ PAGE     │ section-y-sm │ home-shell-xl │
│ 6. Tools         │ PAGE     │ section-y-sm │ home-shell-xl │ light cards
│ 7. Why           │ PAGE     │ section-y-sm │ home-shell-xl │
│ 8. Contact       │ SOFT     │ section-y-sm │ home-shell-xl │
└─────────────────────────────────────────────────────────────┘
```

Compare live: [Final0704 `/`](https://oneandonly-cad-suite.vercel.app) vs local `npx next dev --webpack` → `/`.

---

*Updated 2026-06-16. [mayoite/Final0704](https://github.com/mayoite/Final0704) — design ideas only; implementation in [`plans/site-design/README.md`](./README.md).*