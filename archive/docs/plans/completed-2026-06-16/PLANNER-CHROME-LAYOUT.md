# Planner chrome layout — canvas-first shell

*Program: [`MASTER-PLAN.md`](MASTER-PLAN.md) · CSS: [`docs/CSS-ARCHITECTURE.md`](../docs/CSS-ARCHITECTURE.md) · Shell: [`features/planner/editor/PlannerWorkspace.tsx`](../features/planner/editor/PlannerWorkspace.tsx)*

**Status:** **Done (2026-06-16)** — v0/M0–M6 landed + verified. (See Handover for full list of deliverables: full-bleed canvas, dockable chrome, smart docking, benchmark parity, 3D evidence, storage v2, tests 12/12 vitest + 11/11 playwright + 17/17 tools on fresh build+start.)

This document now serves as the completed spec + contracts for future v1 polish. No further execution planned here unless new gaps logged in Failures.

**Research pass:** refreshed 2026-06-16 from the product/help sites listed in [Sources](#sources). Implementation milestones below are source-backed, not just inferred from memory.

---

## Goal

Make `/planner/guest/` feel like a serious drawing workspace:

- Top bar owns session actions: save, undo/redo, view mode, export, templates, AI, menu.
- Left side owns build intent: draw tools, structure tools, catalog, blueprint, recents.
- Canvas stays full-bleed and interactive while chrome is open.
- 3D is a companion review surface, not an afterthought behind a toggle.
- Right side owns object context: properties, layers, workflow, selection state.
- Bottom bar owns confidence: measurements, selection, grid, snap, units.

The desired user impression is: "I can draw, place, inspect, and adjust without losing the canvas."

---

## Current State

| Area | v0 reality | Keep / change |
|------|------------|---------------|
| Canvas | Full-bleed `pw-canvas-stage` with slide-over panels | Keep |
| Tools | `PlannerToolRail` in `PlannerDockableChrome` | Keep, then module-ize |
| Steps | Dockable compact `PlannerStepBar` | Keep |
| Access buttons | Separate `panel-left` / `panel-right` dockables | Replace with one AccessChrome |
| Left panel | Slide-over library / blueprint / AI | Keep, then add icon collapse |
| Right panel | Slide-over workflow + inspector + review-only layers | Keep, then open on selection |
| 3D / split view | `Planner3DViewer` via `SplitViewLayout`; top bar switches 2D/3D/split | Add explicit behavior contract and QA |
| Storage | `planner-chrome-dock-v1` per dock id | Migrate to v2 layout envelope |
| CSS | Dock rules in `planner-canvas-layout.css` | Move chrome-only rules to `planner-chrome.css` |
| Tests | Typecheck + Playwright `planner-custom-tools.spec.ts` 17/17 | Preserve as baseline; add chrome unit/spec coverage |

---

## Benchmark Model

| Product / pattern | Verified behavior | Planner implication |
|-------------------|-------------------|---------------------|
| Planner 5D | Web docs put build/fill actions in a left-side menu, catalogue on the left, and 2D/3D switching in the upper menu. | Left chrome should combine build intent and catalog intent; top bar should keep view/session actions. |
| RoomSketcher | Top toolbar exposes common session/project actions; mode switching changes available categories; selected rooms, furniture, doors, and helpers expose properties on the right. Favorites live inside the active mode library. | Keep top bar mostly session-oriented; make inspector selection-aware; add favorites/recents where catalog users already look. |
| Floorplanner | Furniture library supports search, categories, brand/color filtering, favorites, drag-drop, and selected item properties in a sidebar. | Library needs fast retrieval and repeat placement, not just a long catalog panel. Right panel should be reliable for item edits. |
| Homestyler | Interface docs emphasize left catalog/modules for rooms, model library, folders, building, furniture, and style; 3D is a prominent top-right action. | Treat room/build/furniture/style as adjacent left-side modes; do not hide furniture behind a generic panel opener. |
| Magicplan | Floor-plan creation is mobile/tablet-first, scan/room/dimension driven, and project editing happens in the app, not desktop cloud. | Compact layout should remain bottom-action-first with no drag chrome; measurement confidence matters on small screens. |
| AutoCAD palettes | Dockable windows/palettes can dock, undock, anchor, auto-hide, and reset/recover through known palette behavior. | Docking needs preview, reset, keyboard support, and collapse/auto-hide vocabulary. |
| Figma | Official UI model has left navigation, bottom toolbar, right properties; panels can minimize, and selecting an object can expand the right panel while the left stays minimized. | Selection-driven right inspector and collapsible panels are proven canvas patterns; copy this behavior closely. |

### Known Gaps

| Expectation | v0 | Gap to close |
|-------------|----|--------------|
| Left = mode + catalog | Tools float; catalog slides | Split-brain workflow |
| Recents / favorites | None | Missing fast re-place |
| Persistent scale confidence | Measure tool + area text | No snap/unit/scale strip |
| Right inspector | Review step only by default | Selection should make props available anytime; Figma-like auto-expand is preferred over forcing Review |
| Collapsible left stack | Open/closed panel | No icon-only rail |
| Dockable palettes | Basic drag/snap | No collision, reset, preview, auto-hide/collapse, or orientation metadata |
| Keyboard-first | Existing tool shortcuts | Dock movement/reset needs keyboard and announcements |

---

## Product Policy

| Topic | Rule |
|-------|------|
| Fixed chrome | `PlannerTopBar`, `PlannerStatusBar`, `PlannerMobileDock` remain fixed responsibilities |
| Dockable desktop chrome | Tool rail, step bar, access bar only |
| Not dockable | Library, inspector, blueprint, AI, layers; these remain panels |
| Mobile | No dock dragging; use existing bottom dock and overlay panels |
| Canvas | Panels and docked chrome must not block tldraw interactions outside their visible hit areas |
| Step changes | May open/close panels and select default tool; must not move user-docked chrome |
| Selection changes | May reveal or highlight the right inspector; must not switch workflow step implicitly |
| Scope guard | No auth, API, migration, top-level folder, or persistence behavior changes without explicit approval |
| Storage | Read old `planner-chrome-dock-v1`; write new `planner-chrome-layout-v2` after migration |
| Ship gate | `npm.cmd run typecheck` plus relevant Vitest/Playwright evidence |

---

## Target Layout

```text
┌ TOPBAR fixed: plan, undo/redo, 2D/3D/split, save, export, menu ─────────────┐
│                                                                             │
│  ┌ tools ┐   ┌ Draw · Place · Review ┐                    ┌ access ┐       │
│  │select │   └ dockable step bar ─────┘                    │ L  R  ↺ │       │
│  │pan    │                                                  └────────┘       │
│  │wall   │                                                                   │
│  │room   │                    CANVAS                                          │
│  │door   │              grid · blueprint · tldraw                             │
│  │window │                                                                   │
│  │item   │                                                                   │
│  │measure│                                                                   │
│  └───────┘                                                                   │
│  ◄ left panel: library · blueprint · AI       right panel: props · layers ►  │
│                                                                             │
├ STATUS fixed: selection · dimensions · area · grid · snap · units ──────────┤
└─────────────────────────────────────────────────────────────────────────────┘
```

### Chrome Widgets

| ID | Contents | Default | Notes |
|----|----------|---------|-------|
| `tools` | Select, pan, wall, room, door, window, furniture, zone, measure, erase | left-center | Horizontal when docked top/bottom |
| `steps` | Draw · Place · Review | top-center | Compact step bar only on desktop chrome layer |
| `access` | Library toggle, inspector toggle, reset layout, later left-collapse toggle | top-left | Replaces `panel-left` and `panel-right` dockables |

### Docking + Toolbar Contract

Docking is not only drag persistence. It defines where toolbars may live, how they orient, how they avoid each other, and how the user recovers when the layout gets messy.

| Topic | Rule |
|-------|------|
| Allowed docks | Desktop widgets may dock left, right, top, bottom, or free-float inside the chrome layer. |
| Safe bounds | Docked/free widgets cannot cover the fixed top bar, fixed status bar, or slide-over panel close/toggle controls. |
| Orientation | Tool rail is vertical on left/right, horizontal on top/bottom, compact-safe when free-floating. |
| Collision | Widgets on the same edge must stagger or reject overlap; no toolbar may land directly on top of another. |
| Preview | Dragging a toolbar shows the target edge/preview before drop. |
| Handles | Handles must have visible focus, pointer drag, keyboard movement, and single-widget reset. |
| Reset | Global reset restores all chrome defaults without clearing planner content, selected tool, or catalog state. |
| Persistence | Layout storage persists widget position, not transient dragging state. |
| Mobile | Dock handles are absent/disabled on compact; bottom dock remains the mobile control surface. |

### Icon + Toolbar UI Contract

Planner controls should feel like tools, not prose in rounded boxes. Use icons for recognizable commands and reserve text labels for mode names or uncommon actions that need words.

| Control | Icon rule | Required state |
|---------|-----------|----------------|
| Select | Pointer/cursor icon | active, hover, focus, disabled |
| Pan | Hand icon | active, hover, focus, disabled |
| Wall / room | Structure/shape icons | active draw state plus tooltip |
| Door / window | Opening-specific icons | active draw state plus tooltip |
| Furniture | Sofa/chair/package icon | active placement state plus selected catalog indicator |
| Zone | Area/box icon | active draw state plus tooltip |
| Measure | Ruler icon | active measurement state plus unit awareness |
| Erase | Eraser/trash icon | destructive affordance without accidental activation |
| Library toggle | Panel-left/library icon | open/closed/available states |
| Inspector toggle | Panel-right/sliders/properties icon | open/closed/selection-available states |
| Reset layout | Rotate/restore icon | confirm or safe instant reset; never clears plan content |
| Collapse left | Sidebar-collapse icon | expanded/collapsed states |

Icon requirements:

- Use the existing icon library pattern already present in planner code, currently lucide-react.
- Every icon-only button needs an accessible label and tooltip.
- Hit targets must be stable and large enough for desktop pointer use; icon changes cannot resize the toolbar.
- Active state must be visible without relying on color alone.
- Disabled state must explain why through tooltip or accessible description where practical.
- Toolbar icons must not overlap, wrap unpredictably, or shift the canvas when labels/tooltips appear.
- Text is allowed for `Draw`, `Place`, `Review`; tool commands should be icon-first.

### Panels

| Panel | Default behavior | v1 behavior |
|-------|------------------|-------------|
| Left | Draw collapsed, Place library open, Review collapsed | Add icon-collapse state after AccessChrome |
| Right | Closed except Review | Figma-like behavior: selection makes right inspector available, and can auto-expand when user has enabled selection inspector |
| Blueprint | Left panel tab | Wall/room tools may focus blueprint when blueprint is active |
| AI | Left panel tab | Accessed from existing top bar AI action |

### Benchmark-Derived UX Decisions

| Decision | Source signal | Plan impact |
|----------|---------------|-------------|
| Keep top bar mostly session/view | Planner 5D and RoomSketcher reserve top/upper menu space for project, save, view, render/export, and common commands. | Do not move wall/furniture tools into `PlannerTopBar`. |
| Put build + catalog intent together | Planner 5D, Floorplanner, and Homestyler all make build/catalog discovery a side-menu/library action. | `tools` and left panel need coupling; AccessChrome is a bridge, not the primary workflow. |
| Inspector follows selection | RoomSketcher, Floorplanner, and Figma show/edit selected-object properties in a side panel. | M5 must include selection-aware inspector outside Review. |
| Favorites/recents live inside library context | RoomSketcher and Floorplanner expose favorites from the active library/furniture context. | Put recents row in `PlannerLeftPanel` library, not top bar/status bar. |
| Collapse is a workspace behavior | Figma panels minimize/expand; AutoCAD palettes dock/anchor/auto-hide. | Left icon collapse and layout reset are core v1, not polish. |
| Mobile differs from desktop | Magicplan's creation flow is app/mobile-first and scan/dimension driven. | Compact layout keeps bottom dock; no desktop drag affordance below breakpoint. |

---

## Tools · Canvas · 3D Contract

This plan is not only a chrome rearrangement. It must preserve the three work surfaces users actually experience.

| Surface | Primary job | Must preserve | v1 refinement |
|---------|-------------|---------------|---------------|
| Tools | Fast intent switching: select, pan, wall, room, door, window, furniture, zone, measure, erase | Current custom tldraw tools, hotkeys, active tool state, visibility filter | Tool rail orientation follows dock edge; furniture couples to library; tool state survives 2D/split switching |
| Canvas | Precision 2D work: draw, place, select, blueprint trace, snap/grid, measure | Full-bleed tldraw stage, live blueprint/grid/measurement overlays, drag/drop catalog placement | Panels and chrome cannot steal canvas interactions outside visible hit areas; selection drives inspector availability |
| 3D | GPU-backed review and confidence: inspect volume, furniture scale, material/placement sanity, client-facing preview | `Planner3DViewer` and `SplitViewLayout` 2D/3D/split modes | Split mode becomes a first-class QA target; selected-object properties remain consistent across 2D and 3D review; WebGL/GPU health is measured |

### Tool Switching Contract

Tool switching is a core planner behavior, not a chrome detail. The plan must protect the active tool, the tldraw tool, the planner store tool, the selected catalog item, and the visible UI state from drifting apart.

| Tool area | Rule |
|-----------|------|
| Single source of truth | A tool change must update `activeTool`, `activePlannerTool`, planner store tool, and current tldraw tool consistently. |
| Rail feedback | The tool rail must show the active tool immediately after click, hotkey, step change, catalog click, and view-mode switch. |
| Hotkeys | Existing tool hotkeys remain valid after chrome extraction and docking changes. |
| Step defaults | Draw defaults to wall, Place defaults to furniture, Review defaults to measure, but user-docked chrome placement is never reset by step changes. |
| Furniture tool | Selecting furniture opens/focuses Library, sets a valid active catalog item when needed, and arms placement instead of silently dropping an item. |
| Drawing tools | Wall, room, door, window, zone, and measure must keep canvas drawing behavior stable when panels are open. |
| Select/pan/erase | Native select, pan, and erase behavior must remain available and must not be hidden by the visibility filter. |
| Visibility filter | Tool visibility modes may hide nonessential tools, but cannot remove the active tool without switching to a valid visible fallback. |
| View switching | Switching 2D/split/3D must preserve active tool state; returning to 2D must restore the expected drawing/placement behavior. |
| Invalid transitions | If a tool is unavailable in a view or compact mode, the UI must show that state and choose a safe fallback explicitly. |

### Canvas Interaction Contract

Canvas behavior is the product. Chrome can move, panels can slide, and view modes can change, but canvas interactions must remain predictable.

| Interaction | Rule |
|-------------|------|
| Pointer routing | Docked chrome and panels only capture pointer events inside their visible hit areas. The rest of the canvas remains live. |
| Draw continuity | Wall/room/up-left drag normalization must continue to work after chrome extraction. |
| Catalog placement | Drag/drop and click-to-place behavior must remain stable with left panel open, collapsed, or icon-only. |
| Selection | Selecting objects updates inspector availability without changing workflow step or tool unless the user explicitly chooses another tool. |
| Empty canvas | Empty-canvas calls to action must not cover the active drawing surface once a drawing tool is selected. |
| Measurement overlays | Grid, snap indicator, blueprint, and measurement overlays must stay visually aligned with tldraw after layout/view changes. |
| Panel state | Opening or closing panels must not resize the tldraw page unexpectedly or leave stale camera/selection state. |
| Compact mode | Mobile/compact keeps bottom-dock behavior; desktop dock handles are disabled. |

### Context Menu / Right-Click Contract

Right-click is a planner interaction layer, not a browser accident. It must be designed deliberately because it competes with tldraw's native context behavior, browser menus, draw cancellation, toolbar docking, catalog actions, touch long-press, and keyboard context keys.

| Target | Required behavior |
|--------|-------------------|
| Empty 2D canvas | Offer canvas-safe actions such as paste when available, fit view, reset view, toggle grid/snap, import blueprint, and open library. |
| Selected planner object | Offer object-safe actions such as properties, duplicate, delete, rotate, lock/unlock, layer/order actions where supported, and focus in 3D when available. |
| Multi-select | Show group actions first: duplicate, delete, lock/unlock, align/group-like actions only when implemented; do not expose per-object controls that will misapply. |
| Active draw tool | Right-click should cancel the current segment/drag or finish/cancel the active gesture according to tool semantics; it must not unexpectedly open a destructive menu mid-draw. |
| Catalog item | Offer set as active placement, place/add, view details, and favorite/recent actions when implemented; do not silently place on right-click. |
| Toolbar or dock handle | Offer reset this widget, reset all chrome, collapse/expand where supported, and visibility options; never affect plan content. |
| Left/right panel empty area | Use panel-specific actions only if useful; otherwise allow normal browser behavior for text selection/input fields. |
| 3D object / split view object | Select/focus object, open properties, fit camera to object, and return to 2D edit where needed; do not imply direct 3D editing unless implemented. |
| Text inputs / editable fields | Preserve native text context menu behavior. |
| Compact/touch | Long-press maps to the same safe context actions, with larger hit targets and no desktop dock movement controls. |
| Keyboard | `Shift+F10` / context-menu key opens the same menu for the focused canvas object, catalog item, or toolbar control. |

Precedence rules:

- If tldraw native context behavior is still needed for core canvas editing, planner menus must extend or wrap it deliberately; do not accidentally suppress it.
- Browser native context menu may remain for text inputs and unsupported areas.
- Context actions that mutate plan content must enter undo/redo history.
- Context actions that only move chrome, open panels, change filters, or switch view mode must not enter plan-content history.
- Destructive actions require either a reversible undo path or a confirmation when the action cannot be undone.
- Opening a context menu must not change `plannerStep`, active tool, selection, catalog item, or view mode unless the user chooses an action.
- Context menu positioning must stay inside the viewport and avoid top bar/status bar/panel clipping.

Implementation file scope:

| Area | Files likely touched |
|------|----------------------|
| Canvas/object context menu | `features/planner/editor/PlannerWorkspace.tsx`, tldraw bridge/tool files as needed |
| Toolbar/dock context menu | `features/planner/editor/chrome/PlannerChromeWidget.tsx`, `AccessChrome.tsx`, `ToolsChrome.tsx` |
| Catalog item context menu | `features/planner/editor/PlannerLeftPanel.tsx` and catalog row/card components |
| Inspector/object actions | `features/planner/editor/inspector/PropertiesInspector.tsx` |
| 3D focus/context actions | `features/planner/3d/`, `SplitViewLayout.tsx` |
| Tests | `tests/planner-chrome.spec.ts`, plus unit tests for action/history classification if helpers are added |

### Final Architecture Contracts

These contracts are mandatory before implementation proceeds beyond M1. They close the main gaps that can make the planner feel random even when the layout looks correct.

#### Planner State Matrix

The planner must treat state as a coordinated matrix, not isolated React state. Any milestone that changes chrome, tools, panels, or view modes must preserve valid combinations of:

| State axis | Source today / target owner | Invariant |
|------------|-----------------------------|-----------|
| Workflow step | `usePlannerWorkspaceStore().plannerStep` | Step changes may set default tool/panels, but never move docked chrome. |
| Active rail tool | `PlannerWorkspace` state now; chrome/tool module target | Always matches visible rail highlight. |
| Active planner tool | Planner store + workspace state | Always matches intended planner behavior: wall, room, furniture, measure, etc. |
| Current tldraw tool | tldraw editor | Must match active planner tool or a documented safe fallback. |
| Drawing gesture | tldraw/custom tool state | Cannot be interrupted by panel/chrome state unless user cancels. |
| Selected object(s) | tldraw editor selection | Drives inspector availability without changing step/tool/view by itself. |
| Active catalog item | planner store | Required for furniture placement; never silently cleared by chrome movement. |
| Left/right panel state | `usePlannerPanels` | Panel automation must not override explicit user-opened state without a rule. |
| View mode | `PlannerWorkspace` view state | Orthogonal to workflow step; 3D does not imply Review. |
| Chrome layout | `planner-chrome-layout-v2` | Persisted separately from plan content and history. |

Invalid-state rule: if any action would produce a mismatch between rail tool, planner tool, and tldraw tool, the action must choose an explicit fallback, usually select, and update visible UI immediately.

#### Event Ownership

Every pointer, keyboard, and context-menu path needs an owner. Do not add handlers until ownership is clear.

| Event | Primary owner | Notes |
|-------|---------------|-------|
| Canvas draw/select/pan | tldraw + planner custom tools | Chrome/panels must not capture outside visible hit areas. |
| Catalog drag/drop | catalog panel + canvas drop bridge | Drag ghost/drop flash must stay aligned after layout changes. |
| Toolbar click/hotkey | planner chrome/tool module | Updates rail, planner store, and tldraw tool together. |
| Dock drag/keyboard nudge | chrome widget/provider | Moves chrome only; never enters plan history. |
| Right-click/context | target-specific owner | Canvas/object/catalog/toolbar/text input precedence follows the context contract. |
| Text input keys | focused input | Browser/text behavior wins over planner shortcuts. |
| Escape | escape stack owner | Close menu -> cancel drag/draw -> close transient panel -> deselect; exact order must be implemented and tested. |
| Delete/backspace | focused owner | Text inputs delete text; canvas selection delete only when canvas/editor owns focus. |
| 3D orbit/pan/zoom | 3D viewer | Must not trigger 2D draw tools or chrome drag. |

#### Undo / Redo Classification

Do not let chrome state pollute plan history.

| Action type | Enters plan undo/redo? |
|-------------|-------------------------|
| Create/delete/duplicate/move/resize/rotate planner object | Yes |
| Edit dimensions/material/properties that change exported plan content | Yes |
| Add/remove/modify wall, room, opening, zone, furniture, blueprint calibration | Yes |
| Change selection only | No |
| Change active tool | No |
| Open/close/collapse panels | No |
| Move/dock/reset chrome widgets | No |
| Switch 2D/split/3D view | No |
| Change catalog filter/search/recents view | No, unless saving a favorite/pin as content later |
| Camera orbit/pan/zoom in 3D | No, unless explicit saved camera presets are added later |

#### 3D Camera + Object Mapping

3D is only useful if it maps to planner objects predictably.

| Topic | Required rule |
|-------|---------------|
| Camera controls | Define orbit, pan, zoom, reset, fit plan, and focus selected object before claiming 3D review parity. |
| Camera state | View-only camera movement does not enter plan history; persistence is deferred unless explicitly implemented. |
| Selection sync | Selecting an object in 2D should make the same object inspectable in split/3D when a 3D counterpart exists. |
| Missing 3D counterpart | Use a dimensionally honest placeholder or clear unavailable state; do not hide the object silently. |
| Catalog dimensions | 2D footprint, 3D model scale, measurement labels, and export units must agree through the existing unit bridge. |
| Model/material loading | Slow/missing CDN/R2 assets show loading/fallback without breaking 2D tools. |
| 3D visibility | Hidden/locked/layer-filtered 2D objects must have defined behavior in 3D and export. |

#### Measurement, Units, Grid, Snap

The status bar cannot invent precision. It must display state that exists and has a source.

| Item | Required source/rule |
|------|----------------------|
| Unit system | `usePlannerWorkspaceStore().unitSystem` and measurement helpers. |
| Shape dimensions | Existing planner unit bridge; do not scatter ad hoc `* 10` or `/ 10`. |
| Grid state | `usePlannerUIStore().showGrid`. |
| Snap state | Show only if there is a real snap setting/source; otherwise label as planned/disabled, not active. |
| Cursor coordinates | Add only when reliable from the editor/camera transform. |
| Scale bar/ruler | Deferred unless implemented as a real helper/export object. |
| 3D status | In 3D mode, do not show 2D-only snap/grid as if direct 3D editing supports it. |

#### Stable Test Hooks

Playwright must not depend on fragile visual text or CSS implementation details.

Add stable hooks as needed:

| Surface | Required examples |
|---------|-------------------|
| Chrome host/widgets | `data-testid="planner-chrome-host"`, `planner-chrome-tools`, `planner-chrome-steps`, `planner-chrome-access` |
| Tool buttons | `data-tool-id`, `aria-pressed`, stable accessible label |
| Panels | `planner-left-panel`, `planner-right-panel`, active tab attributes |
| Canvas | `planner-canvas-surface`, tldraw container hook, drop target hook |
| 3D | `planner-3d-view`, `planner-3d-canvas`, renderer/environment debug hook |
| Context menus | `planner-context-menu`, action ids such as `duplicate`, `delete`, `reset-view` |
| Status | `planner-status-bar`, grid/snap/unit labels with source-backed state |

Test hooks are implementation API for verification. They should be stable, purposeful, and not tied to styling classes.

#### Input, Focus, And Accessibility

| Concern | Rule |
|---------|------|
| Focus order | Top bar -> tools/access -> canvas -> panels -> status must be predictable. |
| Roving toolbar focus | Toolbars should support arrow-key navigation without stealing text input keys. |
| `aria-pressed` | Toggle/tool buttons expose active state. |
| Escape stack | Menu, drag, draw gesture, panel, selection behavior must be ordered and tested. |
| Reduced motion | Dock/panel transitions respect reduced-motion preferences. |
| Touch targets | Compact/mobile controls use larger targets; desktop handles are not shown as mobile affordances. |
| Screen reader menu semantics | Context menus use roles/labels and announce disabled/destructive actions. |

#### Failure Recovery + Debug Evidence

| Failure | Required behavior |
|---------|-------------------|
| Corrupt chrome layout storage | Ignore invalid layout, restore defaults, do not break plan load. |
| Old `planner-chrome-dock-v1` data | Migrate tools/steps, drop old panel widgets safely. |
| Missing tldraw editor bridge | Disable tool actions with explanation; do not crash chrome. |
| Bad restored shape props | Use existing unit repair/normalization paths and log/document blocker if unrecoverable. |
| WebGL context lost | Show 3D fallback and keep 2D usable. |
| Missing model/asset | Render placeholder/loading state and keep object selectable. |
| Stale dev server/CSS | Verification must hard-refresh and record URL/server state when visual changes are checked. |

Add a development-only debug readout or test-accessible payload for active step, tool, tldraw tool, selected count, panel state, view mode, chrome layout version, WebGL renderer, and 3D render status. This is evidence infrastructure, not user-facing product UI.

#### Stop Gates

Do not proceed to the next milestone if any of these are true:

- M1 extraction changes visible behavior before the baseline is captured.
- Tool rail active state, planner store tool, and tldraw current tool drift.
- Existing `planner-custom-tools.spec.ts` fails and the failure is not understood.
- 3D/split view is blank, zero-size, or renderer/environment evidence is missing.
- Playwright tests rely on brittle CSS selectors when stable hooks are needed.
- Right-click or hotkeys break text input behavior.
- Chrome reset can affect plan content.
- `docs/Failures.md` has not been updated for a known unresolved blocker or skipped required proof.

### Tool Switch Test Matrix

Minimum browser coverage for the chrome work:

| Flow | Expected result |
|------|-----------------|
| Click wall -> draw wall | Rail, planner store, tldraw tool, and cursor behavior all match wall mode. |
| Hotkey wall -> room -> select | Active rail state and canvas behavior switch each time. |
| Draw step -> Place step -> Review step | Defaults become wall, furniture, measure without moving docked chrome. |
| Furniture tool with no catalog selected | A valid default catalog item is selected and library opens. |
| Furniture catalog click | Furniture placement is armed; item is not accidentally dropped unless intended by existing behavior. |
| Visibility filter hides a group | Active tool remains visible or safely changes to select with visible feedback. |
| Open left/right panels while drawing | Canvas still draws outside panel hit areas. |
| Switch 2D -> split -> 3D -> 2D | Active tool, selected object, and chrome layout survive the round trip. |
| Right-click selected object | Context menu opens object actions without changing tool/step/view. |
| Right-click active draw | Active draw cancels/finishes by defined tool semantics; no accidental destructive action. |
| Shift+F10 on focused toolbar button | Toolbar context menu opens with widget-safe actions only. |

### View Mode Rules

| Mode | Purpose | Chrome behavior | Panel behavior |
|------|---------|-----------------|----------------|
| 2D | Default drawing and placement | Tools fully active; status shows drawing confidence | Left/right follow step and selection rules |
| Split | Edit in 2D with 3D feedback | Tools remain available for 2D canvas; 3D preview must not obscure chrome | Inspector applies to selected object, regardless of whether user is checking 2D or 3D |
| 3D | Review, presentation, scale/material confidence | Drawing tools may remain visible but should not imply direct 3D drawing unless supported | Right inspector and workflow remain useful; status should describe view/selection confidence rather than fake snap state |

Non-negotiables:

- Switching 2D/3D/split must not reset the active planner tool.
- Switching view mode must not move docked chrome.
- 3D cannot become a hidden dead end; the user needs a clear path back to 2D drawing.
- 3D cannot ship on trust alone; browser verification must prove the 3D surface is nonblank and GPU/WebGL state is understood.
- Any future direct 3D editing must be explicitly planned; v1 only requires reliable review parity.

---

## GPU · WebGL · 3D Performance Contract

This is a hard requirement. The planner must not pretend 3D works because TypeScript passes or a panel opens. 3D must be verified in a real browser with WebGL/GPU checks.

### Environment Rule

GPU behavior is environment-specific. A browser running locally on a designer's machine, a Codex desktop browser, CI, and a remote/cloud host can expose different WebGL renderers. A successful WebGL context is not automatically proof of hardware GPU acceleration.

| Environment | What it can prove | What it cannot prove alone |
|-------------|-------------------|----------------------------|
| Local user browser | Real interactive behavior on that machine, hardware acceleration when exposed, practical 2D/split/3D feel | CI stability across machines |
| Codex desktop browser | Current workspace behavior, screenshots, nonblank canvas, basic WebGL capability | End-user hardware performance |
| CI / remote browser | Regression checks, fallback behavior, nonblank render, no zero-size canvas | Real GPU acceleration or smoothness on customer devices |
| Cloud region / hosted runtime | Server-side availability for build/test jobs only | Client-side GPU behavior unless it runs a real browser with exposed GPU |

If a browser reports SwiftShader, software rasterization, blocked GPU, or an unknown virtual renderer, the evidence must say so. Do not call that path GPU-accelerated.

### Runtime Requirements

| Requirement | Rule |
|-------------|------|
| WebGL detection | Detect whether WebGL/WebGL2 context can be created before treating 3D as available. |
| Renderer reporting | Capture renderer/vendor details where the browser exposes them, including software renderers such as SwiftShader. |
| GPU path | Prefer hardware-accelerated WebGL where the browser exposes it; do not force software rendering unless explicitly falling back. |
| Fallback | If WebGL/GPU is unavailable, show a clear 3D-unavailable state and keep 2D planner fully usable. |
| Split view | Split must keep 2D drawing responsive; 3D preview cannot monopolize pointer events, resize loops, or render work. |
| Nonblank render | 3D/split view must be checked by canvas pixels or screenshot evidence, not only DOM existence. |
| Resize stability | Switching 2D -> split -> 3D -> 2D must not leave WebGL canvas at zero size or stale dimensions. |
| Resource cleanup | View switching must not leak render loops, event listeners, model caches, or WebGL contexts. |
| Asset loading | Missing/slow 3D assets must degrade to placeholders or clear loading states without breaking canvas tools. |

### Performance Budgets

These are starting targets for v1 verification, not permanent ceilings:

| Scenario | Target |
|----------|--------|
| Open 3D view with a small plan | First nonblank frame within 2 seconds on a normal dev machine. |
| Switch 2D -> split | 2D canvas remains interactive within 500 ms after layout settles. |
| Toggle 2D/split/3D repeatedly | No progressive slowdown over 10 switches. |
| Drag/pan in 2D while split is open | No obvious input starvation from 3D render loop. |
| WebGL unavailable | User sees fallback within 1 second and can continue 2D work. |

If these targets fail, the implementation must either fix the issue or document the blocker in `docs/Failures.md`.

### Verification Requirements

Playwright/browser checks must include:

- WebGL availability probe in the page context.
- WebGL renderer/vendor capture when available; label software/virtual renderers honestly.
- 3D canvas/container has stable nonzero dimensions.
- 3D/split screenshot or pixel sample is nonblank after render settle.
- Repeated 2D/split/3D switching leaves one active render surface, not duplicated canvases.
- 2D drawing tool still responds after entering and leaving 3D.
- WebGL-disabled or context-failure path shows fallback and does not break 2D.
- Test output records the environment: local browser, Codex browser, CI/remote, or cloud-hosted runner.

Manual QA must include:

- Chrome or Edge with hardware acceleration enabled.
- Browser task manager/devtools check for runaway CPU/GPU during idle 3D view.
- A weaker-device pass when available, or a documented skip.
- Hard refresh after CSS/chrome changes to catch stale layout and zero-size WebGL canvases.
- Explicit note if verification ran in a region/remote environment where GPU is absent, virtualized, or unknown.

---

## Architecture Target

```text
features/planner/editor/chrome/
├── plannerChromeTypes.ts
├── plannerChromeLayout.ts
├── plannerChromeStorage.ts
├── PlannerChromeProvider.tsx
├── PlannerChromeHost.tsx
├── PlannerChromeWidget.tsx
└── widgets/
    ├── AccessChrome.tsx
    ├── StepsChrome.tsx
    └── ToolsChrome.tsx
```

`PlannerWorkspace.tsx` should become a consumer of chrome primitives, not the owner of drag math, storage shape, and widget composition.

### Storage

Current key:

```typescript
const PLANNER_CHROME_DOCK_STORAGE_KEY = "planner-chrome-dock-v1";
```

Target key:

```typescript
const PLANNER_CHROME_LAYOUT_STORAGE_KEY = "planner-chrome-layout-v2";

type PlannerChromeLayoutV2 = {
  version: 2;
  widgets: Record<"tools" | "steps" | "access", {
    edge: "left" | "right" | "top" | "bottom" | "free";
    offset: number;
    x?: number;
    y?: number;
  }>;
  panels: {
    leftCollapsed: boolean;
  };
};
```

Migration rule: when v2 is absent, read `tools` and `steps` from v1, ignore `panel-left` / `panel-right`, create default `access`, then persist v2 on the next layout write.

### CSS Target

```text
app/css/core/planner/bundles/workspace.css
├── planner-shell.css
├── planner-workflow.css
├── planner-controls.css
├── planner-overlays.css
├── planner-catalog.css
├── planner-responsive.css
├── workspace.css
├── planner-canvas-layout.css
├── planner-chrome.css
└── planner-typography.css
```

Rules:

- `planner-canvas-layout.css` owns stage, panels, and canvas geometry.
- `planner-chrome.css` owns dockable widget positioning, handles, orientation, access bar, and chrome z-index.
- `planner-typography.css` stays last.
- No component-level CSS imports.

---

## Milestones

| # | Focus | Outcome | Status |
|---|-------|---------|--------|
| M0 | Baseline lock | Confirm v0 behavior before edits | Pending |
| M1 | Chrome module extraction | Same UI, cleaner ownership | Pending |
| M2 | AccessChrome | One access bar replaces two panel reopen widgets | Pending |
| M3 | Smart docking | Safer snap, collision, orientation, tooltip side | Pending |
| M4 | Trust controls | Reset layout, keyboard nudge, a11y announcements | Pending |
| M5 | Benchmark parity | Collapse rail, inspector-on-select, tool-tab coupling, recents, 3D review parity | Pending |
| M6 | GPU/browser verification + docs | Tests, screenshots, WebGL/GPU checks, failures/docs updates | Pending |

## Execution Map

Use this map to execute the plan without wandering into unrelated planner surfaces.

### Primary Files

| Area | Files |
|------|-------|
| Workspace composition | `features/planner/editor/PlannerWorkspace.tsx` |
| Current dock wrapper | `features/planner/editor/PlannerDockableChrome.tsx` |
| Current dock math/storage | `features/planner/editor/plannerChromeDock.ts` |
| Tool rail | `features/planner/editor/PlannerToolRail.tsx` |
| Step bar | `features/planner/editor/PlannerStepBar.tsx` |
| Panel state | `features/planner/editor/usePlannerPanels.ts` |
| Left panel / library tabs | `features/planner/editor/PlannerLeftPanel.tsx` |
| Right inspector | `features/planner/editor/inspector/PropertiesInspector.tsx` |
| Status bar | `features/planner/editor/PlannerStatusBar.tsx` |
| 3D view | `features/planner/3d/` |
| 2D/3D split | `features/planner/shared/components/SplitViewLayout.tsx` |
| tldraw tool registration | `features/planner/tldraw/plannerTldrawRegistration.ts` |
| Rect draw behavior | `features/planner/tldraw/tools/rectDrag.ts` |
| Tool visibility | `features/planner/editor/plannerToolVisibility.ts` |
| Step/tool binding | `features/planner/editor/plannerStepBindings.ts` |
| Canvas layout CSS | `app/css/core/planner/planner-canvas-layout.css` |
| Workspace bundle | `app/css/core/planner/bundles/workspace.css` |

### Target New Files

| Milestone | Files |
|-----------|-------|
| M1 | `features/planner/editor/chrome/plannerChromeTypes.ts` |
| M1 | `features/planner/editor/chrome/plannerChromeLayout.ts` |
| M1 | `features/planner/editor/chrome/plannerChromeStorage.ts` |
| M1 | `features/planner/editor/chrome/PlannerChromeProvider.tsx` |
| M1 | `features/planner/editor/chrome/PlannerChromeHost.tsx` |
| M1 | `features/planner/editor/chrome/PlannerChromeWidget.tsx` |
| M1 | `features/planner/editor/chrome/widgets/ToolsChrome.tsx` |
| M1 | `features/planner/editor/chrome/widgets/StepsChrome.tsx` |
| M1 | `app/css/core/planner/planner-chrome.css` |
| M2 | `features/planner/editor/chrome/widgets/AccessChrome.tsx` |
| M1-M6 | `tests/planner-chrome-layout.test.ts` |
| M2-M6 | `tests/planner-chrome.spec.ts` |

### Execution Order

| Step | Work | Files | Proof |
|------|------|-------|-------|
| 0 | Baseline current v0 | no edits | `npm.cmd run typecheck`; planner custom tools Playwright |
| 1 | Extract chrome module with no visual behavior change | current dock files -> `features/planner/editor/chrome/`; `planner-chrome.css` | existing 17 Playwright tests + chrome layout Vitest |
| 2 | Add AccessChrome | `PlannerWorkspace.tsx`; `AccessChrome.tsx`; chrome storage/types | Playwright access toggle tests |
| 3 | Smart docking | `plannerChromeLayout.ts`; `PlannerChromeWidget.tsx`; `planner-chrome.css` | Vitest snap/collision/clamp tests |
| 4 | Reset + keyboard/a11y | chrome provider/widget/access; CSS focus states | reset/keyboard unit + Playwright tests |
| 5 | Benchmark parity | `PlannerLeftPanel.tsx`; `PropertiesInspector.tsx`; `PlannerToolRail.tsx`; status/3D files as needed | collapse, inspector, recents, 2D/split/3D tests |
| 6 | GPU/browser verification | `tests/planner-chrome.spec.ts`; 3D view hooks/selectors if needed | WebGL renderer evidence, nonblank screenshot/pixel checks |
| 7 | Docs closeout | `docs/Handover.md`; `docs/Failures.md` only if needed | docs reflect actual verified state |

### Implementation Rules

- Work milestone-by-milestone; do not combine M1-M5 unless explicitly requested.
- M1 must be visually neutral. If behavior changes, stop and fix or split the change.
- Do not touch `app/api/`, `proxy.ts`, `config/build/`, `platform/`, auth/session, migrations, generated schema, or top-level folder structure without explicit approval.
- Do not revive archived planner trees.
- Do not claim GPU acceleration from WebGL success alone; record renderer/environment evidence.
- Do not claim 3D works from DOM presence alone; require nonblank browser evidence.
- Preserve existing tool behavior before improving toolbar layout.
- Keep mobile/compact behavior separate from desktop docking.

### Required Commands

Baseline / M1:

```cmd
npm.cmd run typecheck
npx playwright test -c config/build/playwright.config.ts tests/planner-custom-tools.spec.ts
```

After adding Vitest chrome layout tests:

```cmd
npm.cmd run test:planner
```

After adding Playwright chrome tests:

```cmd
npx playwright test -c config/build/playwright.config.ts tests/planner-chrome.spec.ts
```

Before claiming v1 completion:

```cmd
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:planner
npx playwright test -c config/build/playwright.config.ts tests/planner-custom-tools.spec.ts
npx playwright test -c config/build/playwright.config.ts tests/planner-chrome.spec.ts
```

If tests are added, renamed, or removed:

```cmd
npm.cmd run docs:sync
```

### Evidence To Capture

| Evidence | Required for |
|----------|--------------|
| Typecheck output | Every milestone that touches TS/TSX |
| Existing 17 planner custom tools Playwright result | M0, M1, final |
| Chrome layout Vitest result | M1-M4 |
| Chrome Playwright result | M2-M6 |
| Screenshot/pixel nonblank 3D evidence | M5-M6 |
| WebGL renderer/environment report | M5-M6 |
| Manual QA notes for hard refresh and stale dev server | Any CSS/chrome visual change |
| `docs/Failures.md` update | Any unresolved blocker, skip, or failing required command |

### M0 — Baseline Lock

**Purpose:** capture the current state before moving chrome code.

Work:

- Run `npm.cmd run typecheck`.
- Run `npx playwright test -c config/build/playwright.config.ts tests/planner-custom-tools.spec.ts`.
- Note any unrelated failures in `docs/Failures.md`.
- Do not edit product code.

Done when:

- Baseline command output is known.
- Any blocker is recorded before implementation starts.

### M1 — Extract Chrome Module

**Purpose:** change ownership without changing pixels.

Work:

- Move `PlannerDockableChrome.tsx` and `plannerChromeDock.ts` into `features/planner/editor/chrome/`.
- Split types, storage, and layout math:
  - `plannerChromeTypes.ts`
  - `plannerChromeStorage.ts`
  - `plannerChromeLayout.ts`
- Add `PlannerChromeWidget.tsx` as the renamed generic dockable wrapper.
- Add `widgets/ToolsChrome.tsx` and `widgets/StepsChrome.tsx`.
- Move dock CSS from `planner-canvas-layout.css` to new `planner-chrome.css`.
- Import `planner-chrome.css` from `workspace.css` before `planner-typography.css`.

Acceptance:

- No visual behavior changes.
- v1 storage code still reads/writes v0 key unless M2 migration is included.
- Existing Playwright 17/17 remains green.
- New Vitest unit coverage for `snapPlannerChromePlacement`, storage fallback, and invalid placement fallback.

### M2 — AccessChrome

**Purpose:** replace floating one-off panel buttons with one predictable access strip.

Work:

- Add `widgets/AccessChrome.tsx`.
- Add `access` to chrome dock ids/defaults.
- Remove desktop `panel-left` and `panel-right` dock widgets from `PlannerWorkspace.tsx`.
- Access buttons:
  - Library toggle opens/closes left panel.
  - Inspector toggle opens/closes right panel.
  - Reset action can be stubbed behind M4 if needed, but button location is reserved.
  - Collapse-left action can be hidden until M5, but its layout slot is reserved to avoid another chrome reshuffle.
- Migrate storage to `planner-chrome-layout-v2`.

Acceptance:

- Library and inspector are reachable when their panels are closed.
- Access bar can be dragged independently on desktop.
- Access bar is absent on compact/mobile layout.
- Add Playwright coverage:
  - closed left panel opens from AccessChrome.
  - closed right panel opens from AccessChrome.
  - old v1 storage does not break v2 defaults.

### M3 — Smart Docking

**Purpose:** make docking feel intentional instead of just "nearest edge wins."

Work:

- Snap using widget center, not pointer location.
- Prevent overlapping docked widgets by staggering offsets on the same edge.
- Clamp widgets using widget dimensions, not only `0.08..0.92`.
- Add edge preview state while dragging.
- Keep tool rail vertical on left/right and horizontal on top/bottom.
- Compute tooltip side from dock edge.

Acceptance:

- Dragging tools over steps does not leave widgets stacked on top of each other.
- Top/bottom tool rail remains usable at common desktop widths.
- Free placement cannot disappear under panels, top bar, or status bar.
- Vitest: `tests/planner-chrome-layout.test.ts` covers snap, collision stagger, clamp, migration.

### M4 — Trust Controls

**Purpose:** let users recover from custom layouts and make drag accessible. This is based on AutoCAD-style dock/undock/reset expectations and Figma-style visible focus behavior.

Work:

- Add Reset layout action to AccessChrome or top bar menu.
- Double-click handle continues to reset a single widget.
- Add dock preview state before drop, similar to a palette outline/target.
- Keyboard nudge for focused chrome handle:
  - arrows move along current edge.
  - shift+arrows move faster.
  - home/end snap to edge bounds.
- Announce dock changes with polite `aria-live`.
- Add visible focus styles to handles and access buttons.

Acceptance:

- User can restore default layout without clearing localStorage manually.
- Keyboard-only user can move a widget and hear/read its new placement.
- Vitest covers reset and keyboard movement math.
- Playwright covers reset layout from a changed layout.

### M5 — Benchmark Parity

**Purpose:** close the highest-value UX gaps from the benchmark.

Work:

- Left panel icon collapse:
  - collapsed rail shows Library, Blueprint, AI icons.
  - expanded panel preserves active tab.
  - canvas gains the reclaimed width.
  - collapsed rail remains visible on desktop; hidden behind mobile dock on compact.
- Inspector on select:
  - selecting a planner shape makes inspector available from right panel outside Review.
  - if right panel is closed, AccessChrome inspector button indicates available selection.
  - optional preference: auto-expand right panel on selection, Figma-style, while left panel remains collapsed/minimized.
- Tool-to-tab coupling:
  - furniture opens/focuses Library.
  - wall/room keeps draw mode and may focus Blueprint only when a blueprint exists.
  - measure keeps right panel closed unless already open.
- Recents:
  - track last 8 placed catalog items locally.
  - show recents row at the top of Library.
  - do not introduce cloud/user sync yet.
- Status bar confidence:
  - show unit system.
  - show grid state.
  - show snap state when snap controls exist; otherwise reserve the label and do not fake behavior.
  - consider scale-bar helper as a later annotation/export feature, not a fake persistent ruler.
- 3D review parity:
  - 2D/3D/split switching preserves active tool and docked chrome placement.
  - right inspector stays meaningful for selected planner objects while in split or 3D review.
  - 3D view exposes a clear return to 2D drawing through existing top bar controls.
  - status bar avoids showing 2D-only snap/grid claims as active 3D editing behavior.
  - 3D view verifies WebGL/GPU availability and falls back cleanly when unavailable.
  - split view must not starve 2D canvas input or leave the 3D canvas blank.

Acceptance:

- Draw, Place, Review each feel distinct without hiding core tools.
- Furniture placement is one action from the rail to the library.
- Inspector can be reached from selection without switching to Review.
- Recents survive reload in local storage.
- 3D and split view remain usable after chrome changes.
- 3D/split view passes browser nonblank and WebGL availability checks.
- Add Playwright coverage:
  - left rail collapse/expand.
  - furniture tool opens library.
  - select shape then open inspector.
  - recent catalog item appears after placement.
  - switch 2D → split → 3D → 2D without losing selected tool/chrome layout.
  - 3D canvas/container renders nonblank and nonzero.
  - WebGL unavailable path keeps 2D usable.

### M6 — GPU / Browser Verification + Docs

**Purpose:** make the plan shippable, not just implemented. This milestone must prove the planner chrome did not damage 2D drawing, 3D rendering, split view, or GPU/WebGL behavior.

Work:

- Run:

```cmd
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:planner
npx playwright test -c config/build/playwright.config.ts tests/planner-custom-tools.spec.ts
npx playwright test -c config/build/playwright.config.ts tests/planner-chrome.spec.ts
```

- Add/run chrome-specific Vitest and Playwright tests from M1-M5.
- Add/run GPU/WebGL browser checks for 3D and split view.
- Capture screenshots or pixel-check evidence for 3D/split nonblank rendering.
- Record renderer/environment evidence; separate hardware-GPU proof from software/remote WebGL proof.
- Update `docs/Handover.md` planner chrome block with completed milestones.
- Update `docs/Failures.md` only for open failures, skips, or blockers.
- If tests are added/renamed, run `npm.cmd run docs:sync`.

Done when:

- Verification commands are green, or failures are documented with exact command and reason.
- 3D/split browser evidence exists; no "it mounted so it works" claims.
- GPU claims are qualified by renderer/environment evidence.
- The plan's completed milestone rows match the repo state.

---

## Step + Panel Behavior

| Step | Left panel | Right panel | Default tool | Catalog emphasis |
|------|------------|-------------|--------------|------------------|
| Draw | Collapsed or blueprint-focused when blueprint exists | Closed | Wall | Structure and trace |
| Place | Library open | Closed until selection/inspector request | Furniture | Interior catalog and recents |
| Review | Collapsed | Inspector open | Measure | Properties, layers, export |

Step changes may open panels and select tools, but must not rewrite docked widget placements.

Selection behavior:

- Selecting a room, wall, furniture item, opening, helper, or catalog shape may reveal right-panel availability.
- Selection must not change `plannerStep`.
- If the right panel auto-expands, deselecting may collapse it only when it was opened by selection automation, not when the user opened it manually.
- Multi-select should show group actions before per-object controls, following Floorplanner/Figma expectations.

View behavior:

- `viewMode` is orthogonal to `plannerStep`; switching to 3D must not silently put the workflow in Review.
- Split view should be the preferred mode for "draw and check" workflows.
- 3D-only mode should bias toward review/presentation, not precision drawing.
- Properties should describe the selected planner object consistently across 2D, split, and 3D where the selected object exists in the model.
- 3D and split mode must be verified through WebGL/GPU checks and nonblank render evidence.

---

## Test Plan

| Layer | Tests |
|-------|-------|
| Unit | `planner-chrome-layout.test.ts` for snap, clamp, collision, migration, reset math |
| Component / Vitest | Storage fallback and AccessChrome actions with mocked panel handlers |
| Playwright baseline | `tests/planner-custom-tools.spec.ts` remains required |
| Playwright new | `tests/planner-chrome.spec.ts` for access toggles, reset, collapse, selection inspector, recents, 2D/split/3D switching, WebGL/nonblank 3D checks |
| Manual QA | Desktop 1440x900, desktop 1280x720, compact/mobile width, hard refresh, localStorage migration |

Manual QA checklist:

- Canvas can pan/draw while left or right panel is open.
- Docked widgets do not cover top bar, status bar, or panel toggles.
- Tool rail remains usable on all four dock edges.
- AccessChrome is not present on compact layout.
- Reset layout restores defaults without affecting plan content.
- Reload preserves layout and recents.
- Selection expands or highlights inspector without switching workflow step.
- Left panel icon collapse preserves active tab and does not resize docked chrome unexpectedly.
- 2D/split/3D switching keeps the active tool, selected object, and docked chrome placement stable.
- 3D and split views render nonblank after chrome CSS extraction.
- WebGL/GPU availability is checked; fallback is visible and 2D remains usable when unavailable.
- Repeated view switching does not create duplicate render loops/canvases or progressive slowdown.

---

## Deferred

- Cloud-synced workspace layouts.
- Favorite/pinned catalog items beyond local recents.
- Drag-resizable panels.
- Named layout presets.
- Floating ruler widget.
- Multi-level/floor controls.
- Native tldraw palette replacement.
- Opening collision detection; tracked separately in `docs/Failures.md`.

---

## Sources

Research refreshed on 2026-06-16:

- [Planner 5D Menu Navigation Web](https://support.planner5d.com/en/articles/5876772-menu-navigation-web): upper menu plus left-side build/fill menu.
- [Planner 5D Catalogue Menu Web](https://support.planner5d.com/en/articles/5876855-catalogue-menu-web): catalogue is left-hand, room-by-room furnishing, 2D/3D switching remains important.
- [RoomSketcher Toolbar Buttons and Options](https://help.roomsketcher.com/hc/en-us/articles/14476178785437-Toolbar-Buttons-and-Options): top toolbar for common project/session commands.
- [RoomSketcher Edit a Floor Plan](https://help.roomsketcher.com/hc/en-us/articles/202306792-Can-I-Edit-a-Floor-Plan-After-I-Ordered-It): mode switching, right-side properties for rooms/doors/furniture, drag furniture from categories.
- [RoomSketcher Helper Symbols](https://help.roomsketcher.com/hc/en-us/articles/360000452245-How-Can-I-Add-Annotation-Text-and-Helper-Symbols-to-My-Floor-Plan): helpers include tape measures, scale bar, compass, and selected helper properties on the right.
- [RoomSketcher Favorites](https://help.roomsketcher.com/hc/en-us/articles/360000403249-Use-Favorites-for-Quick-Access-to-Your-Favorite-Products): favorites are mode/library-contextual.
- [Floorplanner Editor Manual](https://cdn.floorplanner.com/static/brochures/FloorplannerManualEN.pdf): furniture library, filters, favorites, drag/drop, selected item properties in sidebar, group selection.
- [Homestyler Design Interface](https://www.homestyler.com/forum/view/1486267589863034881): left catalog modules for room creation, model library, folders, customization.
- [Homestyler Floor Plan Designer Guide](https://www.homestyler.com/blog/446): create rooms, building toolbar, furniture catalog, 2D/3D usage.
- [magicplan Create Your First Floor Plan](https://help.magicplan.app/create-your-first-floor-plan): app-first project editing, room creation methods, object details/dimensions.
- [magicplan Manual Scan](https://help.magicplan.app/scan-a-room-in-seconds-using-lidar): AR/LiDAR scan flow and mode switching for room capture.
- [AutoCAD Docking/Floating/Anchoring Palettes](https://help.autodesk.com/view/ACD/2027/ENU/?caas=caas%2Fdocumentation%2FACD%2F2014%2FENU%2Ffiles%2FGUID-893A3C0A-C735-49E4-878E-C8641DEAD618-htm.html): dock, undock, anchor, auto-hide, palette outline behavior.
- [Figma Right Sidebar Properties](https://help.figma.com/hc/en-us/articles/360039832014-Design-prototype-and-explore-layer-properties-in-the-right-sidebar): left navigation, bottom toolbar, right properties panel, selection-driven properties.
- [Figma Left Sidebar / Minimize Panels](https://help.figma.com/hc/en-us/articles/360039831974-View-layers-and-pages-in-the-left-sidebar): minimize/expand panels, right panel expands on selection while left remains minimized.

---

## v1 Complete When

1. Chrome code lives under `features/planner/editor/chrome/` with clear storage/layout/widget boundaries.
2. Desktop has exactly three dockable widgets: tools, steps, access.
3. Panels slide or collapse without blocking the canvas outside their visible hit areas.
4. Tools, canvas, and 3D have explicit behavior parity: active tool persists, canvas stays interactive, and 3D/split review remains usable.
5. GPU/WebGL behavior is explicitly verified: nonblank 3D render, fallback path, split-view responsiveness, no runaway render loops.
6. Furniture opens/focuses library; selection makes inspector available; left rail can collapse to icons.
7. Layout persists, migrates from v1 storage, and resets.
8. Typecheck, relevant Vitest, and Playwright planner chrome coverage are green or blockers are logged.

---

## Recommended Next Action

Do **M0 + M1** first. Keep the first implementation PR/session visually neutral: move ownership, split CSS, add layout/storage tests, and prove the existing 17 Playwright tests still pass. Then do **M2** as the first visible UX change.
