import {
  FabricText,
  Line,
  Path,
  PencilBrush,
  Point,
  Rect,
} from "fabric";
import type { Canvas as FabricCanvas, CanvasEvents, FabricObject, TPointerEventInfo } from "fabric";
import type { FabricDrawTool } from "../fabricDrawToolTypes";
import { DEFAULT_FABRIC_DRAW_COLOR } from "../fabricDrawToolTypes";
import { applyFabricTransformLocks } from "../fabricObjectUtils";

const ANNOTATION_PREFIX = "DRAW:";
const MIN_DRAW_GESTURE_PX = 5;

type PlannerFabricObject = FabricObject & {
  evented?: boolean;
  hasBorders?: boolean;
  hasControls?: boolean;
  name?: string;
  selectable?: boolean;
};

function formatMeasureLabel(pixelDistance: number): string {
  const inches = Math.max(0, pixelDistance);
  const feet = Math.floor(inches / 12);
  const remInches = Math.round(inches % 12);
  const mm = Math.round(inches * 25.4);
  return `${feet}' ${remInches}" · ${mm.toLocaleString()} mm`;
}

function isProtectedObject(obj: PlannerFabricObject | null | undefined): boolean {
  const name = String(obj?.name ?? "");
  return (
    name === "CORNER" ||
    name.startsWith("WALL:") ||
    name.startsWith("DOOR") ||
    name.startsWith("WINDOW") ||
    name.startsWith("TABLE") ||
    name.startsWith("CHAIR")
  );
}

export function wireFabricDrawTools(options: {
  getView: () => FabricCanvas | undefined;
  getScenePointer: (e: TPointerEventInfo) => Point | null;
  getDrawTool: () => FabricDrawTool;
  getDrawColor: () => string;
  getDrawFillColor: () => string;
  roomEditActive: () => boolean;
  saveState: () => void;
}) {
  let activeTool: FabricDrawTool = "select";
  let activeColor: string = DEFAULT_FABRIC_DRAW_COLOR;
  let drawStart: Point | null = null;
  let previewObject: PlannerFabricObject | null = null;
  let curvePoints: Point[] = [];

  const getView = () => options.getView();

  function clearPreview() {
    const view = getView();
    if (previewObject && view) {
      view.remove(previewObject);
      previewObject = null;
      view.requestRenderAll();
    }
  }

  function resetDraft() {
    drawStart = null;
    curvePoints = [];
    clearPreview();
  }

  function applyCanvasMode() {
    const view = getView();
    if (!view) return;

    const tool = options.getDrawTool();
    const color = options.getDrawColor();
    activeTool = tool;
    activeColor = color;

    if (options.roomEditActive() || tool === "select") {
      view.isDrawingMode = false;
      view.selection = true;
      view.defaultCursor = "default";
      resetDraft();
      return;
    }

    if (tool === "pen") {
      view.selection = false;
      view.isDrawingMode = true;
      if (!view.freeDrawingBrush) {
        view.freeDrawingBrush = new PencilBrush(view);
      }
      view.freeDrawingBrush.color = color;
      view.freeDrawingBrush.width = 2;
      resetDraft();
      return;
    }

    view.isDrawingMode = false;
    view.selection = tool === "eraser";
    view.defaultCursor = tool === "eraser" ? "not-allowed" : "crosshair";
    resetDraft();
  }

  function setDrawTool(tool: FabricDrawTool) {
    activeTool = tool;
    applyCanvasMode();
  }

  function setDrawColor(color: string) {
    activeColor = color;
    applyCanvasMode();
  }

  function setDrawFillColor(_color: string) {
    applyCanvasMode();
  }

  function commitAnnotation(obj: PlannerFabricObject) {
    const view = getView();
    if (!view || !obj) return;

    obj.name = `${ANNOTATION_PREFIX}${activeTool}`;
    obj.selectable = true;
    obj.evented = true;
    obj.hasControls = true;
    obj.hasBorders = true;
    applyFabricTransformLocks(obj);
    view.add(obj);
    view.setActiveObject(obj);
    view.requestRenderAll();
    options.saveState();
  }

  function addMeasureLabel(x1: number, y1: number, x2: number, y2: number) {
    const view = getView();
    if (!view) return;

    const distance = Math.hypot(x2 - x1, y2 - y1);
    const label = new FabricText(formatMeasureLabel(distance), {
      left: (x1 + x2) / 2,
      top: (y1 + y2) / 2 - 14,
      fontSize: 11,
      fontFamily: "Arial, sans-serif",
      fill: activeColor,
      backgroundColor: "rgba(255,255,255,0.88)",
      name: `${ANNOTATION_PREFIX}measure-label`,
      originX: "center",
      originY: "center",
      selectable: true,
      evented: true,
    });
    view.add(label);
  }

  function finalizeLine(end: Point, asMeasure = false) {
    if (!drawStart) return;
    if (Math.hypot(end.x - drawStart.x, end.y - drawStart.y) < MIN_DRAW_GESTURE_PX) {
      resetDraft();
      return;
    }
    const line = new Line([drawStart.x, drawStart.y, end.x, end.y], {
      stroke: activeColor,
      strokeWidth: 2,
      fill: "",
      originX: "center",
      originY: "center",
    });
    commitAnnotation(line);
    if (asMeasure) {
      addMeasureLabel(drawStart.x, drawStart.y, end.x, end.y);
    }
    resetDraft();
  }

  function finalizeRectangle(end: Point) {
    if (!drawStart) return;
    const left = Math.min(drawStart.x, end.x);
    const top = Math.min(drawStart.y, end.y);
    const width = Math.abs(end.x - drawStart.x);
    const height = Math.abs(end.y - drawStart.y);
    if (width < MIN_DRAW_GESTURE_PX || height < MIN_DRAW_GESTURE_PX) {
      resetDraft();
      return;
    }

    const fill = options.getDrawFillColor();
    const rect = new Rect({
      left,
      top,
      width,
      height,
      fill: fill === "transparent" ? "transparent" : fill,
      stroke: activeColor,
      strokeWidth: 2,
    });
    rect.set('originX', 'left');
    rect.set('originY', 'top');
    commitAnnotation(rect);
    resetDraft();
  }

  function finalizeCurve() {
    if (curvePoints.length < 3) {
      resetDraft();
      return;
    }
    const [start, control, end] = curvePoints;
    const path = new Path(`M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`, {
      fill: "",
      stroke: activeColor,
      strokeWidth: 2,
    });
    commitAnnotation(path);
    resetDraft();
  }

  const view = getView();
  if (!view) {
    return { setDrawTool, setDrawColor, applyCanvasMode, dispose: () => {} };
  }

  view.on("path:created", (event: CanvasEvents["path:created"]) => {
    const path = event.path as PlannerFabricObject | undefined;
    if (!path || options.getDrawTool() !== "pen") return;
    path.name = `${ANNOTATION_PREFIX}pen`;
    path.stroke = options.getDrawColor();
    options.saveState();
  });

  view.on("mouse:down", (event: CanvasEvents["mouse:down"]) => {
    const tool = options.getDrawTool();
    if (options.roomEditActive() || tool === "select" || tool === "pen") return;

    const pointer = options.getScenePointer(event);
    if (!pointer) return;

    if (tool === "eraser") {
      const target = (event.target as PlannerFabricObject | undefined) ?? null;
      if (target && !isProtectedObject(target)) {
        view.remove(target);
        view.discardActiveObject();
        view.requestRenderAll();
        options.saveState();
      }
      return;
    }

    if (tool === "curve") {
      curvePoints.push(new Point(pointer.x, pointer.y));
      if (curvePoints.length === 3) {
        finalizeCurve();
      }
      return;
    }

    drawStart = new Point(pointer.x, pointer.y);
  });

  view.on("mouse:move", (event: CanvasEvents["mouse:move"]) => {
    const tool = options.getDrawTool();
    if (!drawStart || options.roomEditActive()) return;
    if (tool !== "line" && tool !== "measure" && tool !== "rectangle") return;

    const pointer = options.getScenePointer(event);
    if (!pointer) return;

    clearPreview();

    if (tool === "line" || tool === "measure") {
      previewObject = new Line([drawStart.x, drawStart.y, pointer.x, pointer.y], {
        stroke: activeColor,
        strokeWidth: 2,
        strokeDashArray: tool === "measure" ? [6, 4] : undefined,
        selectable: false,
        evented: false,
      });
    } else if (tool === "rectangle") {
      const left = Math.min(drawStart.x, pointer.x);
      const top = Math.min(drawStart.y, pointer.y);
      const fillColor = options.getDrawFillColor();
      previewObject = new Rect({
        left,
        top,
        width: Math.abs(pointer.x - drawStart.x),
        height: Math.abs(pointer.y - drawStart.y),
        fill: fillColor === "transparent" ? "rgba(0,0,0,0.02)" : fillColor,
        stroke: activeColor,
        strokeWidth: 2,
        selectable: false,
        evented: false,
      });
    }

    if (previewObject) {
      view.add(previewObject);
      view.requestRenderAll();
    }
  });

  view.on("mouse:up", (event: CanvasEvents["mouse:up"]) => {
    const tool = options.getDrawTool();
    if (!drawStart || options.roomEditActive()) return;
    if (tool !== "line" && tool !== "measure" && tool !== "rectangle") return;

    const pointer = options.getScenePointer(event);
    if (!pointer) return;

    clearPreview();

    if (tool === "line") {
      finalizeLine(pointer, false);
    } else if (tool === "measure") {
      finalizeLine(pointer, true);
    } else if (tool === "rectangle") {
      finalizeRectangle(pointer);
    }
  });

  applyCanvasMode();

  return {
    setDrawTool,
    setDrawColor,
    setDrawFillColor,
    applyCanvasMode,
    dispose: () => {
      resetDraft();
    },
  };
}
