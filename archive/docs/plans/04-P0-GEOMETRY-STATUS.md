# Plan 04 - P0 Geometry Editing Status

## Assessment Date: 2026-06-11

---

## 1. WallTool.ts - Wall Drawing and Editing

### IMPLEMENTED (working)
- **Typed wall lengths**: Walls store lengthMm computed from pixel distance. Min 100mm enforced.
- **Connected wall edits**: moveWallEndpoint propagates to all walls sharing vertex. splitWallAtPoint splits wall into two.
- **Junction detection**: L/T/cross junctions detected on wall complete via getJunction().
- **Wall snapping**: snapEditorPointOrGrid() snaps to grid, wall endpoints, midpoints, edge points, and wall segments.
- **Material + thickness**: drywall(100mm), brick(200mm), glass(12mm), concrete(200mm), wood(150mm).
- **Dimension display**: showDimensions:true renders mm/m label above wall midpoint, rotated to angle.
- **Editable dimensions**: Double-click label prompts for length in meters, wall rescales proportionally.

### IMPLEMENTED (this session)
- **Shift-key angle constraint**: Holding Shift constrains to 45deg increments via constrainToAngle().
- **snapWallEndpoint()**: Composite function - angle constraint first (if Shift), then grid+geometry snap.

### MISSING / FUTURE
- Visual snap indicator overlay (no crosshair when snap engages)
- Typed wall length input during draw (only after placement)
- Chain wall drawing click-click mode (currently press-drag-release)

---

## 2. Snapping System (tldrawSnap.ts + snapManager.ts)

### IMPLEMENTED (working)
- Snap to grid (rounds to nearest gridSpacing, default 20px)
- Snap to wall endpoints (corners)
- Snap to wall midpoints (centerline)
- Snap to wall edge points (5 evenly-spaced along each wall)
- Snap to wall segment (closest point on line)
- Snap to room/zone polygon vertices and edge midpoints
- Configurable threshold (snapDistance default 10, snapThreshold min 12)
- Exclude self from snap candidates during draw

### IMPLEMENTED (this session)
- constrainToAngle(): Snaps to nearest N-degree increment (default 45) relative to origin
- snapWallEndpoint(): Shift-aware composite snap for wall tool
- angle-constraint kind added to EditorSnapResult type

### MISSING / FUTURE
- Snap visual feedback (no visible snap-line or snap-dot)
- Axis-aligned snap guides (no H/V guide lines when aligned with other walls)

---

## 3. Door/Window Placement (DoorWindowPlacementTool.ts)

### IMPLEMENTED (working)
- Wall-snapped placement via snapOpeningToWall()
- Auto-rotation to match wall direction
- 7 preset door/window sizes (800/900/1200mm doors, 600/1200/1800mm windows)
- Preview during drag (semi-transparent ghost)
- Wall attachment metadata (wallId, wallPosition, isAttached)
- Swing direction (left/right/both) configurable
- Type variants: single/double/sliding/folding doors; single/double/sliding/fixed/awning windows

### MISSING / FUTURE
- Constrained position along wall (no typed offset from wall start)
- Collision detection (no overlap check for openings on same wall)
- Auto-wall-cut visual (no notch in wall body at opening)

---

## 4. Dimension Display (PlannerWallShapeUtil.tsx)

### IMPLEMENTED (working)
- Live dimension labels as SVG text at wall midpoint, rotated to wall angle
- Smart formatting: mm below 1000mm, meters (2 decimal) above
- Editable on double-click: prompts for new length, rescales wall
- Label offset above wall body by half-thickness + 4px gap
- Togglable via showDimensions prop (default true)
- Display DURING draw: shape created on pointer-down with showDimensions:true, updates real-time

### MISSING / FUTURE
- Unit switching live (geometry store has wallDimensionUnit but ShapeUtil hardcodes mm/m)
- Cumulative dimension for connected walls (no total run length for chains)

---

## 5. Room Tool (PlannerRoomTool.ts + RoomDetectionTool.ts)

### IMPLEMENTED (working)
- Auto room detection: DFS cycle finding in wall graph, creates room shapes
- Manual drag-to-draw: click-drag creates rectangular room
- Default room on click (120x90 if no drag)
- Area calculation via Shoelace formula
- Auto-naming by area (Closet/Meeting Room/Office/Conference/Lobby/Cafeteria)
- Snap-aware via snapEditorPointOrGrid

### MISSING / FUTURE
- Polygon room drawing (only rectangle via drag, no multi-click polygon)
- Room-to-wall binding (rooms dont track wall edits after creation)

---

## 6. Summary Table

| Feature | Status | Completeness |
|---------|--------|-------------|
| Wall draw with snap | Working | 90% |
| Shift-key angle constraint | NEW | 100% |
| Grid snap | Working | 100% |
| Wall endpoint snap | Working | 100% |
| Wall segment snap | Working | 100% |
| Connected wall edits | Working | 85% |
| Wall split at point | Working | 100% |
| Junction detection (L/T/cross) | Working | 100% |
| Dimension labels during draw | Working | 100% |
| Editable wall length | Working | 100% |
| Door/window wall-snap | Working | 90% |
| Room auto-detection | Working | 80% |
| Visual snap indicators | Missing | 0% |
| Axis-aligned guide lines | Missing | 0% |
| Opening collision detection | Missing | 0% |
| Chain wall drawing mode | Missing | 0% |

---

## Files Modified This Session

- `features/planner/tldraw/tools/tldrawSnap.ts` - Added constrainToAngle(), snapWallEndpoint(), extended EditorSnapResult kind type.
- `features/planner/tldraw/tools/WallTool.ts` - Updated PlannerWallToolDrawing.onPointerMove to use snapWallEndpoint with Shift-key support.

