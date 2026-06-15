# 04 - Planner Capability Matrix

*Created: 2026-06-11. This is a decision aid, not proof of implementation.*

## Product Lens

Oando should not become a generic home-design clone. Its strongest position is an accurate furniture-space planner that connects Oando products, dimensions, finishes, BOQ, quoting, and branded client output.

Capability ideas may be inspired by public products and open-source projects. Reuse code or assets only after license and provenance review. Copy capabilities, not proprietary symbols, templates, visual identity, wording, or private behavior.

## Capability Table

| Capability | Market evidence | Current Oando evidence | Feasibility | Recommendation |
|---|---|---|---|---|
| Exact wall, room, door, and window editing | RoomSketcher supports typed wall lengths and wall-snapped openings. My3DPlanner exposes structural drawing and resizing. | Custom Tldraw shapes and tools exist under `features/planner/tldraw/`. | High, but current Tldraw type errors must be resolved first. | **P0:** stabilize core geometry, snapping, typed dimensions, and connected-wall edits. |
| Blueprint/image import and calibration | RoomSketcher and SmartDraw import plans, set scale, then trace. | `BlueprintPanel`, `BlueprintUnderlay`, and `CalibrationCapture` implement an initial two-point workflow. | High. PDF pages, crop/rotate, visibility, and accuracy QA remain. | **P0:** finish the existing workflow before attempting AI recognition. |
| Oando product symbol library | SmartDraw uses scaled, data-rich reusable symbols. RoomSketcher uses categorized furniture/material libraries and controlled product selections. | Catalog ingest, block previews, catalog IDs, managed products, and BOQ adapters exist. | Very high and commercially differentiating. Main cost is product data, assets, taxonomy, and QA. | **P0:** make approved Oando SKUs, dimensions, finishes, search, and collections the product center. |
| Furniture finish/material variants | RoomSketcher offers replaceable materials with immediate 3D feedback. Planner 5D and My3DPlanner emphasize finish customization. | Furniture records include material-related fields; the 3D viewer currently renders mostly generic boxes/materials. | Medium-high after a clean product/asset schema. | **P1:** support curated Oando finish variants, not unrestricted material editing initially. |
| Measurements and clearances | RoomSketcher supports room area, room dimensions, inside/outside wall dimensions, item distances, and total area. | Measurement shapes/tools and plan metrics exist. | High for basic dimensions; medium-high for automatic dimension layout and collision-free labels. | **P0:** wall, room, item-clearance, and total-area measurements with metric/imperial display. |
| Branded 2D output styles | RoomSketcher supports labels, measurement toggles, brand colors, logos, letterheads, transparent backgrounds, and style templates. | Branded PDF and BOQ export code exists. | High for presets; medium for robust print layout and transparent exports. | **P1:** create Oando proposal, technical, and client-presentation presets. |
| 2D/3D synchronized preview | All reviewed planners treat 3D as an immediate visualization of the 2D plan. | R3F viewer and planner scene model exist, but furniture is mostly generic geometry. | High for structural sync; medium-high for production-quality models and materials. | **P1:** reliable synchronization and camera framing before photorealism. |
| Collision and clearance rules | Professional space planning requires overlap detection and usable circulation, even when competitor pages do not expose their internal algorithms. | Current code has snapping and alignment, but no proven collision-rejection path or dedicated collision tests. | High for deterministic 2D bounding/polygon checks; unnecessary complexity if implemented as full physics. | **P1:** add warnings and optional placement rejection using 2D geometry; do not use a physics engine for ordinary layout rules. |
| Oando BOQ, quote, and shopping list | Planner 5D exposes cost/shopping-list concepts; SmartDraw attaches data to symbols. | BOQ, CSV/JSON/PDF export, and quote-cart bridge exist. | Very high and more valuable to Oando than generic decor features. | **P0:** ensure every placed SKU produces a trustworthy quantity, finish, dimension, and quote handoff. |
| Custom user/team symbol libraries | SmartDraw allows imported or drawn custom symbols organized into shared libraries. | No complete authoring and approval workflow is evident. | Medium for private image symbols; high for governed shared libraries and 3D assets. | **P2:** begin with admin-approved Oando libraries; defer arbitrary user libraries. |
| Parametric building blocks | RoomSketcher supports simple shapes for custom benches, counters, and displays. | Procedural 2D block generation exists. | High for rectangles/circles and dimensioned modules; medium for compound editable shapes. | **P1:** dimensioned worktops, benches, storage runs, partitions, and modular workstation assemblies. |
| Automatic floor-plan recognition | Planner 5D and RoomSketcher market image-to-editable-plan workflows. | Manual underlay calibration and tracing exist; no proven recognition pipeline is evident. | Possible but high-risk: model accuracy, training data, correction UX, and compute cost dominate. | **P3 research:** only after manual tracing is excellent; require human-review and correction flow. |
| AI layout/furnish suggestions | My3DPlanner and Planner 5D market AI suggestions or room design. | Planner advisor endpoints and chat UI exist. | Medium for rule-based suggestions; high for dependable generative layouts. | **P2:** start with constraints, Oando catalog availability, circulation, and ghost-preview acceptance. |
| Photorealistic/4K rendering | Planner 5D and My3DPlanner market high-quality or AI renders. | Current R3F viewer is a functional preview, not a rendering pipeline. | Possible but expensive in assets, lighting, compute, and wait-time UX. | **P3:** use a separate queued rendering service later; do not block planner utility on it. |
| 360 walkthrough / AR / Vision Pro | Planner 5D markets immersive presentation modes. | No launch-ready evidence. | Technically possible, weak near-term value relative to core accuracy and catalog conversion. | **Not now:** revisit after 2D, 3D, BOQ, export, and mobile interaction are reliable. |
| Real-time collaboration and cross-device offline sync | RoomSketcher highlights offline work and cloud sync; Planner 5D highlights cross-platform use. | Local autosave, persistence, and some sync infrastructure exist. | High complexity due to conflict resolution, permissions, and migration guarantees. | **P3:** first make single-user persistence trustworthy and versioned. |

## Open-Source Inspiration

| Project/library | License/status | Useful idea | Decision |
|---|---|---|---|
| [tldraw](https://github.com/tldraw/tldraw) | Production use requires compliance with the current tldraw license. | Infinite canvas, shape/tool framework, history, interaction primitives. | **Keep**, but confirm the production license and isolate planner domain geometry from SDK internals. |
| [Blueprint3D](https://github.com/furnishup/blueprint3d) | MIT; original project is old. | Wall graph, rooms, furniture placement, and 2D-to-3D concepts. | **Study algorithms**, do not adopt the old application wholesale. |
| [Blueprint3D Modern](https://github.com/charmlinn/blueprint3d-modern) | MIT; new project with limited adoption. | Modern TypeScript/Three.js rewrite and IndexedDB-oriented demo architecture. | **Evaluate**, with maturity and provenance review. |
| [react-planner](https://github.com/cvdlab/react-planner) | MIT; limited recent activity. | SVG floor-plan interaction and 3D navigation patterns. | **Reference only**; replacing Tldraw would create unnecessary churn. |
| [flatten-js](https://github.com/alexbol99/flatten-js) | MIT; active. | Robust planar geometry primitives and intersections. | **Strong candidate** for wall/room geometry if native code proves unreliable. |
| [martinez-polygon-clipping](https://github.com/w8r/martinez) | MIT; active. | Polygon union, intersection, difference, and room-area operations. | **Candidate** for room and zone operations after focused benchmarks. |
| [PDF.js](https://github.com/mozilla/pdf.js) | Apache-2.0; active. | Render PDF blueprint pages for import and calibration. | **Strong candidate** for completing PDF underlays. |
| [pdf-lib](https://github.com/Hopding/pdf-lib) | MIT. | Generate and stamp vector PDF documents. | **Candidate** for robust branded proposal and technical exports. |
| [Paper.js](https://github.com/paperjs/paper.js) | MIT. | Vector paths, intersections, offsets, and geometry operations. | **Evaluate against flatten-js** with focused wall/room benchmarks; adopt one geometry layer, not both by default. |
| [zundo](https://github.com/charkour/zundo) | MIT; Zustand-specific. | Scoped temporal undo/redo. | **Evaluate** only if Tldraw history cannot cover document-level actions cleanly. |
| [React Three Fiber](https://github.com/pmndrs/react-three-fiber) | MIT; active and already used. | React scene composition over Three.js. | **Keep**. Improve asset and scene architecture rather than replace it. |
| [glTF Transform](https://github.com/donmccurdy/glTF-Transform) | MIT; active. | Optimize, deduplicate, compress, and validate glTF/GLB assets. | **Adopt in the asset pipeline** when Oando 3D models are introduced. |
| [react-three-rapier](https://github.com/pmndrs/react-three-rapier) | MIT; active. | Physics and collision primitives. | **Use selectively**; 2D placement constraints should remain deterministic geometry, not physics simulation. |
| [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) | MIT. | Fast 3D raycasting and mesh spatial queries. | **Candidate later** for precise 3D picking or mesh diagnostics, not the first solution for 2D furniture overlap. |
| [Open Configurator](https://github.com/rndaorg/open-configurator) | MIT; maturity review required. | Product option and variant configuration patterns. | **Reference** for finish/option schema and UX; do not import a second product platform wholesale. |
| [OpenJSCAD](https://github.com/jscad/OpenJSCAD.org) | MIT; active. | Parametric solid generation. | **Prototype only** for configurable furniture modules; avoid adding it to the core editor prematurely. |
| Sweet Home 3D / LibreCAD | GPL-family or license review required; desktop architectures. | Mature UX and geometry concepts. | **Study behavior only** unless a separate legal/architecture review approves code reuse. |

## Recommended Order

1. Repair planner validation so typecheck, lint, and planner tests are meaningful.
2. Finish exact 2D geometry, snapping, dimensions, and blueprint tracing.
3. Make Oando catalog placement, variants, BOQ, quote, and branded export trustworthy.
4. Improve synchronized 3D with optimized Oando GLB assets.
5. Add rule-based layout assistance with explicit user approval.
6. Research plan recognition and photorealistic rendering only after the core loop is stable.

## Evidence

- [My3DPlanner solutions](https://www.my3dplanner.com/en/solutions/)
- [RoomSketcher draw floor plans](https://www.roomsketcher.com/features/draw-floor-plans/)
- [RoomSketcher trace a blueprint](https://www.roomsketcher.com/features/pro-features/draw-from-a-blueprint/)
- [RoomSketcher furniture library](https://www.roomsketcher.com/features/pro-features/more-furniture/)
- [RoomSketcher custom 2D plans](https://www.roomsketcher.com/features/pro-features/customize-2d-floor-plans/)
- [RoomSketcher measurements](https://www.roomsketcher.com/features/pro-features/measurements/)
- [SmartDraw custom shapes and libraries](https://www.smartdraw.com/floor-plan/custom-shapes-libraries.htm)
- [SmartDraw import and scale](https://www.smartdraw.com/floor-plan/import-and-scale.htm)
- [Planner 5D](https://planner5d.com/)
