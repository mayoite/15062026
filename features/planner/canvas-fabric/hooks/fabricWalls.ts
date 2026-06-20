import { Rect, Line, Point, Group, Canvas as FabricCanvas } from 'fabric';
import * as _ from '../lib/helpers';

export interface FabricWallsOptions {
  getView: () => FabricCanvas;
  getCorners: () => Rect[];
  setCorners: (corners: Rect[]) => void;
  getWalls: () => Line[];
  setWalls: (walls: Line[]) => void;
  isRoomEditActive: () => boolean;
  enterRoomEdit: () => void;
  saveState: () => void;
  getScenePointer: (e: any) => Point | null;
  getRoomSize: () => { width: number; height: number };
  setRoomSize: (size: { width: number; height: number }) => void;
}

export function wireFabricWalls(options: FabricWallsOptions) {
  const {
    getView, getCorners, setCorners, getWalls, setWalls,
    isRoomEditActive, enterRoomEdit, saveState, getScenePointer,
    setRoomSize
  } = options;

  let MOVE_WALL_ID = -1;

  const {
    RL_ROOM_OUTER_SPACING,
    RL_ROOM_INNER_SPACING,
    RL_ROOM_STROKE,
    RL_CORNER_FILL,
  } = _;

  const HORIZONTAL = 'HORIZONTAL';
  const VERTICAL = 'VERTICAL';
  const OFFSET = RL_ROOM_INNER_SPACING / 2;

  const Left = (wall: any) => wall.x1 < wall.x2 ? wall.x1 : wall.x2;
  const Top = (wall: any) => wall.y1 < wall.y2 ? wall.y1 : wall.y2;
  const Right = (wall: any) => wall.x1 > wall.x2 ? wall.x1 : wall.x2;
  const Bottom = (wall: any) => wall.y1 > wall.y2 ? wall.y1 : wall.y2;

  function isWallLine(obj: any): obj is Line {
    return Boolean(obj && obj instanceof Line && String((obj as any).name ?? '').includes('WALL'));
  }

  function directionOfWall(wall: Line) {
    if (wall.x1 === wall.x2) {
      return VERTICAL;
    } else {
      return HORIZONTAL;
    }
  }

  function wallOfDW(dw: Group | any) {
    const d = dw.angle % 180 === 0 ? HORIZONTAL : VERTICAL;
    const walls = getWalls();
    return walls.find(w => Math.abs(d === HORIZONTAL ? Top(w) - dw.top : Left(w) - dw.left) === OFFSET);
  }

  function cornersOfWall(obj: Line) {
    const id = Number(String((obj as any).name ?? '').split(':')[1]);
    const v1Id = id;
    const corners = getCorners();
    const walls = getWalls();
    const v1 = corners[v1Id];
    const v2Id = (id + 1) % walls.length;
    const v2 = corners[v2Id];
    return { v1, v1Id, v2, v2Id };
  }

  function updateWallsFromCorners() {
    const walls = getWalls();
    const corners = getCorners();
    const view = getView();

    walls.forEach((w, i) => {
      const start = corners[i];
      const end = (i === corners.length - 1) ? corners[0] : corners[i + 1];
      const left = (start.left + end.left) / 2;
      const top = (start.top + end.top) / 2;
      const width = Math.max(0.01, Math.abs(end.left - start.left));
      const height = Math.max(0.01, Math.abs(end.top - start.top));
      w.set({
        x1: start.left - left,
        y1: start.top - top,
        x2: end.left - left,
        y2: end.top - top,
        left,
        top,
        width,
        height
      });
      w.setCoords();
    });
    corners.forEach(c => c.setCoords());
    view.requestRenderAll();
  }

  function moveWallCornersToPointer(p: Point) {
    const corners = getCorners();
    const v1 = corners[MOVE_WALL_ID];
    const v2 = corners[(MOVE_WALL_ID + 1) % corners.length];
    if (!v1 || !v2) return;

    const direction = v1.left === v2.left ? 'HORIZONTAL' : 'VERTICAL';
    const x = Math.max(RL_ROOM_OUTER_SPACING, p.x);
    const y = Math.max(RL_ROOM_OUTER_SPACING, p.y);

    if (direction === 'VERTICAL') {
      v1.set({ top: y });
      v2.set({ top: y });
    } else {
      v1.set({ left: x });
      v2.set({ left: x });
    }

    updateWallsFromCorners();
  }

  function setCornerStyle(c: Rect) {
    c.moveCursor = 'move';
    c.hoverCursor = isRoomEditActive() ? 'move' : 'default';
    c.selectable = isRoomEditActive();
    c.evented = isRoomEditActive();
    c.width = c.height = (RL_ROOM_INNER_SPACING / (isRoomEditActive() ? 1.5 : 2)) * 2;
    c.set('fill', isRoomEditActive() ? RL_CORNER_FILL : RL_ROOM_STROKE);
  }

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

  function refreshRoomEditObjectModes(inRoomEdit: boolean) {
    const corners = getCorners();
    const view = getView();

    corners.forEach((corner) => setCornerStyle(corner));
    view.getObjects().forEach((obj) => {
      const name = String((obj as any).name ?? '');
      if (name.includes('WALL')) {
        obj.selectable = inRoomEdit;
        obj.evented = true;
        obj.hoverCursor = inRoomEdit ? 'move' : 'pointer';
        (obj as any).hasBorders = inRoomEdit;
        obj.perPixelTargetFind = true;
        obj.padding = 8;
      } else if (name === 'CORNER') {
        setCornerStyle(obj as Rect);
      } else {
        obj.selectable = !inRoomEdit;
        obj.evented = !inRoomEdit;
      }
    });
    view.requestRenderAll();
  }

  function drawRoom() {
    const view = getView();
    const corners = getCorners();

    const exists = view.getObjects().filter((obj) => {
      const name = String((obj as any).name ?? '');
      return name.includes('WALL') || name === 'CORNER';
    });
    view.remove(...exists);
    view.add(...corners);

    const wall = (coords: [number, number, number, number], index: number) => new Line(coords, {
      stroke: RL_ROOM_STROKE,
      strokeWidth: RL_ROOM_INNER_SPACING,
      name: `WALL:${index}`,
      originX: 'center',
      originY: 'center',
      hoverCursor: isRoomEditActive() ? 'move' : 'pointer',
      hasControls: false,
      hasBorders: isRoomEditActive(),
      selectable: isRoomEditActive(),
      evented: true,
      perPixelTargetFind: true,
      padding: 8,
      cornerStyle: 'rect',
    } as any);

    let LT = new Point(9999, 9999), RB = new Point(0, 0);

    const walls = corners.map((corner, i) => {
      const start = corner;
      const end = (i === corners.length - 1) ? corners[0] : corners[i + 1];

      if (corner.left < LT.x && corner.top < LT.y)
        LT = new Point(corner.left, corner.top);

      if (corner.left > RB.x && corner.top > RB.y)
        RB = new Point(corner.left, corner.top);

      const w = wall([start.left, start.top, end.left, end.top] as [number, number, number, number], i);
      return w;
    });

    setWalls(walls);
    view.add(...walls);
    walls.forEach((w) => view.sendObjectToBack(w));
    setRoomSize({ width: RB.x - LT.x, height: RB.y - LT.y });
  }

  function setRoom({ width, height }: { width: number; height: number }) {
    const walls = getWalls();
    const view = getView();

    if (walls.length) {
      view.remove(...walls);
      view.renderAll();
    }

    const LT = new Point(RL_ROOM_OUTER_SPACING, RL_ROOM_OUTER_SPACING);
    const RT = new Point(LT.x + width, LT.y);
    const LB = new Point(LT.x, LT.y + height);
    const RB = new Point(RT.x, LB.y);

    const newCorners = [LT, RT, RB, LB].map(p => drawCorner(p));
    setCorners(newCorners);
    drawRoom();
  }

  function handleMouseDownBefore(e: any) {
    const obj = e.target;
    if (isWallLine(obj)) {
      if (!isRoomEditActive()) {
        enterRoomEdit();
      }
      if (!isRoomEditActive()) return;

      let { v1, v2, v1Id, v2Id } = cornersOfWall(obj);
      const corners = getCorners();
      const v0Id = (v1Id === 0) ? corners.length - 1 : v1Id - 1;
      const v3Id = (v2Id === corners.length - 1) ? 0 : v2Id + 1;
      const v0 = corners[v0Id];
      const v3 = corners[v3Id];

      MOVE_WALL_ID = v1Id;

      let inserted = false;
      if ((v0.top === v1.top && v1.top === v2.top) || (v0.left === v1.left && v1.left === v2.left)) {
        corners.splice(v1Id, 0, drawCorner(new Point(v1.left, v1.top)));
        setCorners([...corners]);
        MOVE_WALL_ID = v1Id + 1;
        v2Id += 1;
        inserted = true;
      }

      if ((v1.top === v2.top && v2.top === v3.top) || (v1.left === v2.left && v2.left === v3.left)) {
        corners.splice(v2Id + 1, 0, drawCorner(new Point(v2.left, v2.top)));
        setCorners([...corners]);
        inserted = true;
      }

      if (inserted) {
        drawRoom();
        saveState();
      }
    }
  }

  function handleObjectMoving(e: any) {
    const obj = e.target;
    if (MOVE_WALL_ID !== -1) {
      const p = getScenePointer(e);
      if (p) moveWallCornersToPointer(p);
    } else if (obj && obj.name === 'CORNER') {
      updateWallsFromCorners();
    }
  }

  function handleMouseUp(e: any) {
    const obj = e.target;
    if (MOVE_WALL_ID !== -1 || (obj && obj.name === 'CORNER')) {
      drawRoom();
      MOVE_WALL_ID = -1;
      saveState();
    }
  }

  function handleDoubleClick(e: any) {
    const obj = e.target;

    if (!isRoomEditActive() && isWallLine(obj)) {
      enterRoomEdit();
      return;
    }

    if (isRoomEditActive() && !obj) {
      // Return true to indicate main canvas should handle this (cancelRoomEdition)
      return true;
    }

    if (isRoomEditActive() && isWallLine(obj)) {
      const p = getScenePointer(e);
      if (!p) return;

      const { v1, v1Id, v2, v2Id } = cornersOfWall(obj);
      const corners = getCorners();
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

      setCorners([...corners]);
      drawRoom();
      saveState();
    }
    return false;
  }

  function handleObjectMoved() {
    if (MOVE_WALL_ID !== -1) {
      MOVE_WALL_ID = -1;
    }
  }

  return {
    isWallLine,
    directionOfWall,
    wallOfDW,
    setRoom,
    drawRoom,
    refreshRoomEditObjectModes,
    handleMouseDownBefore,
    handleObjectMoving,
    handleMouseUp,
    handleDoubleClick,
    handleObjectMoved,
    Left,
    Top,
    Right,
    Bottom,
    OFFSET,
    HORIZONTAL,
    VERTICAL
  };
}
