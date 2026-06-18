// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable eqeqeq */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable prefer-const */
import {
  Canvas as FabricCanvas,
  Group,
  Rect,
  Line,
  Point,
  ActiveSelection,
  FabricText,
  Pattern,
} from 'fabric';
import { saveAs as saveFile } from 'file-saver';
import { formatDate } from '../lib/formatDate';
import * as _ from '../lib/helpers';
import type { FloorplanCanvasApi } from '../context/FloorplanContext';
import type { FabricContextMenuState, FabricDrawTool } from '../fabricDrawToolTypes';
import { DEFAULT_FABRIC_DRAW_COLOR, DEFAULT_FABRIC_FILL_COLOR } from '../fabricDrawToolTypes';
import { applyFabricTransformLocks, canEditFabricFill } from '../fabricObjectUtils';
import { wireFabricDrawTools } from './fabricDrawTools';
import type { PlannerLayerCategory } from '@/features/planner/store/workspaceStore';

import type { Dispatch, SetStateAction } from 'react';

export type FloorplanCtx = {
  roomEdit: boolean;
  zoom: number;
  gridEnabled: boolean;
  states: string[];
  redoStates: string[];
  roomEditStates: string[];
  roomEditRedoStates: string[];
  defaultChair: unknown;
  setSelections: (items: any[]) => void;
  setUngroupable: (v: boolean) => void;
  pushState: (s: string) => void;
  setStates: Dispatch<SetStateAction<string[]>>;
  setRedoStates: Dispatch<SetStateAction<string[]>>;
  setRoomEditStates: Dispatch<SetStateAction<string[]>>;
  setRoomEditRedoStates: Dispatch<SetStateAction<string[]>>;
  enterRoomEdit: () => void;
  exitRoomEdit: () => void;
};

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
  let lastObjectDefinition: any = null;
  let lastObject: any = null;
  let copied: any = null;
  let selections: any[] = [];
  let CTRL_KEY_DOWN = false;
  let MOVE_WALL_ID = -1;
  /** Sync flag — React ctxRef.roomEdit lags one frame after editRoom(). */
  let roomEditMode = false;
  let ROOM_SIZE = { width: 960, height: 480 };
  let DEFAULT_CHAIR: any = null;
  let REMOVE_DW = false;
  let gridPattern: Pattern | null = null;
  let drawTool: FabricDrawTool = 'select';
  let drawColor = DEFAULT_FABRIC_DRAW_COLOR;
  let drawFillColor = DEFAULT_FABRIC_FILL_COLOR;
  let contextMenuListener: ((state: FabricContextMenuState | null) => void) | null = null;
  let drawToolsController: ReturnType<typeof wireFabricDrawTools> | null = null;
const {
  RL_VIEW_WIDTH,
  RL_VIEW_HEIGHT,
  RL_FOOT,
  RL_AISLEGAP,
  RL_ROOM_OUTER_SPACING,
  RL_ROOM_INNER_SPACING,
  RL_ROOM_STROKE,
  RL_CORNER_FILL,
  RL_UNGROUPABLES,
  RL_CREDIT_TEXT,
  RL_CREDIT_TEXT_PARAMS
} = _;

const
  HORIZONTAL = 'HORIZONTAL',
  VERTICAL = 'VERTICAL',
  OFFSET = RL_ROOM_INNER_SPACING / 2;

const Left = (wall) => wall.x1 < wall.x2 ? wall.x1 : wall.x2;
const Top = (wall) => wall.y1 < wall.y2 ? wall.y1 : wall.y2;
const Right = (wall) => wall.x1 > wall.x2 ? wall.x1 : wall.x2;
const Bottom = (wall) => wall.y1 > wall.y2 ? wall.y1 : wall.y2;








  function init() {
    DEFAULT_CHAIR = ctxRef.current.defaultChair;
    setCanvasView();
    syncGrid();
    setRoom(ROOM_SIZE);
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


  function onScroll(event) { }


  function setGroupableState() {
    if (selections.length > 1) {
      ctxRef.current.setUngroupable(false);
      return;
    }

    const obj = view.getActiveObject();
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
      if (!active.name) {
        active.name = 'GROUP';
      }
    }

    selections = objects;
    ctxRef.current.setSelections(selections);
    setGroupableState();
  }


  /**********************************************************************************************************
   * init the canvas view & bind events
   * -------------------------------------------------------------------------------------------------------
   */
  function isWallLine(obj: any): obj is Line {
    return Boolean(obj && obj instanceof Line && String(obj.name ?? '').includes('WALL'));
  }

  function isRoomEditActive() {
    return roomEditMode;
  }

  /** Scene coordinates (zoom-aware). Never use legacy e.pointer — it can be viewport space in Fabric v7. */
  function getScenePointer(e: any): Point | null {
    if (!view) return null;
    const native = e?.e;
    if (native) {
      try {
        view.calcOffset();
        return view.getScenePoint(native);
      } catch {
        /* fall through */
      }
    }
    const scene = e?.scenePoint;
    if (scene && typeof scene.x === 'number' && typeof scene.y === 'number') {
      return scene instanceof Point ? scene : new Point(scene.x, scene.y);
    }
    return null;
  }

  function moveWallCornersToPointer(p: Point) {
    const v1 = corners[MOVE_WALL_ID];
    const v2 = corners[(MOVE_WALL_ID + 1) % corners.length];
    if (!v1 || !v2) return;

    const direction = v1.left === v2.left ? 'HORIZONTAL' : 'VERTICAL';
    const x = Math.max(RL_ROOM_OUTER_SPACING, p.x);
    const y = Math.max(RL_ROOM_OUTER_SPACING, p.y);

    if (direction === 'VERTICAL') {
      v1.top = v2.top = y;
    } else {
      v1.left = v2.left = x;
    }
    drawRoom();
  }

  function refreshRoomEditObjectModes(inRoomEdit: boolean) {
    corners.forEach((corner) => setCornerStyle(corner));
    view.getObjects().forEach((obj) => {
      const name = String(obj.name ?? '');
      if (name.includes('WALL')) {
        obj.selectable = inRoomEdit;
        obj.evented = true;
        obj.hoverCursor = inRoomEdit ? view.moveCursor : 'pointer';
        obj.hasBorders = inRoomEdit;
        obj.perPixelTargetFind = true;
        obj.padding = 8;
      } else if (name === 'CORNER') {
        obj.selectable = false;
        obj.evented = inRoomEdit;
        setCornerStyle(obj as Rect);
      } else {
        obj.selectable = !inRoomEdit;
        obj.evented = !inRoomEdit;
      }
    });
    view.requestRenderAll();
  }

  function handleSelectionChange() {
    if (isRoomEditActive()) {
      const active = view.getActiveObject();
      if (isWallLine(active)) {
        selections = [active];
        ctxRef.current.setSelections(selections);
        ctxRef.current.setUngroupable(false);
      }
      return;
    }
    onSelected();
  }

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

    const cornersOfWall = (obj: Line) => {
      const id = Number(String(obj.name ?? '').split(':')[1]);
      const v1Id = id;
      const v1 = corners[v1Id];
      const v2Id = (id + 1) % walls.length;
      const v2 = corners[v2Id];
      return { v1, v1Id, v2, v2Id };
    };

    view.on('selection:created', () => {
      handleSelectionChange();
    });

    view.on('selection:updated', () => {
      handleSelectionChange();
    });

    view.on('selection:cleared', (e: any) => {
      if (isRoomEditActive()) {
        return;
      }
      selections = []; ctxRef.current.setSelections(selections);
      ctxRef.current.setUngroupable(false);
    });

    view.on('object:moved', () => {
      if (MOVE_WALL_ID !== -1) {
        MOVE_WALL_ID = -1;
      }
      saveState();
    });

    view.on('object:rotated', () => saveState());
    view.on('object:scaled', () => saveState());

    view.on('contextmenu', (e: any) => {
      e.e?.preventDefault?.();
      e.e?.stopPropagation?.();
      const native = e.e as MouseEvent | undefined;
      if (!native || !contextMenuListener) return;
      const target = e.target ?? null;
      if (target && !isRoomEditActive()) {
        if (isWallLine(target)) {
          view.discardActiveObject();
          selections = [];
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
        target,
      });
    });

    view.on('mouse:down:before', (e: any) => {
      const obj = e.target;

      if (isWallLine(obj)) {
        if (!isRoomEditActive()) {
          ctxRef.current.enterRoomEdit();
        }
        if (!isRoomEditActive()) return;

        let { v1, v2, v1Id, v2Id } = cornersOfWall(obj);
        const v0Id = (v1Id === 0) ? corners.length - 1 : v1Id - 1;
        const v3Id = (v2Id === corners.length - 1) ? 0 : v2Id + 1;
        const v0 = corners[v0Id];
        const v3 = corners[v3Id];

        MOVE_WALL_ID = v1Id;

        if ((v0.top === v1.top && v1.top === v2.top) || (v0.left === v1.left && v1.left === v2.left)) {
          corners.splice(v1Id, 0, drawCorner(new Point(v1.left, v1.top)));
          MOVE_WALL_ID = v1Id + 1;
          v2Id += 1;
        }

        if ((v1.top === v2.top && v2.top === v3.top) || (v1.left === v2.left && v2.left === v3.left)) {
          corners.splice(v2Id + 1, 0, drawCorner(new Point(v2.left, v2.top)));
        }

        drawRoom();
        saveState();
      }
    });

    view.on('object:moving', (e: any) => {
      if (MOVE_WALL_ID !== -1) {
        const p = getScenePointer(e);
        if (p) moveWallCornersToPointer(p);
      }

      const obj = e.target;
      const point = getScenePointer(e);
      if (!point) return;

      if (obj && isDW(obj) && obj instanceof Group) {
        let wall, distance = 999;
        const dist2 = (v, w) => (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
        const point_to_line = (p, v, w) => Math.sqrt(distToSegmentSquared(p, v, w));
        const distToSegmentSquared = (p, v, w) => {
          const l2 = dist2(v, w);

          if (l2 == 0)
            return dist2(p, v);

          const t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;

          if (t < 0)
            return dist2(p, v);

          if (t > 1)
            return dist2(p, w);

          return dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
        };

        walls.forEach(w => {
          const d = point_to_line(point, { x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 });
          if (d < distance) {
            distance = d, wall = w;
          }
        });

        if (distance > 20) {
          REMOVE_DW = true;
        } else {
          REMOVE_DW = false;
          const direction = directionOfWall(wall);

          if (direction === HORIZONTAL) {
            locateDW(obj, wall, point.x, Top(wall));
          } else {
            locateDW(obj, wall, Left(wall), point.y);
          }
        }
      }
    });

    view.on('mouse:up', (e: any) => {
      const obj = e.target;

      if (MOVE_WALL_ID !== -1) {
        MOVE_WALL_ID = -1;
        saveState();
      }

      if (REMOVE_DW) {
        view.remove(obj);
        REMOVE_DW = false;
      }
    });

    view.on('mouse:dblclick', (e: any) => {
      const obj = e.target;

      if (!isRoomEditActive() && isWallLine(obj)) {
        ctxRef.current.enterRoomEdit();
        return;
      }

      if (isRoomEditActive() && !obj) {
        ctxRef.current.exitRoomEdit();
        return;
      }

      if (isRoomEditActive() && isWallLine(obj)) {
        const p = getScenePointer(e);
        if (!p) return;

        const { v1, v1Id, v2, v2Id } = cornersOfWall(obj);
        const ind = v1Id < v2Id ? v1Id : v2Id;

        if (v1.left === v2.left) {
          p.x = v1.left;
        } else if (v1.top === v2.top) {
          p.y = v1.top;
        }

        const newCorner = drawCorner(new Point(p.x, p.y));

        if (Math.abs(v1Id - v2Id) != 1) {
          corners.push(newCorner);
        } else {
          corners.splice(ind + 1, 0, newCorner);
        }

        drawRoom();
        saveState();
      }
    });

    drawToolsController = wireFabricDrawTools({
      getView: () => view,
      getScenePointer,
      getDrawTool: () => drawTool,
      getDrawColor: () => drawColor,
      getDrawFillColor: () => drawFillColor,
      roomEditActive: () => roomEditMode,
      saveState,
    });
  }




  /**********************************************************************************************************
   * draw Rooms defined in Model
   * -------------------------------------------------------------------------------------------------------
   */
  function setRoom({ width, height }) {
    if (walls.length) {
      view.remove(...walls);
      view.renderAll();
    }

    const LT = new Point(RL_ROOM_OUTER_SPACING, RL_ROOM_OUTER_SPACING);
    const RT = new Point(LT.x + width, LT.y);
    const LB = new Point(LT.x, LT.y + height);
    const RB = new Point(RT.x, LB.y);

    corners = [LT, RT, RB, LB].map(p => drawCorner(p));
    drawRoom();
  }


  /**********************************************************************************************************
   * set corner according to current edition status
   * -------------------------------------------------------------------------------------------------------
   */
  function setCornerStyle(c: Rect) {
    c.moveCursor = view.freeDrawingCursor;
    c.hoverCursor = view.freeDrawingCursor;
    c.selectable = false;
    c.evented = false;
    c.width = c.height = (RL_ROOM_INNER_SPACING / (isRoomEditActive() ? 1.5 : 2)) * 2;
    c.set('fill', isRoomEditActive() ? RL_CORNER_FILL : RL_ROOM_STROKE);
  }



  /**********************************************************************************************************
   * draw corner
   * -------------------------------------------------------------------------------------------------------
   */
  function drawCorner(p: Point) {
    const c = new Rect({
      left: p.x,
      top: p.y,
      strokeWidth: 0,
      hasControls: false,
      originX: 'center',
      originY: 'center',
      name: 'CORNER'
    });
    setCornerStyle(c);
    return c;
  }


  /**********************************************************************************************************
   * draw room
   * -------------------------------------------------------------------------------------------------------
   */
  function drawRoom() {

    const exists = view.getObjects().filter((obj) => {
      const name = String(obj.name ?? '');
      return name.includes('WALL') || name === 'CORNER';
    });
    view.remove(...exists);

    view.add(...corners);

    const wall = (coords: number[], index: number) => new Line(coords, {
      stroke: RL_ROOM_STROKE,
      strokeWidth: RL_ROOM_INNER_SPACING,
      name: `WALL:${index}`,
      originX: 'center',
      originY: 'center',
      hoverCursor: isRoomEditActive() ? view.moveCursor : 'pointer',
      hasControls: false,
      hasBorders: isRoomEditActive(),
      selectable: isRoomEditActive(),
      evented: true,
      perPixelTargetFind: true,
      padding: 8,
      cornerStyle: 'rect',
    });

    let LT = new Point(9999, 9999), RB = new Point(0, 0);

    walls = corners.map((corner, i) => {
      const start = corner;
      const end = (i === corners.length - 1) ? corners[0] : corners[i + 1];

      if (corner.top < LT.x && corner.left < LT.y)
        LT = new Point(corner.left, corner.top);

      if (corner.top > RB.y && corner.left > RB.y)
        RB = new Point(corner.left, corner.top);

      const w = wall([start.left, start.top, end.left, end.top], i);
      return w;
    });

    view.add(...walls);
    walls.forEach((w) => view.sendObjectToBack(w));
    ROOM_SIZE = { width: RB.x - LT.x, height: RB.y - LT.y };
  }


  function locateDW(dw: Group, wall: Line, x: number, y: number) {
    const dWall = directionOfWall(wall);
    const dDW = dw.angle % 180 === 0 ? HORIZONTAL : VERTICAL;

    if (dWall != dDW) {
      dw.angle = (dw.angle + 90) % 360;
    }

    dw.top = y, dw.left = x;
    const center = dw.getCenterPoint();

    if (dWall === HORIZONTAL)
      center.y < dw.top ? dw.top += OFFSET : dw.top -= OFFSET;
    else
      center.x < dw.left ? dw.left += OFFSET : dw.left -= OFFSET;

    return dw;
  }

  function setDWOrigin(dw: Group) {
    if (!dw.flipX && !dw.flipY)
      dw.originX = 'left', dw.originY = 'top';
    else if (dw.flipX && !dw.flipY)
      dw.originX = 'right', dw.originY = 'top';
    else if (!dw.flipX && dw.flipY)
      dw.originX = 'left', dw.originY = 'bottom';
    else if (dw.flipX && dw.flipY)
      dw.originX = 'right', dw.originY = 'bottom';
    return dw;
  }



  /**********************************************************************************************************/

  function editRoom() {
    roomEditMode = true;
    drawToolsController?.applyCanvasMode();
    refreshRoomEditObjectModes(true);

    if (ctxRef.current.roomEditStates.length === 0)
      saveState();
  }

  function cancelRoomEdition() {
    roomEditMode = false;
    drawToolsController?.applyCanvasMode();
    refreshRoomEditObjectModes(false);
    selections = [];
    ctxRef.current.setSelections(selections);
    ctxRef.current.setUngroupable(false);
    view.discardActiveObject();
  }

  function handleObjectInsertion({ type, object }) {

    if (type === 'ROOM') {
      setRoom(object);
      return;
    }

    const group = _.createFurniture(type, object, DEFAULT_CHAIR);

    if (type === 'DOOR' || type === 'WINDOW') {
      group.originX = 'center';
      group.originY = 'top';


      const dws = filterObjects(['DOOR', 'WINDOW']);
      const dw = dws.length ? dws[dws.length - 1] : null;

      let wall, x, y;
      if (!dw) {
        wall = walls[0];
        x = Left(wall) + RL_AISLEGAP;
        y = Top(wall);
      } else {
        const od = dw.angle % 180 === 0 ? HORIZONTAL : VERTICAL;

        let placeOnNextWall = false;
        wall = wallOfDW(dw);

        if (od === HORIZONTAL) {
          x = dw.left + dw.width + RL_AISLEGAP;
          y = Top(wall);
          if (x + group.width > Right(wall)) {
            placeOnNextWall = true;
          }
        } else {
          y = dw.top + dw.width + RL_AISLEGAP;
          x = Left(wall);
          if (y + group.width > Bottom(wall)) {
            placeOnNextWall = true;
          }
        }

        if (placeOnNextWall) {
          wall = walls[(Number(wall.name.split(':')[1]) + 1) % walls.length];
          const nd = directionOfWall(wall);

          if (nd === HORIZONTAL) {
            x = Left(wall) + RL_AISLEGAP, y = Top(wall);
          } else {
            x = Left(wall), y = Top(wall) + RL_AISLEGAP;
          }
        }
      }

      locateDW(group, wall, x, y);

      group.hasBorders = false;
      view.add(group);

      return;
    }

    // retrieve spacing from object, use rlAisleGap if not specified
    const newLR = object.lrSpacing || RL_AISLEGAP;
    const newTB = object.tbSpacing || RL_AISLEGAP;

    // object groups use center as origin, so add half width and height of their reported
    // width and size; note that this will not account for chairs around tables, which is
    // intentional; they go in the specified gaps
    group.left = newLR + (group.width / 2) + roomOrigin();
    group.top = newTB + (group.height / 2) + roomOrigin();

    if (lastObject) {
      // retrieve spacing from object, use rlAisleGap if not specified
      const lastLR = lastObjectDefinition.lrSpacing || RL_AISLEGAP;
      const lastTB = lastObjectDefinition.tbSpacing || RL_AISLEGAP;

      // calculate maximum gap required by last and this object
      // Note: this isn't smart enough to get new row gap right when
      // object above had a much bigger gap, etc. We aren't fitting yet.
      const useLR = Math.max(newLR, lastLR), useTB = Math.max(newTB, lastTB);

      // using left/top vocab, though all objects are now centered
      const lastWidth = lastObjectDefinition.width || 100;
      const lastHeight = lastObjectDefinition.height || 40;

      let newLeft = lastObject.left + lastWidth + useLR;
      let newTop = lastObject.top;

      // make sure we fit left to right, including our required right spacing
      if (newLeft + group.width + newLR > ROOM_SIZE.width) {
        newLeft = newLR + (group.width / 2);
        newTop += lastHeight + useTB;
      }

      group.left = newLeft;
      group.top = newTop;

      if ((group.left - group.width / 2) < roomOrigin()) { group.left += roomOrigin(); }
      if ((group.top - group.height / 2) < roomOrigin()) { group.top += roomOrigin(); }
    }

    view.add(group);
    view.setActiveObject(group);

    lastObject = group;
    lastObjectDefinition = object;
  }


  async function restoreFromState(current: string | null) {
    if (!current) return;
    view.clear();
    await view.loadFromJSON(current);
    view.discardActiveObject();
    view.renderAll();
    corners = view.getObjects().filter((obj) => obj.name === 'CORNER');
    drawRoom();
    ctxRef.current.setSelections([]);
    ctxRef.current.setUngroupable(false);
    syncGrid();
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
    const state = view.toDatalessJSON(['name', 'hasControls', 'selectable', 'hasBorders', 'evented', 'hoverCursor', 'moveCursor']);
    ctxRef.current.pushState(JSON.stringify(state));
  }

  function exportState() {
    const state = view.toDatalessJSON([
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
      const popped = states.pop()!;
      current = states[states.length - 1];
      ctxRef.current.setRoomEditStates(states);
      ctxRef.current.setRoomEditRedoStates([...ctxRef.current.roomEditRedoStates, popped]);
    } else {
      const states = [...ctxRef.current.states];
      if (states.length <= 1) return;
      const popped = states.pop()!;
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
      current = redo.pop()!;
      ctxRef.current.setRoomEditRedoStates(redo);
      ctxRef.current.setRoomEditStates([...ctxRef.current.roomEditStates, current]);
    } else {
      const redo = [...ctxRef.current.redoStates];
      if (!redo.length) return;
      current = redo.pop()!;
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
    if (!active) {
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
      cloned.forEachObject((obj) => view.add(obj));
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
    selections.forEach(selection => view.remove(selection));
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

    if (!obj) { return; }

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

  function move(direction, increament = 6) {
    if (ctxRef.current.roomEdit) {
      return;
    }

    const active = view.getActiveObject();
    if (!active) {
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

  function resolveLayerCategory(obj: any): PlannerLayerCategory | null {
    const name = String(obj?.name ?? '');
    if (!name) return null;
    if (name === 'CORNER' || name.startsWith('WALL:') || name.startsWith('DOOR') || name.startsWith('WINDOW')) {
      return 'walls';
    }
    if (name.startsWith('DRAW:measure')) {
      return 'measurements';
    }
    if (name.startsWith('DRAW:')) {
      return 'zones';
    }
    if (name.startsWith('GENERIC:') || name.startsWith('TABLE') || name.startsWith('CHAIR') || name.startsWith('DESK')) {
      return 'furniture';
    }
    return null;
  }

  function setLayerVisibility(layerVisible: Record<PlannerLayerCategory, boolean>) {
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

  function setGridVisible(enabled: boolean) {
    ctxRef.current.gridEnabled = enabled;
    syncGrid();
  }

  function placeInCenter(direction) {
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
    selections.forEach(s => {
      if (action === 'left' || action === 'right' || action === 'center') {
        s.left = rect[action];
      } else {
        s.top = rect[action];
      }
    });
    view.renderAll();
    saveState();
  }

  function filterObjects(names: string[]) {
    return view.getObjects().filter((obj) => {
      const name = String(obj.name ?? '');
      return names.some((n) => name.includes(n));
    });
  }


  function wallOfDW(dw: Group | any) {
    const d = dw.angle % 180 === 0 ? HORIZONTAL : VERTICAL;
    return walls.find(w => Math.abs(d === HORIZONTAL ? w.top - dw.top : w.left - dw.left) === OFFSET);
  }

  function directionOfWall(wall: Line) {
    if (wall.x1 === wall.x2) {
      return VERTICAL;
    } else {
      return HORIZONTAL;
    }
  }

  function isDW(object) {
    const name = String(object?.name ?? '');
    return name.includes('DOOR') || name.includes('WINDOW');
  }

  function getBoundingRect(objects: any[]) {
    let top = 9999, left = 9999, right = 0, bottom = 0;
    objects.forEach(obj => {
      if (obj.left < top) {
        top = obj.top;
      }
      if (obj.left < left) {
        left = obj.left;
      }
      if (obj.top > bottom) {
        bottom = obj.top;
      }
      if (obj.left > right) {
        right = obj.left;
      }
    });

    const center = (left + right) / 2;
    const middle = (top + bottom) / 2;

    return { left, top, right, bottom, center, middle };
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
    drawToolsController?.dispose();
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
    drawToolsController?.setDrawFillColor(color);
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
  };
  return api;
}
