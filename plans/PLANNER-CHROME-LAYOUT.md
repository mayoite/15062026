# Planner chrome layout — canvas-first shell

*Program: [`MASTER-PLAN.md`](MASTER-PLAN.md) · CSS: [`docs/CSS-ARCHITECTURE.md`](../docs/CSS-ARCHITECTURE.md) · Shell: [`features/planner/editor/PlannerWorkspace.tsx`](../features/planner/editor/PlannerWorkspace.tsx)*

**Status:** v0 prototype (2026-06-16). Competitive gaps documented below. M1–M5 pending.

---

## Goal

Match what users expect from **RoomSketcher, Planner 5D, Floorplanner, Homestyler, Magicplan** — a pro drawing surface where tools and catalog are always reachable, nothing blocks the canvas, and the layout can be personalized.

**Our model:** Top = session · Left = build + catalog · Canvas = work · Right = properties · Bottom = measurements.

---

## What other planners do (benchmark)

| Product | Top bar | Left / tools | Canvas | Right | Bottom |
|---------|---------|--------------|--------|-------|--------|
| **Planner 5D** | 2D/3D, undo/redo, render, ruler, share, settings | **Mode sidebar** — structure · construction · interior · exterior · recent · favorites | Full stage | Item props on select | — |
| **RoomSketcher** | Menu, save, levels, copy/paste, undo/redo, trash, Live 3D, 360 | Tools via hamburger + context | Full stage | Properties when selected | — |
| **Floorplanner** | Project + view controls | **Catalog + draw tools** in left stack; walls/furniture from library | Full stage | Inspector / dimensions | Scale + unit readout |
| **Homestyler** | Save, render, account | **Catalog-first** left rail; drag items to canvas | Full stage | Selected object props | — |
| **Magicplan** | Project, export | Room scan → edit tools; mobile-first bottom actions | Full stage | Room/item detail | Measurement strip |
| **AutoCAD / CAD** | Command + status | **Dockable palettes**; tool palette by discipline | Model space | Properties palette | Coords, snaps, ortho |
| **Figma** | File, zoom, share | **Tools** (fixed left) + **Layers/Assets** (collapsible left) | Infinite canvas | Design panel | — |

### Patterns users already know

1. **Top = session only** — save, undo/redo, 2D/3D, export, account. Not drawing tools.
2. **Left = mode + catalog** — switch *what you're placing* (walls vs furniture vs doors), not just icon tools.
3. **Tool ↔ catalog coupling** — pick Furniture → library opens; pick Wall → draw mode, library muted.
4. **Recents + favorites** — fast re-place without searching catalog (Planner 5D, Homestyler).
5. **Ruler / measure in top or bottom** — always visible scale confidence (Planner 5D ruler, Floorplanner scale).
6. **Properties on the right** — appears when something is selected; empty state when not.
7. **Dockable / collapsible side stacks** — CAD palettes collapse to icons; expand on hover or click.
8. **Bottom strip for context** — dimensions, selection count, grid/snap, unit system (we have status bar — extend it).
9. **No modal blocking draw** — panels slide or dock; backdrop dim optional, canvas stays live.
10. **Keyboard-first** — hotkeys on every tool (RoomSketcher, CAD); shortcuts shown on hover.

### Where we are vs benchmark

| Expectation | Ours today | Gap |
|-------------|------------|-----|
| Top = session only | Top bar correct | ✓ |
| Left = mode + catalog | Library tab exists; tools are separate floating rail | **Split brain** — tools float, catalog slides |
| Tool picks open right catalog | Furniture opens library | Partial — no construction/draw coupling |
| Recents / favorites | None | **Missing** |
| Ruler / scale in chrome | Measure tool only; status shows m² | **No persistent scale bar** |
| Right = live inspector | Slide-over on Review only | **Props should be one-click anytime** |
| Collapsible left stack | Open/close whole panel | **No icon-only collapse** |
| Dockable palettes | v0 drag grips (4 widgets) | **No palette collapse, no mode rail** |
| Bottom = measurements + snap | Status bar metrics | **No snap/grid/unit strip detail** |
| 2D/3D in top | ✓ in top bar | ✓ |
| Blueprint trace | Blueprint tab | ✓ differentiator |

---

## Policy (non-negotiable)

| Topic | Rule |
|-------|------|
| Fixed | `PlannerTopBar`, `PlannerStatusBar`, `PlannerMobileDock` |
| Dockable (desktop) | Tool rail, step/mode bar, access strip, *(future)* collapsed palette rail |
| Slide-over | Library, inspector, blueprint — content panels, not free-floating |
| Mobile | No drag; bottom tool strip + dock; catalog via overlay |
| Canvas | Always interactive when panels open |
| Step change | Moves panels + default tool; does **not** auto-move user-docked chrome |
| Ship gate | `npm.cmd run typecheck` + Playwright `planner-custom-tools.spec.ts` (17 tests) |

---

## Target layout (v1 — aligned to benchmark)

```
┌ TOPBAR (fixed) ───────────────────────────────────────────────┐
│ logo · undo/redo · 2D/3D/split · save · export · menu         │
├───────────────────────────────────────────────────────────────┤
│ ┌mode─┐  ┌ Draw · Place · Review ┐              ┌ access ─┐  │
│ │wall │  └ step bar (dockable) ───┘              │ ◧  ◨   │  │
│ │room │                                         └─────────┘  │
│ │place│         CANVAS (full bleed)                           │
│ │review│        + grid + blueprint underlay                   │
│ └─────┘                                                       │
│ (tool rail — dockable; merges draw + place tools)             │
│ ◄ LEFT PANEL (slide/collapse)    RIGHT PANEL (slide) ►        │
│   catalog · blueprint · AI         props · layers · workflow  │
├───────────────────────────────────────────────────────────────┤
│ STATUS (fixed) — selection · dims · m² · grid · snap · units  │
└───────────────────────────────────────────────────────────────┘
```

### Chrome widgets (v1)

| ID | Contents | Default dock | Benchmark source |
|----|----------|--------------|------------------|
| `tools` | Select, pan, wall, room, door, window, furniture, zone, measure, erase | left-center | Planner 5D side tools + tldraw |
| `steps` | Draw · Place · Review | top-center | Our workflow (unique) |
| `access` | Open library · open inspector · *(M5)* collapse left to icons | top-left | CAD palette toggles |

### Panels (not dockable — slide + collapse)

| Panel | Default | Step rule | Benchmark |
|-------|---------|-----------|-----------|
| Left | Collapsed icon rail → expand | Place = library open | Planner 5D side menu |
| Right | Closed → open on select or Review | Review = open | RoomSketcher / Homestyler props |

---

## Architecture

```
features/planner/editor/chrome/
├── plannerChromeTypes.ts
├── plannerChromeLayout.ts      # snap, collide, migrate
├── plannerChromeStorage.ts
├── PlannerChromeProvider.tsx
├── PlannerChromeHost.tsx
├── PlannerChromeWidget.tsx
└── widgets/
    ├── ToolsChrome.tsx
    ├── StepsChrome.tsx
    └── AccessChrome.tsx
```

**Layout v2 storage:** `planner-chrome-layout-v2`

```typescript
type ChromeLayoutV2 = {
  version: 2;
  widgets: {
    tools:  { edge: "left";  offset: 0.5 };
    steps:  { edge: "top";   offset: 0.5 };
    access: { edge: "top";   offset: 0.04 };
  };
  panels: {
    leftCollapsed: boolean;   // M5 — icon-only rail
  };
};
```

**CSS:** `planner-chrome.css` owns all dock rules · import from `bundles/workspace.css`

---

## Milestones

| # | Focus | Status |
|---|-------|--------|
| v0 | Canvas-first + basic drag | **Done** |
| M1 | Consolidate `chrome/` module + CSS | Pending |
| M2 | AccessChrome (library + inspector toggles) | Pending |
| M3 | Smart snap, collision, orientation | Pending |
| M4 | Reset layout + keyboard a11y | Pending |
| M5 | Benchmark parity — collapse + context | Pending |

### M1 — Consolidate (~1 session)

- `chrome/` module; `planner-chrome.css`; zero visual change
- **Done:** typecheck + Playwright 17/17

### M2 — AccessChrome (~1 session)

- One bar: library + inspector buttons + one grip
- Remove `panel-left` / `panel-right` dockables
- **Done:** +2 Playwright tests for panel toggles

### M3 — Smart docking (~1–2 sessions)

- Widget-center snap, collision stagger, edge preview
- Tool rail flips horizontal on top/bottom dock
- Dynamic tooltip side
- **Done:** `tests/planner-chrome-layout.test.ts`

### M4 — Trust (~1 session)

- “Reset layout” in topbar menu
- Keyboard nudge + announce on snap
- **Done:** reset test

### M5 — Benchmark parity (~2 sessions) *(new)*

| Task | Why (from benchmark) |
|------|----------------------|
| **Left panel icon collapse** | CAD / Planner 5D — catalog collapses to icons, canvas widens |
| **Inspector one-click** | Homestyler / RoomSketcher — props available whenever something selected, not only Review |
| **Tool → tab coupling** | Planner 5D — furniture tool focuses library; wall tool focuses blueprint/draw |
| **Recents row in library** | Planner 5D recents — last 8 placed items at top of catalog |
| **Status bar: snap + units** | Floorplanner scale strip — show snap on/off, unit system, cursor coords *(dev or all users)* |
| **Empty inspector state** | “Select an object” when nothing selected — right panel can stay closed |

**Done:** manual QA checklist + 3 Playwright tests (collapse, select→inspector, furniture→library tab)

---

## Step + panel behavior

| Step | Left panel | Right panel | Default tool | Catalog emphasis |
|------|------------|-------------|--------------|------------------|
| Draw | Collapsed / blueprint | Closed | Wall | Blueprint, structure |
| Place | Library open | Closed until select | Furniture | Interior catalog |
| Review | Collapsed | Inspector open | Measure | Properties, layers, export |

---

## Deferred (v2+)

- Favorites pin list (Planner 5D)
- Floating ruler widget (Planner 5D top menu)
- Drag-reorder catalog categories
- Cloud-synced layout per user
- Named workspace presets
- Draggable panel resize handles
- Native tldraw tool palette merge

---

## Verification

```cmd
npm.cmd run typecheck
set PLAYWRIGHT_BASE_URL=http://localhost:3000&& npx playwright test -c config/build/playwright.config.ts tests/planner-custom-tools.spec.ts
```

**URL:** `http://localhost:3000/planner/guest/` — hard refresh after CSS.

---

## v1 complete when

1. Layout matches benchmark mental model: top session · left build/catalog · right props · bottom metrics.
2. Three dockable widgets (tools, steps, access); panels slide/collapse without blocking canvas.
3. Furniture tool opens library; wall tool stays on draw; inspector opens on selection.
4. Layout persists + reset works.
5. Playwright 17/17 + new chrome tests green.

---

## Next action

**M1** — `do M1` (foundation) or **M1+M2** (foundation + access bar).

*Local/uncommitted as of 2026-06-16. Sources: [Planner 5D Windows nav](https://support.planner5d.com/en/articles/5913598-menu-navigation-windows), [RoomSketcher toolbar](https://help.roomsketcher.com/hc/en-us/articles/14476178785437-Toolbar-Buttons-and-Options), Floorplanner editor manuals, CAD dock-manager patterns.*