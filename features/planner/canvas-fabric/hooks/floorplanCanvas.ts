/**
 * floorplanCanvas.ts — Fabric canvas API factory.
 *
 * Types and pure utilities live in floorplanCanvasTypes.ts (split for file-size).
 */
import {
  Canvas as FabricCanvas,
  Group,
  Line,
  Point,
  ActiveSelection,
  FabricText,
  Pattern,
  loadSVGFromString,
  util as fabricUtil,
  Image as FabricImage,
} from 'fabric';
import type { Rect, FabricObject } from 'fabric';
import { saveAs as saveFile } from 'file-saver';
import { formatDate } from '../lib/formatDate';
import * as _ from '../lib/helpers';
import type { FloorplanCanvasApi, InsertPayload } from '../context/FloorplanContext';
import type { FabricContextMenuState, FabricDrawTool } from '../fabricDrawToolTypes';
import { DEFAULT_FABRIC_DRAW_COLOR, DEFAULT_FABRIC_FILL_COLOR } from '../fabricDrawToolTypes';
import { applyFabricTransformLocks, canEditFabricFill } from '../fabricObjectUtils';
import { wireFabricDrawTools } from './fabricDrawTools';


// Types and pure utilities are in floorplanCanvasTypes.ts
export {
  type PlannerFabricObject,
  type InsertPayloadObj,
  type FloorplanCtx,
  resolveLayerCategory,
  getBoundingRect,
} from './floorplanCanvasTypes';

import type {
  PlannerFabricObject,
  InsertPayloadObj,
  FloorplanCtx,
} from './floorplanCanvasTypes';
import { getBoundingRect, resolveLayerCategory } from './floorplanCanvasTypes';

export function createFloorplanCanvasApi(
  ctxRef: { current: FloorplanCtx },
  canvasEl: HTMLCanvasElement,
): FloorplanCanvasApi & {
  init: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
  onKeyUp: (e: KeyboardEvent) => void;
  dispose: () => void;
} {
  let view!: FabricCanvas;
  let corners: Rect[] = [];
  let walls: Line[] = [];
  let lastObjectDefinition: InsertPayloadObj | null = null;
  let lastObject: PlannerFabricObject | null = null;
  let copied: PlannerFabricObject | null = null;
  let selections: FabricObject[] = [];
  let CTRL_KEY_DOWN = false;
  /** Sync flag — React ctxRef.roomEdit lags one frame after editRoom(). */
  let roomEditMode = false;
  let ROOM_SIZE = { width: 960, height: 480 };
  let DEFAULT_CHAIR: Record<string, unknown> | null = null;
  let REMOVE_DW = false;
  let gridPattern: Pattern | null = null;
  let drawTool: FabricDrawTool = 'select';
  let drawColor: string = DEFAULT_FABRIC_DRAW_COLOR;
  let drawFillColor: string = DEFAULT_FABRIC_FILL_COLOR;
  let contextMenuListener: ((state: FabricContextMenuState | null) => void) | null = null;
  let drawToolsController: ReturnType<typeof wireFabricDrawTools> | null = null;
  const wc: any = null;

  const {
    RL_VIEW_WIDTH,
    RL_VIEW_HEIGHT,
    RL_FOOT,
    RL_AISLEGAP,
    RL_ROOM_OUTER_SPACING,
    RL_ROOM_INNER_SPACING,
    RL_UNGROUPABLES,
    RL_CREDIT_TEXT,
    RL_CREDIT_TEXT_PARAMS
  } = _;

  // ─── convenience aliases that delegate to wc (available after setCanvasView) ─

  function isWallLine(obj: unknown): obj is Line {
    return false;
  }

  function isWallOrCorner(obj: unknown): boolean {
    return false;
  }



  /** Scene coordinates (zoom-aware). Never use legacy e.pointer — it can be viewport space in Fabric v7. */
  function getScenePointer(e: unknown): Point | null {
    if (!view) return null;
    const native = (e as Record<string, unknown>)?.e;
    if (native) {
      try {
        view.calcOffset();
        return view.getScenePoint(native as MouseEvent | TouchEvent);
      } catch {
        /* fall through */
      }
    }
    const scene = (e as Record<string, unknown>)?.scenePoint;
    if (scene && typeof (scene as Point).x === 'number' && typeof (scene as Point).y === 'number') {
      return scene instanceof Point ? scene : new Point((scene as Point).x, (scene as Point).y);
    }
    return null;
  }

  function init() {
    DEFAULT_CHAIR = ctxRef.current.defaultChair as Record<string, unknown> | null;
    setCanvasView();
    syncGrid();
    wc?.setRoom(ROOM_SIZE);
    saveState();
  }

  function roomOrigin() {
    return RL_ROOM_OUTER_SPACING + RL_ROOM_INNER_SPACING;
  }

  function onKeyDown(event: KeyboardEvent) {
    const code = event.key || event.keyCode;
    // Ctrl Key is down
    if (event.ctrlKey) {
      CTRL_KEY_DOWN = true;
      // Ctrl + Shift + Z
      if (event.shiftKey && code === 90)
        redo();
      else if (code === 90)
        undo();
      else if (code === 67)
        copy();
      else if (code === 86)
        paste();
      else if (code === 37)
        rotate();
      else if (code === 39)
        rotate(false);
      else if (code === 71)
        group();
    }
    else if (code === 46)
      deleteOp();
    else if (code === 37)
      move('LEFT');
    else if (code === 38)
      move('UP');
    else if (code === 39)
      move('RIGHT');
    else if (code === 40)
      move('DOWN');
    else if (code === 'Escape' && ctxRef.current.roomEdit) {
      event.preventDefault();
      ctxRef.current.exitRoomEdit();
    }
  }

  function onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Control') {
      CTRL_KEY_DOWN = false;
    }
  }

  function setGroupableState() {
    if (selections.length > 1) {
      ctxRef.current.setUngroupable(false);
      return;
    }

    const obj = view.getActiveObject() as PlannerFabricObject | undefined;
    if (!obj) return;
    const type = obj.name ? obj.name.split(':')[0] : '';

    if (RL_UNGROUPABLES.indexOf(type) > -1) {
      ctxRef.current.setUngroupable(false);
    } else {
      ctxRef.current.setUngroupable(true);
    }
  }

  function onSelected() {
    const active = view.getActiveObject();
    if (!active) return;

    const objects = view.getActiveObjects();
    objects.forEach((obj) => applyFabricTransformLocks(obj));

    if (active instanceof ActiveSelection) {
      const allResizable = objects.length > 0 && objects.every((obj) => {
        applyFabricTransformLocks(obj);
        return !obj.lockScalingX;
      });
      active.lockScalingX = !allResizable;
      active.lockScalingY = !allResizable;
      active.lockRotation = !allResizable;
    } else {
      applyFabricTransformLocks(active);
      if (!(active as PlannerFabricObject).name) {
        (active as PlannerFabricObject).name = 'GROUP';
      }
    }

    selections = objects;
    ctxRef.current.setSelections(selections);
    setGroupableState();
  }

  function handleSelectionChange() {
    const active = view.getActiveObject();
    if (isWallOrCorner(active)) {
      selections = [active as FabricObject];
      ctxRef.current.setSelections(selections);
      ctxRef.current.setUngroupable(false);
      return;
    }
    onSelected();
  }

  /**********************************************************************************************************
   * init the canvas view & bind events
   * -------------------------------------------------------------------------------------------------------
   */
  function setCanvasView() {
    const canvas = new FabricCanvas(canvasEl, {
      targetFindTolerance: 12,
      selection: true,
    });
    canvas.setDimensions({
      width: RL_VIEW_WIDTH * RL_FOOT,
      height: RL_VIEW_HEIGHT * RL_FOOT,
    });
    view = canvas;
    syncGrid();
    view.calcOffset();

    // Initialize walls controller — must come before any event wiring


    view.on('selection:created', () => {
      handleSelectionChange();
    });

    view.on('selection:updated', () => {
      handleSelectionChange();
    });

    view.on('selection:cleared', (_e: unknown) => {
      selections = []; ctxRef.current.setSelections(selections);
      ctxRef.current.setUngroupable(false);
    });

    view.on('object:modified', (e) => {
      if (e.action === 'drag') {
        wc?.handleObjectMoved();
      }
      saveState();
    });

    view.on('contextmenu', (e: unknown) => {
      const ev = e as Record<string, unknown>;
      const native = ev.e as MouseEvent | undefined;
      native?.preventDefault?.();
      native?.stopPropagation?.();
      if (!native || !contextMenuListener) return;
      const target = (ev.target as FabricObject | undefined) ?? null;
      if (target) {
        if (isWallOrCorner(target)) {
          view.setActiveObject(target);
          selections = [target];
          ctxRef.current.setSelections(selections);
          ctxRef.current.setUngroupable(false);
        } else {
          view.setActiveObject(target);
          onSelected();
        }
        view.requestRenderAll();
      }
      contextMenuListener({
        clientX: native.clientX,
        clientY: native.clientY,
        target: target as Record<string, unknown> | null,
      });
    });

    view.on('mouse:down:before', (e: unknown) => {
      wc?.handleMouseDownBefore(e);
    });

    view.on('object:moving', (e: unknown) => {
      const obj = (e as Record<string, unknown>).target;
      // Wall/corner moving — delegate entirely to wc
      wc?.handleObjectMoving(e);

      // Grid snapping
      const target = obj as FabricObject;
      if (ctxRef.current.snapEnabled && target && !isWallOrCorner(target)) {
        const snap = RL_FOOT;
        if (target.left !== undefined) {
          target.left = Math.round(target.left / snap) * snap;
        }
        if (target.top !== undefined) {
          target.top = Math.round(target.top / snap) * snap;
        }
      }

      // Door/window snapping to nearest wall
      const point = getScenePointer(e);
      if (!point) return;

      if (obj && isDW(obj) && obj instanceof Group) {
        let wall: Line | undefined;
        let distance = 999;
        const dist2 = (v: Point, w: Point) => (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
        const distToSegmentSquared = (p: Point, v: Point, w: Point) => {
          const l2 = dist2(v, w);

          if (l2 === 0)
            return dist2(p, v);

          const t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;

          if (t < 0)
            return dist2(p, v);

          if (t > 1)
            return dist2(p, w);

          return dist2(p, new Point(v.x + t * (w.x - v.x), v.y + t * (w.y - v.y)));
        };
        const point_to_line = (p: Point, v: Point, w: Point) => Math.sqrt(distToSegmentSquared(p, v, w));

        walls.forEach(w => {
          const d = point_to_line(point, new Point(w.x1 ?? 0, w.y1 ?? 0), new Point(w.x2 ?? 0, w.y2 ?? 0));
          if (d < distance) {
            distance = d;
            wall = w;
          }
        });

        if (distance > 20 || !wall) {
          REMOVE_DW = true;
        } else {
          REMOVE_DW = false;
        }
      }
    });

    view.on('mouse:up', (e: unknown) => {
      const obj = (e as Record<string, unknown>).target as PlannerFabricObject | undefined;
      wc?.handleMouseUp(e);

      if (REMOVE_DW && obj) {
        view.remove(obj);
        REMOVE_DW = false;
      }
    });

    view.on('mouse:dblclick', (e: unknown) => {
      wc?.handleDoubleClick(e);
    });

    drawToolsController = wireFabricDrawTools({
      getView: () => view,
      getScenePointer,
      getDrawTool: () => drawTool,
      getDrawColor: () => drawColor,
      getDrawFillColor: () => drawFillColor,
      roomEditActive: () => false,
      saveState,
    });

    view.on('mouse:wheel', (event: unknown) => {
      const native = (event as Record<string, unknown>).e;
      if (!(native instanceof WheelEvent)) return;
      zoomToPointer(native);
    });
  }


  function locateDW(dw: Group, wall: Line, x: number, y: number) {
    return dw;
  }

  /**********************************************************************************************************/

  function editRoom() {
    // No-op: fabricWalls is removed
  }

  function endEditRoom() {
    // No-op: fabricWalls is removed
  }

  function cancelRoomEdition() {
    roomEditMode = false;
    drawToolsController?.applyCanvasMode();
    wc?.refreshRoomEditObjectModes(false);
    selections = [];
    ctxRef.current.setSelections(selections);
    ctxRef.current.setUngroupable(false);
    view.discardActiveObject();
  }

  async function handleObjectInsertion({ type, object }: InsertPayload) {
    const payloadObj = object as InsertPayloadObj;

    if (type === 'ROOM') {
      wc?.setRoom(payloadObj as { width: number; height: number });
      saveState();
      return;
    }

    let group = _.createFurniture(type, payloadObj, (DEFAULT_CHAIR ?? undefined) as Record<string, unknown> | undefined);
    if (type === 'GENERIC' && payloadObj.svg) {
      try {
        const parsed = await loadSVGFromString(payloadObj.svg);
        const objects = parsed.objects.filter((obj): obj is FabricObject => Boolean(obj));
        if (objects.length) {
          group = fabricUtil.groupSVGElements(objects, parsed.options);
          group.set({
            name: `GENERIC:${payloadObj.name || payloadObj.title || 'Item'}`,
          });
          group.scaleX = (payloadObj.width ?? 1) / Math.max(1, group.width);
          group.scaleY = (payloadObj.height ?? 1) / Math.max(1, group.height);
        }
      } catch {
        // Keep the generic footprint as a safe fallback for malformed symbols.
      }
    }

    if (payloadObj.id) {
      group.set('id', payloadObj.id);
    }
    if (payloadObj.name && type === 'GENERIC' && payloadObj.variant !== 'zone' && payloadObj.variant !== 'room') {
      group.set('name', `GENERIC:${payloadObj.name}`);
    }



    // retrieve spacing from object, use rlAisleGap if not specified
    const newLR = payloadObj.lrSpacing || RL_AISLEGAP;
    const newTB = payloadObj.tbSpacing || RL_AISLEGAP;

    const explicitLeft = typeof payloadObj.left === 'number' ? payloadObj.left : null;
    const explicitTop = typeof payloadObj.top === 'number' ? payloadObj.top : null;
    const hasExplicitPosition = explicitLeft !== null && explicitTop !== null;
    group.left = newLR + (group.width / 2) + roomOrigin();
    group.top = newTB + (group.height / 2) + roomOrigin();

    if (hasExplicitPosition) {
      group.left = explicitLeft + roomOrigin();
      group.top = explicitTop + roomOrigin();
    }

    if (lastObject && !hasExplicitPosition) {
      const lastLR = lastObjectDefinition?.lrSpacing || RL_AISLEGAP;
      const lastTB = lastObjectDefinition?.tbSpacing || RL_AISLEGAP;
      const useLR = Math.max(newLR, lastLR);
      const useTB = Math.max(newTB, lastTB);

      const lastHalfWidth = ((lastObject.width ?? 0) || lastObjectDefinition?.width || 100) / 2;
      const lastHalfHeight = ((lastObject.height ?? 0) || lastObjectDefinition?.height || 40) / 2;

      let newLeft = lastObject.left + lastHalfWidth + useLR + group.width / 2;
      let newTop = lastObject.top - lastHalfHeight + useTB + group.height / 2;

      if (newLeft + group.width / 2 + newLR > ROOM_SIZE.width) {
        newLeft = roomOrigin() + newLR + group.width / 2;
        newTop = lastObject.top + lastHalfHeight + useTB + group.height / 2;
      }

      group.left = Math.max(newLeft, roomOrigin() + newLR + group.width / 2);
      group.top = Math.max(newTop, roomOrigin() + newTB + group.height / 2);
    }

    if (!hasExplicitPosition && view) {
      let attempts = 0;
      const spacing = 40;
      while (attempts < 50) {
        const collision = view.getObjects().some(obj => 
          !(obj as any).name?.includes('WALL') && 
          (obj as any).name !== 'CORNER' &&
          Math.abs((obj.left || 0) - (group.left || 0)) < 5 && 
          Math.abs((obj.top || 0) - (group.top || 0)) < 5
        );
        if (!collision) break;
        group.left += spacing;
        if (group.left + (group.width || 0) / 2 > ROOM_SIZE.width + roomOrigin()) {
          group.left = newLR + ((group.width || 0) / 2) + roomOrigin();
          group.top += spacing;
        }
        attempts++;
      }
    }

    view.add(group);
    view.setActiveObject(group);

    lastObject = group;
    lastObjectDefinition = payloadObj;
    saveState();
  }


  async function restoreFromState(current: string | null) {
    if (!current) return;
    view.clear();
    await view.loadFromJSON(current);
    view.discardActiveObject();
    view.renderAll();
    corners = view.getObjects().filter((obj) => (obj as PlannerFabricObject).name === 'CORNER') as Rect[];
    wc?.drawRoom();
    ctxRef.current.setSelections([]);
    ctxRef.current.setUngroupable(false);
    syncGrid();
    window.requestAnimationFrame(() => {
      const zoomPct = fitToStage();
      ctxRef.current.syncZoom(zoomPct);
      view.calcOffset();
      view.requestRenderAll();
    });
  }

  function createGridPattern() {
    const major = RL_FOOT * 5;
    const minor = RL_FOOT;
    const source = document.createElement('canvas');
    source.width = major;
    source.height = major;
    const g = source.getContext('2d');

    if (!g) {
      return null;
    }

    g.clearRect(0, 0, source.width, source.height);

    g.strokeStyle = 'rgba(15, 37, 56, 0.08)';
    g.lineWidth = 1;

    for (let x = minor; x < source.width; x += minor) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, source.height);
      g.stroke();
    }

    for (let y = minor; y < source.height; y += minor) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(source.width, y);
      g.stroke();
    }

    g.strokeStyle = 'rgba(15, 37, 56, 0.18)';

    g.beginPath();
    g.moveTo(0, 0.5);
    g.lineTo(source.width, 0.5);
    g.stroke();

    g.beginPath();
    g.moveTo(0.5, 0);
    g.lineTo(0.5, source.height);
    g.stroke();

    return new Pattern({
      source,
      repeat: 'repeat',
    });
  }

  function syncGrid() {
    if (!view) return;

    if (!gridPattern) {
      gridPattern = createGridPattern();
    }

    view.backgroundColor = ctxRef.current.gridEnabled && gridPattern ? gridPattern : '#eceff1';
    view.requestRenderAll();
  }

  /** Save current state */
  function saveState() {
    const state = view.toDatalessJSON(['id', 'name', 'hasControls', 'selectable', 'hasBorders', 'evented', 'hoverCursor', 'moveCursor']);
    ctxRef.current.pushState(JSON.stringify(state));
  }

  function exportState() {
    const state = view.toDatalessJSON([
      'id',
      'name',
      'hasControls',
      'selectable',
      'hasBorders',
      'evented',
      'hoverCursor',
      'moveCursor',
    ]);
    return JSON.stringify(state);
  }

  async function importState(serialized: string) {
    await restoreFromState(serialized);
  }


  async function undo() {
    let current: string | null = null;

    if (ctxRef.current.roomEdit) {
      const states = [...ctxRef.current.roomEditStates];
      if (states.length <= 1) return;
      const popped = states.pop() ?? '';
      current = states[states.length - 1];
      ctxRef.current.setRoomEditStates(states);
      ctxRef.current.setRoomEditRedoStates([...ctxRef.current.roomEditRedoStates, popped]);
    } else {
      const states = [...ctxRef.current.states];
      if (states.length <= 1) return;
      const popped = states.pop() ?? '';
      current = states[states.length - 1];
      ctxRef.current.setStates(states);
      ctxRef.current.setRedoStates([...ctxRef.current.redoStates, popped]);
    }

    await restoreFromState(current);
  }


  /** Redo operation */
  async function redo() {
    let current: string | null = null;

    if (ctxRef.current.roomEdit) {
      const redo = [...ctxRef.current.roomEditRedoStates];
      if (!redo.length) return;
      current = redo.pop() ?? '';
      ctxRef.current.setRoomEditRedoStates(redo);
      ctxRef.current.setRoomEditStates([...ctxRef.current.roomEditStates, current]);
    } else {
      const redo = [...ctxRef.current.redoStates];
      if (!redo.length) return;
      current = redo.pop() ?? '';
      ctxRef.current.setRedoStates(redo);
      ctxRef.current.setStates([...ctxRef.current.states, current]);
    }

    await restoreFromState(current);
  }


  /** Copy operation */
  async function copy() {
    if (ctxRef.current.roomEdit) {
      return;
    }
    const active = view.getActiveObject();
    if (!active || isWallOrCorner(active)) {
      return;
    }
    copied = await active.clone(['name', 'hasControls']);
  }

  /** Paste operation */
  async function paste() {
    if (!copied || ctxRef.current.roomEdit) {
      return;
    }
    const cloned = await copied.clone(['name', 'hasControls']);
    view.discardActiveObject();
    cloned.set({
      left: cloned.left + RL_AISLEGAP,
      top: cloned.top + RL_AISLEGAP,
    });
    if (cloned.type === 'activeSelection') {
      cloned.canvas = view;
      (cloned as ActiveSelection).forEachObject((obj: FabricObject) => view.add(obj));
      cloned.setCoords();
    } else {
      view.add(cloned);
    }
    copied.top += RL_AISLEGAP;
    copied.left += RL_AISLEGAP;
    view.setActiveObject(cloned);
    view.requestRenderAll();
    saveState();
  }

  /** Delete operation */
  function deleteOp() {
    if (ctxRef.current.roomEdit) {
      return;
    }
    const deletable = selections.filter(selection => !isWallOrCorner(selection));
    if (deletable.length === 0) {
      return;
    }
    deletable.forEach(selection => view.remove(selection));
    view.discardActiveObject();
    view.requestRenderAll();
    saveState();
  }

  /** Rotate Operation */
  function rotate(clockwise = true) {
    if (ctxRef.current.roomEdit) {
      return;
    }

    let angle = CTRL_KEY_DOWN ? 90 : 15;
    const obj = view.getActiveObject();

    if (!obj || isWallOrCorner(obj)) { return; }

    if ((obj.originX !== 'center' || obj.originY !== 'center') && obj.centeredRotation) {
      obj.originX = 'center';
      obj.originY = 'center';
      obj.left += obj.width / 2;
      obj.top += obj.height / 2;
    }

    if (isDW(obj)) {
      angle = obj.angle + (clockwise ? 180 : -180);
    } else {
      angle = obj.angle + (clockwise ? angle : -angle);
    }

    if (angle > 360) { angle -= 360; } else if (angle < 0) { angle += 360; }

    obj.angle = angle;
    view.requestRenderAll();
  }

  /** Group */
  function group() {
    if (ctxRef.current.roomEdit) {
      return;
    }

    if (selections.some(isWallOrCorner)) {
      return;
    }

    const active = view.getActiveObject();
    if (!(selections.length > 1 && active instanceof ActiveSelection)) {
      return;
    }

    const objects = active.getObjects();
    const groupObj = new Group(objects);
    view.remove(...objects);
    view.add(groupObj);
    view.setActiveObject(groupObj);
    applyFabricTransformLocks(groupObj);
    onSelected();
    view.renderAll();
    saveState();
  }

  function ungroup() {
    if (ctxRef.current.roomEdit) {
      return;
    }

    if (selections.some(isWallOrCorner)) {
      return;
    }

    const active = view.getActiveObject();
    if (!(active && active instanceof Group)) {
      return;
    }

    const items = active.removeAll();
    view.remove(active);
    items.forEach((obj) => view.add(obj));
    const sel = new ActiveSelection(items, { canvas: view });
    view.setActiveObject(sel);
    view.getActiveObjects().forEach((obj) => applyFabricTransformLocks(obj));
    onSelected();
    view.renderAll();
    saveState();
  }

  function move(direction: string, increament = 6) {
    if (ctxRef.current.roomEdit) {
      return;
    }

    const active = view.getActiveObject();
    if (!active || isWallOrCorner(active)) {
      return;
    }
    switch (direction) {
      case 'LEFT':
        active.left -= increament;
        break;
      case 'UP':
        active.top -= increament;
        break;
      case 'RIGHT':
        active.left += increament;
        break;
      case 'DOWN':
        active.top += increament;
        break;
    }
    view.requestRenderAll();
    saveState();
  }

  const SCENE_WIDTH = RL_VIEW_WIDTH * RL_FOOT;
  const SCENE_HEIGHT = RL_VIEW_HEIGHT * RL_FOOT;

  function setZoom(zoomPct: number) {
    if (!view) return;
    const clamped = Math.max(20, Math.min(150, Math.round(zoomPct)));
    ctxRef.current.zoom = clamped;
    view.setDimensions({ width: SCENE_WIDTH, height: SCENE_HEIGHT });
    view.setZoom(clamped / 100);
    view.calcOffset();
    view.requestRenderAll();
  }

  function setLayerVisibility(layerVisible: Record<string, boolean>) {
    if (!view) return;
    view.getObjects().forEach((obj) => {
      const category = resolveLayerCategory(obj);
      if (!category) return;
      const visible = layerVisible[category] !== false;
      obj.visible = visible;
      obj.evented = visible;
      if (!visible && view.getActiveObject() === obj) {
        view.discardActiveObject();
      }
    });
    view.requestRenderAll();
  }

  const FABRIC_TO_MM = 10;

  function resizeObject(shapeId: string, widthMm: number, heightMm: number) {
    if (!view) return;
    const target = view.getObjects().find((obj) => String((obj as PlannerFabricObject).id ?? (obj as PlannerFabricObject).name ?? '') === shapeId);
    if (!target) return;
    const newWidth = widthMm / FABRIC_TO_MM;
    const newHeight = heightMm / FABRIC_TO_MM;
    if (target instanceof Group) {
      target.set({
        scaleX: newWidth / Math.max(0.1, target.width),
        scaleY: newHeight / Math.max(0.1, target.height),
      });
    } else {
      target.set({
        width: newWidth,
        height: newHeight,
      });
    }
    target.setCoords();
    view.requestRenderAll();
    saveState();
  }

  function fitToStage() {
    if (!view || !canvasEl) return ctxRef.current.zoom;
    const wrap = canvasEl.closest('.canvas-wrap') as HTMLElement | null;
    if (!wrap) return ctxRef.current.zoom;

    const pad = 32;
    const availW = wrap.clientWidth - pad;
    const availH = wrap.clientHeight - pad;
    // Hidden view-stack panes collapse to ~0 width — never shrink zoom from that.
    if (availW < 280 || availH < 200) return ctxRef.current.zoom;

    const scale = Math.min(availW / SCENE_WIDTH, availH / SCENE_HEIGHT, 1);
    const zoomPct = Math.max(50, Math.min(150, Math.round(scale * 100)));
    setZoom(zoomPct);
    return zoomPct;
  }

  function zoomToPointer(nativeEvent: WheelEvent) {
    if (!view) return;

    const rect = view.lowerCanvasEl.getBoundingClientRect();
    const anchor = new Point(nativeEvent.clientX - rect.left, nativeEvent.clientY - rect.top);
    const nextZoom = Math.max(0.2, Math.min(1.5, view.getZoom() * Math.pow(0.999, nativeEvent.deltaY)));
    const nextZoomPct = Math.round(nextZoom * 100);

    nativeEvent.preventDefault();
    nativeEvent.stopPropagation();
    view.zoomToPoint(anchor, nextZoom);
    ctxRef.current.zoom = nextZoomPct;
    ctxRef.current.syncZoom(nextZoomPct);
    view.calcOffset();
    view.requestRenderAll();
  }

  function setGridVisible(enabled: boolean) {
    ctxRef.current.gridEnabled = enabled;
    syncGrid();
  }

  function placeInCenter(direction: string) {
    const active = view.getActiveObject();

    if (!active) {
      return;
    }

    if (direction === 'HORIZONTAL') {
      active.left = ROOM_SIZE.width / 2 - (active.originX === 'center' ? 0 : active.width / 2);
    } else {
      active.top = ROOM_SIZE.height / 2 - (active.originX === 'center' ? 0 : active.height / 2);
    }

    active.setCoords();
    view.requestRenderAll();
    saveState();
  }

  function arrange(action: string) {
    const rect = getBoundingRect(selections);
    action = action.toLowerCase();
    selections.forEach((s: FabricObject) => {
      if (action === 'left' || action === 'right' || action === 'center') {
        s.left = rect[action as keyof typeof rect];
      } else {
        s.top = rect[action as keyof typeof rect];
      }
    });
    view.renderAll();
    saveState();
  }

  function filterObjects(names: string[]) {
    return view.getObjects().filter((obj) => {
      const name = String((obj as PlannerFabricObject).name ?? '');
      return names.some((n) => name.includes(n));
    });
  }

  function isDW(object: unknown) {
    const name = String((object as PlannerFabricObject)?.name ?? '');
    return name.includes('DOOR') || name.includes('WINDOW');
  }

  function withExportFrame<T>(run: () => T): T {
    const { right, bottom } = getBoundingRect(corners);
    const width = view.getWidth();
    const height = view.getHeight();

    view.setDimensions({
      width: right + RL_ROOM_OUTER_SPACING,
      height: bottom + RL_ROOM_OUTER_SPACING + 12,
    });
    view.backgroundColor = 'white';

    const credit = new FabricText(RL_CREDIT_TEXT,
      {
        ...RL_CREDIT_TEXT_PARAMS,
        left: RL_ROOM_OUTER_SPACING,
        top: bottom + RL_ROOM_OUTER_SPACING - RL_CREDIT_TEXT_PARAMS.fontSize
      }
    );
    view.add(credit);
    view.discardActiveObject();
    view.renderAll();

    try {
      return run();
    } finally {
      view.remove(credit);
      view.setDimensions({ width, height });
      syncGrid();
    }
  }

  function exportSvg() {
    if (!view || corners.length === 0) return null;
    return withExportFrame(() => view.toSVG());
  }

  function exportPngBlob(): Promise<Blob | null> {
    if (!view || corners.length === 0) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      withExportFrame(() => {
        const canvasEl = view.lowerCanvasEl;
        canvasEl.toBlob((blob: Blob | null) => resolve(blob));
      });
    });
  }

  function saveAs(format: string) {

    if (format === 'PNG') {
      void exportPngBlob().then((blob) => {
        if (!blob) return;
        saveFile(blob, `room_layout_${formatDate(new Date(), 'yyyy-MM-dd-hh-mm-ss', 'en')}.png`);
      });
    } else if (format === 'SVG') {
      const svg = exportSvg();
      if (!svg) return;
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      saveFile(blob, `room_layout_${formatDate(new Date(), 'yyyy-MM-dd-hh-mm-ss', 'en')}.svg`);
    }
  }


  function dispose() {
    drawToolsController?.dispose?.();
    drawToolsController = null;
    if (view && !view.destroyed) {
      view.dispose();
    }
  }

  function setDrawTool(tool: FabricDrawTool) {
    drawTool = tool;
    drawToolsController?.setDrawTool(tool);
  }

  function setDrawColor(color: string) {
    drawColor = color;
    drawToolsController?.setDrawColor(color);
  }

  function setDrawFillColor(color: string) {
    drawFillColor = color;
    drawToolsController?.setDrawFillColor?.(color);
  }

  function setContextMenuListener(listener: ((state: FabricContextMenuState | null) => void) | null) {
    contextMenuListener = listener;
  }

  function applyStrokeToSelection(color: string) {
    if (ctxRef.current.roomEdit || !view) return;
    const active = view.getActiveObject();
    if (!active || !canEditFabricFill(active)) return;
    active.set('stroke', color);
    view.requestRenderAll();
    saveState();
  }

  function applyFillToSelection(color: string) {
    if (ctxRef.current.roomEdit || !view) return;
    const active = view.getActiveObject();
    if (!active || !canEditFabricFill(active)) return;
    active.set('fill', color === 'transparent' ? 'transparent' : color);
    view.requestRenderAll();
    saveState();
  }

  const api: FloorplanCanvasApi & {
    init: () => void;
    onKeyDown: (e: KeyboardEvent) => void;
    onKeyUp: (e: KeyboardEvent) => void;
    dispose: () => void;
  } = {
    init,
    onKeyDown,
    onKeyUp,
    dispose,
    undo,
    redo,
    copy,
    paste,
    delete: deleteOp,
    rotate,
    group,
    ungroup,
    placeInCenter,
    arrange,
    setZoom,
    setGridVisible,
    exportState,
    importState,
    exportSvg,
    exportPngBlob,
    saveAs,
    handleInsert: handleObjectInsertion,
    editRoom,
    cancelRoomEdition,
    setDrawTool,
    setDrawColor,
    setDrawFillColor,
    applyStrokeToSelection,
    applyFillToSelection,
    setContextMenuListener,
    fitToStage,
    recalcOffset: () => view?.calcOffset(),
    setLayerVisibility,
    resizeObject,
  };
  return api;
}
