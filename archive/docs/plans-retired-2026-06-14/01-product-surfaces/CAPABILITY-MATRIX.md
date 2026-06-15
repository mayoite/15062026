# 07 — Planner Capability Matrix

*Created: 2026-06-11 — Competitive analysis and priority recommendations.*
*Updated: 2026-06-13 — 0504 parity and live verification refreshed; cross-ref `06-TESTING.md` for gate evidence.*

## Product Lens

Oando should not become a generic home-design clone. Its strongest position is an accurate **furniture-space planner** that connects Oando products, dimensions, finishes, BOQ, quoting, and branded client output.

Capability ideas may be inspired by public products and open-source projects. Reuse code or assets only after license and provenance review. Copy capabilities, not proprietary symbols, templates, visual identity, wording, or private behavior.

---

## Live Status (2026-06-13)

| Check | Command / artifact | Result |
|---|---|---|
| TypeScript | `npm.cmd run typecheck` | **pass** |
| Planner unit tests | `npm.cmd run test:planner` | **181/181 pass** |
| Catalog SVG QA | `tests/planner/svg-qa.test.ts` | **121 items**, 0 failures |
| Full catalog sheet | `npm run catalog:qa:sheet` | `results/catalog-qa/` |
| Block semantics | `tests/planner/buildBlock2D.test.ts` | SH/NS, flip-tops, meeting/cabin |
| Geometry primitives | `tests/planner/geometry.test.ts` | dist, projectT, segment snap |
| Production build | `npm run build` | **pass on 2026-06-12; not re-run after 0504 parity repairs** |
| Lint | `npm.cmd run lint` | **fail, 25 errors** |
| Release gate | `npm run release:gate` | **blocked** at lint (see `06-TESTING.md`) |

**Legend for Status column:** **Ship** = verified in code + tests; **Partial** = works but gaps remain; **Gap** = not implemented or no proof; **Research** = intentionally deferred.

---

## Authoritative Product Rules (verified)

These are Oando-specific semantics confirmed in code and tests — not generic planner defaults.

| Rule | NS (non-sharing) | SH (sharing) |
|---|---|---|
| Chair layout | All chairs on one side | Face-to-face both sides |
| Footprint @ 1200 mm module | Length = bays × 1200; depth **600** | Same length; depth **1200** |
| `seatCount` in catalog | Bays along run | Bays along run (not people) |
| People on SH | — | `bays × 2` (e.g. 4 bays @ 4800 mm → **8 people**) |
| Meeting flip-tops | L &lt; 1800: 0; 1800–2400: 2; &gt; 2400: `2 + ceil((L−2400)/1200)` | same |

**Evidence:** `lib/catalog/geometry.ts` (`sharingPeopleCount`), `lib/catalog/blocks2d.ts`, `tests/planner/buildBlock2D.test.ts`. Bridge chair-count tests exist in `catalogBlockBridge.test.ts` but are **not in Vitest CI path** — see `10-MIGRATION-PHASES.md` Phase 0 tooling.

---

## Capability Comparison Table

| Capability | Market benchmark | Current Oando | Status | Priority | Evidence |
|---|---|---|---|---|---|
| **Exact wall/room/door/window editing** | RoomSketcher typed lengths; wall-snapped openings | Tldraw custom shapes + tools in `features/planner/tldraw/` | **Partial** | **P0** | `08-GEOMETRY-STATUS.md`; `geometry.test.ts`; typecheck clean |
| **Blueprint import & calibration** | RoomSketcher trace + scale | `BlueprintPanel`, `BlueprintUnderlay`, two-point calibration | **Partial** | **P0** | M3 done in `02-PLANNER.md`; PDF crop/rotate QA open |
| **PDF blueprint session workflow** | Multi-page plan trace workflows | PDF page render, page switching, nudge/center/scale, canvas move HUD | **Partial** | **P0** | 0504 parity increment; `blueprintPdfSession.test.ts`, `blueprintTraceGuide.test.ts` |
| **Oando product symbol library** | SmartDraw data-rich symbols; RoomSketcher libraries | 121 catalog items; 2.5D SVG blocks; mm footprints | **Ship** | **P0** | `svg-qa.test.ts`; `catalog:qa:sheet`; `blocks2d.ts` |
| **SH/NS workstation semantics** | Competitors use generic bench icons | Bays, depth, chair count, sharing occupancy encoded | **Partial** | **P0** | `buildBlock2D.test.ts` in CI; `catalogBlockBridge.test.ts` orphaned |
| **Meeting / cabin table blocks** | Conference tables with modules | Flip-top boxes, chairs, cabin accessories | **Ship** | **P0** | `buildBlock2D.test.ts` (flip-top counts) |
| **Measurements & clearances** | RoomSketcher area + dimensions | Plan metrics, dimension labels, status bar totals | **Partial** | **P0** | `planMetrics`; auto-dimension layout open |
| **Layer management / object organization** | SmartDraw layer/object panels | Right rail manager with group filters, search, multi-select, lock, fit, align/distribute, reorder | **Partial** | **P0** | 0504 parity increment; `LayerManagerPanel`, `layerManagerEntries.test.ts` |
| **Visual snap feedback** | RoomSketcher snap guides | `SnapIndicatorOverlay` on wall/room/door/zone tools | **Ship** | **P0** | `SnapIndicatorOverlay.tsx`; `08-GEOMETRY-STATUS.md` |
| **Opening collision detection** | No overlap on same wall | Snapping only; no rejection path | **Gap** | **P1** | `Failures.md`; Plan 08 |
| **Branded 2D output / BOQ** | Labels, brand colors, itemised lists | JSON export, branded PDF, BOQ from canvas | **Partial** | **P0** | `exportActions.ts`; `buildPlannerDocumentFromEditor` |
| **2D/3D synchronized preview** | Immediate 3D from 2D plan | R3F split view; extruded `FurnitureMesh3D` | **Partial** | **P1** | `FurnitureMesh3D.tsx`; GLB pipeline open |
| **3D camera experience** | Orbit + walkthrough modes | Current viewer has orbit-focused preview; 0504 has walk/orbit donor direction | **Gap** | **P1** | Donor `Planner3DViewer`; not yet adapted |
| **Furniture finish variants** | Material swap with 3D feedback | Category materials; procedural meshes | **Partial** | **P1** | Per-SKU GLB + finish schema open |
| **Collision & clearance rules** | Circulation + overlap checks | Bounding snap; no polygon rejection | **Gap** | **P1** | `flatten-js` / `martinez` candidates below |
| **Parametric building blocks** | RoomSketcher simple shapes | `buildBlock2D` procedural generation | **Ship** | **P1** | `blocks2d.ts`; desk/meeting/infra builders |
| **Oando BOQ → quote / cart** | Shopping list + pricing | BOQ export + quote-cart bridge | **Partial** | **P0** | Export works; INR/GST in quote PDF not confirmed |
| **India-market: INR, GST, IS rooms** | No direct competitor | BOQ exists; INR in catalog data; GST/IS templates not shipped | **Gap** | **P0 BOQ / P1 templates** | `catalogData.ts` (INR field); `15-STRATEGIC-GAPS.md` |
| **Persistence (member saves)** | Cloud sync | Drizzle `plans` + IndexedDB autosave | **Partial** | **P0** | `npm run db:test`; admin `planner_saves` split open |
| **Guest → member continuity** | Signup keeps guest work | IndexedDB claim on first canvas visit | **Partial** | **P0** | `guestToAuthMigration.test.ts`; server path open |
| **AI layout / furnish** | Planner 5D / My3DPlanner suggestions | Advisor chat + furnish intents wired | **Partial** | **P2** | `/api/planner/ai-advisor`; rule-based not generative |
| **Custom symbol libraries** | SmartDraw team libraries | No authoring/approval workflow | **Gap** | **P2** | — |
| **Compliance checks** | Pro planner circulation/accessibility checks | Donor compliance exists; current launch planner has no proven user-facing rules panel | **Gap** | **P1** | 0504 `lib/compliance.ts`; needs current-shape adapter + tests |
| **Product substitution** | Find equivalent/fit alternatives | Donor direction exists; no current UI/API proof | **Gap** | **P1** | 0504 handover; needs Oando catalog contract |
| **Automatic plan recognition** | Image → editable plan | Manual underlay + trace only | **Research** | **P3** | High risk; defer |
| **Photorealistic / 4K render** | Planner 5D quality renders | R3F functional preview | **Research** | **P3** | Not launch scope |
| **360 / AR / Vision Pro** | Immersive modes | No launch evidence | **Not now** | — | — |
| **Real-time collaboration** | RoomSketcher offline + sync | Local autosave; no conflict resolution | **Gap** | **P3** | `concurrentSaveConflict.test.ts` missing |
| **B2B designer tier** | Pro workspaces, white-label | All users identical | **Gap** | **P1** | Product roadmap |
| **Showroom / dealer integration** | Oando physical showrooms | No digital ↔ showroom link | **Gap** | **P1** | Unique differentiator; not started |

---

## P0 Gaps (launch blockers vs benchmarks)

| Gap | Why it matters | Next step | Owner doc |
|---|---|---|---|
| ESLint / `release:gate` | Cannot ship without CI green | Fix 25 current lint errors | `06-TESTING.md`, `10-MIGRATION-PHASES.md` |
| Orphaned co-located tests | SH bridge tests not in `test:planner` | Move `catalogBlockBridge.test.ts` → `tests/planner/` | `10-MIGRATION-PHASES.md` Phase 0 |
| Admin `planner_saves` vs Drizzle `plans` | Dual persistence; data drift risk | Migration or admin-only contract | `05-BACKEND-AND-DATA.md` |
| Opening collision on walls | RoomSketcher-quality editing | Implement overlap check on wall segment | `08-GEOMETRY-STATUS.md` |
| INR + GST in quote PDF | India-market P0 differentiator | Schema + PDF line items | `15-STRATEGIC-GAPS.md` |
| Server save round-trip test | M4 acceptance | Live DB save → load → compare | `06-TESTING.md` |
| GLB asset pipeline | 3D quality vs Planner3D | glTF Transform + Oando models | This file § Open-Source |

---

## Open-Source Inspiration

| Project/Library | License | Useful idea | Decision |
|---|---|---|---|
| [tldraw](https://github.com/tldraw/tldraw) | Production license required | Canvas, shapes, history | **Keep** — `NEXT_PUBLIC_TLDRAW_LICENSE_KEY` wired |
| [Blueprint3D](https://github.com/furnishup/blueprint3d) | MIT (legacy) | Wall graph, 2D→3D | **Study algorithms** only |
| [flatten-js](https://github.com/alexbol99/flatten-js) | MIT, active | Planar geometry | **Strong candidate** for collision/clearance |
| [martinez-polygon-clipping](https://github.com/w8r/martinez) | MIT, active | Polygon ops, room area | **Candidate** after benchmarks |
| [PDF.js](https://github.com/mozilla/pdf.js) | Apache-2.0 | PDF blueprint pages | **Strong candidate** for underlay import |
| [pdf-lib](https://github.com/Hopding/pdf-lib) | MIT | Vector PDF export | **In use** for branded exports |
| [React Three Fiber](https://github.com/pmndrs/react-three-fiber) | MIT | Scene composition | **Keep** — improve meshes/assets |
| [glTF Transform](https://github.com/donmccurdy/glTF-Transform) | MIT | Compress GLB | **Adopt** when Oando 3D models land |
| [react-three-rapier](https://github.com/pmndrs/react-three-rapier) | MIT | Physics/collision | **Selective** — prefer deterministic 2D geometry |

---

## Recommended Implementation Order (current)

1. **Unblock CI** — fix the 25 lint errors → full `release:gate` (`06-TESTING.md`)
2. **Stabilize 0504 parity imports** — keep layer/blueprint/draft/session gains, remove donor-contract lint and dead compatibility assumptions
3. **Close persistence split** — Drizzle `plans` canonical; admin `planner_saves` migrated or documented
4. **Opening collision** — wall-segment overlap rejection (`08-GEOMETRY-STATUS.md`)
5. **India BOQ** — INR line items + GST fields in quote PDF
6. **0504 candidate pass** — compliance checks, substitutions, templates, minimap/ruler, and 3D walk/orbit only after contract/test review
7. **3D quality** — Oando GLB assets via glTF pipeline; keep `FurnitureMesh3D` fallback
8. **Rule-based AI furnish** with explicit user approval (no silent layout overwrite)
9. **Plan recognition / photoreal** — research only after core loop ships

---

## Cross-References

| Topic | Doc |
|---|---|
| Test matrix & gate | `06-TESTING.md` |
| Geometry inventory | `08-GEOMETRY-STATUS.md` |
| Phase 0 foundation | `10-MIGRATION-PHASES.md` |
| Milestones M0–M6 | `02-PLANNER.md` |
| Release scores | `03-QUALITY-LEDGER.md` |
| Persistence / DB | `05-BACKEND-AND-DATA.md` |
| India product vision | `15-STRATEGIC-GAPS.md` |

---

## External Evidence Links

- [My3DPlanner solutions](https://www.my3dplanner.com/en/solutions/)
- [RoomSketcher draw floor plans](https://www.roomsketcher.com/features/draw-floor-plans/)
- [RoomSketcher trace blueprint](https://www.roomsketcher.com/features/pro-features/draw-from-a-blueprint/)
- [RoomSketcher furniture library](https://www.roomsketcher.com/features/pro-features/more-furniture/)
- [RoomSketcher measurements](https://www.roomsketcher.com/features/pro-features/measurements/)
- [SmartDraw custom shapes](https://www.smartdraw.com/floor-plan/custom-shapes-libraries.htm)
- [Planner 5D](https://planner5d.com/)
