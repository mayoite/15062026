import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { PlannerLayerCategory } from '@/features/planner/store/workspaceStore';
import type { FabricContextMenuState, FabricDrawTool } from '../fabricDrawToolTypes';
import { DEFAULT_FABRIC_DRAW_COLOR, DEFAULT_FABRIC_FILL_COLOR } from '../fabricDrawToolTypes';
import { PLANNER_VIEWPORT } from '@/features/planner/lib/canvasBounds';

export type FloorplanOperation =
  | 'UNDO'
  | 'REDO'
  | 'COPY'
  | 'PASTE'
  | 'DELETE'
  | 'ROTATE'
  | 'ROTATE_ANTI'
  | 'GROUP'
  | 'UNGROUP'
  | 'HORIZONTAL'
  | 'VERTICAL'
  | 'PNG'
  | 'SVG'
  | 'ZOOM'
  | 'LEFT'
  | 'CENTER'
  | 'RIGHT'
  | 'TOP'
  | 'MIDDLE'
  | 'BOTTOM'
  | 'GRID'
  | 'SNAP';

export type InsertPayload = { type: string; object: unknown };

export type FloorplanCanvasApi = {
  undo: () => void;
  redo: () => void;
  copy: () => void;
  paste: () => void;
  delete: () => void;
  rotate: (clockwise?: boolean) => void;
  group: () => void;
  ungroup: () => void;
  placeInCenter: (direction: 'HORIZONTAL' | 'VERTICAL') => void;
  arrange: (action: string) => void;
  setZoom: (zoomPct: number) => void;
  setGridVisible: (enabled: boolean) => void;
  exportState: () => string | null;
  importState: (serialized: string) => Promise<void>;
  exportSvg: () => string | null;
  exportPngBlob: () => Promise<Blob | null>;
  saveAs: (format: string) => void;
  handleInsert: (payload: InsertPayload) => void;
  editRoom: () => void;
  cancelRoomEdition: () => void;
  setDrawTool: (tool: FabricDrawTool) => void;
  setDrawColor: (color: string) => void;
  setDrawFillColor: (color: string) => void;
  applyStrokeToSelection: (color: string) => void;
  applyFillToSelection: (color: string) => void;
  setContextMenuListener: (listener: ((state: FabricContextMenuState | null) => void) | null) => void;
  fitToStage: () => number;
  fitToContent: (padding?: number) => number;
  recalcOffset: () => void;
  setLayerVisibility: (layerVisible: Record<PlannerLayerCategory, boolean>) => void;
  resizeObject: (shapeId: string, widthMm: number, heightMm: number) => void;
  setObjectRotation: (shapeId: string, angleDeg: number) => void;
  setObjectLock: (shapeId: string, locked: boolean) => void;
  clientToSceneUnits: (clientX: number, clientY: number) => { x: number; y: number } | null;
  setFloorPlanUnderlay: (
    source: string,
    options?: { opacity?: number; fileName?: string },
  ) => Promise<void>;
};

type FloorplanContextValue = {
  roomEdit: boolean;
  states: string[];
  redoStates: string[];
  roomEditStates: string[];
  roomEditRedoStates: string[];
  selections: Array<Record<string, unknown>>;
  ungroupable: boolean;
  zoom: number;
  gridEnabled: boolean;
  snapEnabled: boolean;
  drawTool: FabricDrawTool;
  drawColor: string;
  drawFillColor: string;
  contextMenu: FabricContextMenuState | null;
  defaultChair: unknown;
  setDefaultChair: (chair: unknown) => void;
  setSelections: (items: Array<Record<string, unknown>>) => void;
  setUngroupable: (value: boolean) => void;
  setZoom: (value: number) => void;
  setGridEnabled: (value: boolean) => void;
  setStates: React.Dispatch<React.SetStateAction<string[]>>;
  setRedoStates: React.Dispatch<React.SetStateAction<string[]>>;
  setRoomEditStates: React.Dispatch<React.SetStateAction<string[]>>;
  setRoomEditRedoStates: React.Dispatch<React.SetStateAction<string[]>>;
  pushState: (state: string) => void;
  insertObject: (payload: InsertPayload) => void;
  exportDraft: () => string | null;
  importDraft: (serialized: string) => Promise<void>;
  exportSvg: () => string | null;
  exportPngBlob: () => Promise<Blob | null>;
  performOperation: (operation: FloorplanOperation) => void;
  editRoom: () => void;
  endEditRoom: () => void;
  undo: () => void;
  redo: () => void;
  clone: () => void;
  copy: () => void;
  paste: () => void;
  deleteSelection: () => void;
  rotateClockWise: () => void;
  rotateAntiClockWise: () => void;
  group: () => void;
  ungroup: () => void;
  placeInCenter: (direction: 'HORIZONTAL' | 'VERTICAL') => void;
  arrange: (side: string) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  setDrawTool: (tool: FabricDrawTool) => void;
  setDrawColor: (color: string) => void;
  setDrawFillColor: (color: string) => void;
  closeContextMenu: () => void;
  registerCanvasApi: (api: FloorplanCanvasApi | null) => void;
  refitCanvas: () => void;
  fitToContent: (padding?: number) => number;
  setLayerVisibility: (layerVisible: Record<PlannerLayerCategory, boolean>) => void;
  resizeObject: (shapeId: string, widthMm: number, heightMm: number) => void;
  setObjectRotation: (shapeId: string, angleDeg: number) => void;
  setObjectLock: (shapeId: string, locked: boolean) => void;
  clientToSceneUnits: (clientX: number, clientY: number) => { x: number; y: number } | null;
  setFloorPlanUnderlay: (
    source: string,
    options?: { opacity?: number; fileName?: string },
  ) => Promise<void>;
};

const FloorplanContext = createContext<FloorplanContextValue | null>(null);

export function FloorplanProvider({ children }: { children: ReactNode }) {
  const apiRef = useRef<FloorplanCanvasApi | null>(null);
  const [roomEdit, setRoomEdit] = useState(false);
  const [states, setStates] = useState<string[]>([]);
  const [redoStates, setRedoStates] = useState<string[]>([]);
  const [roomEditStates, setRoomEditStates] = useState<string[]>([]);
  const [roomEditRedoStates, setRoomEditRedoStates] = useState<string[]>([]);
  const [selections, setSelections] = useState<Array<Record<string, unknown>>>([]);
  const [ungroupable, setUngroupable] = useState(false);
  const [zoom, setZoomState] = useState(100);
  const [gridEnabled, setGridEnabledState] = useState(true);
  const [snapEnabled, setSnapEnabledState] = useState(true);
  const [drawTool, setDrawToolState] = useState<FabricDrawTool>('select');
  const [drawColor, setDrawColorState] = useState<string>(DEFAULT_FABRIC_DRAW_COLOR);
  const [drawFillColor, setDrawFillColorState] = useState<string>(DEFAULT_FABRIC_FILL_COLOR);
  const [contextMenu, setContextMenu] = useState<FabricContextMenuState | null>(null);
  const [defaultChair, setDefaultChair] = useState<unknown>(null);

  const registerCanvasApi = useCallback((api: FloorplanCanvasApi | null) => {
    apiRef.current = api;
    if (api) {
      api.setDrawTool(drawTool);
      api.setDrawColor(drawColor);
      api.setDrawFillColor(drawFillColor);
      api.setContextMenuListener(setContextMenu);
    } else {
      setContextMenu(null);
    }
  }, [drawColor, drawFillColor, drawTool]);

  const performOperation = useCallback((operation: FloorplanOperation) => {
    const api = apiRef.current;
    if (!api) return;
    switch (operation) {
      case 'UNDO':
        api.undo();
        break;
      case 'REDO':
        api.redo();
        break;
      case 'COPY':
        api.copy();
        break;
      case 'PASTE':
        api.paste();
        break;
      case 'DELETE':
        api.delete();
        break;
      case 'ROTATE':
        api.rotate(true);
        break;
      case 'ROTATE_ANTI':
        api.rotate(false);
        break;
      case 'GROUP':
        api.group();
        break;
      case 'UNGROUP':
        api.ungroup();
        break;
      case 'HORIZONTAL':
      case 'VERTICAL':
        api.placeInCenter(operation);
        break;
      case 'PNG':
      case 'SVG':
        api.saveAs(operation);
        break;
      case 'ZOOM':
        api.setZoom(zoom);
        break;
      case 'GRID':
        api.setGridVisible(gridEnabled);
        break;
      case 'LEFT':
      case 'CENTER':
      case 'RIGHT':
      case 'TOP':
      case 'MIDDLE':
      case 'BOTTOM':
        api.arrange(operation);
        break;
      default:
        break;
    }
  }, [gridEnabled, zoom]);

  const insertObject = useCallback((payload: InsertPayload) => {
    apiRef.current?.handleInsert(payload);
  }, []);

  const exportDraft = useCallback(() => {
    return apiRef.current?.exportState() ?? null;
  }, []);

  const exportSvg = useCallback(() => {
    return apiRef.current?.exportSvg() ?? null;
  }, []);

  const exportPngBlob = useCallback(async () => {
    const api = apiRef.current;
    if (!api) return null;
    return api.exportPngBlob();
  }, []);

  const importDraft = useCallback(async (serialized: string) => {
    const api = apiRef.current;
    if (!api) return;

    await api.importState(serialized);
    setSelections([]);
    setUngroupable(false);
    setRoomEdit(false);
    setStates([serialized]);
    setRedoStates([]);
    setRoomEditStates([]);
    setRoomEditRedoStates([]);
  }, []);

  const pushState = useCallback(
    (state: string) => {
      if (roomEdit) {
        setRoomEditStates((prev) => [...prev, state]);
        setRoomEditRedoStates([]);
        return;
      }
      setStates((prev) => [...prev, state]);
      setRedoStates([]);
    },
    [roomEdit],
  );

  const setDrawTool = useCallback((tool: FabricDrawTool) => {
    setDrawToolState(tool);
    apiRef.current?.setDrawTool(tool);
  }, []);

  const setDrawColor = useCallback((color: string) => {
    setDrawColorState(color);
    apiRef.current?.setDrawColor(color);
    apiRef.current?.applyStrokeToSelection(color);
  }, []);

  const setDrawFillColor = useCallback((color: string) => {
    setDrawFillColorState(color);
    apiRef.current?.setDrawFillColor(color);
    apiRef.current?.applyFillToSelection(color);
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const editRoomMode = useCallback(() => {
    setDrawTool('select');
    setRoomEdit(true);
    apiRef.current?.editRoom();
  }, [setDrawTool]);

  const endEditRoom = useCallback(() => {
    setRoomEdit(false);
    apiRef.current?.cancelRoomEdition();
  }, []);

  const undo = useCallback(() => {
    if ((states.length === 1 && !roomEdit) || (roomEditStates.length === 1 && roomEdit)) return;
    performOperation('UNDO');
  }, [performOperation, roomEdit, roomEditStates.length, states.length]);

  const redo = useCallback(() => {
    if ((redoStates.length === 0 && !roomEdit) || (roomEditRedoStates.length === 0 && roomEdit)) return;
    performOperation('REDO');
  }, [performOperation, redoStates.length, roomEdit, roomEditRedoStates.length]);

  const setZoom = useCallback((value: number) => {
    setZoomState(value);
    apiRef.current?.setZoom(value);
  }, []);

  const setGridEnabled = useCallback(
    (value: boolean) => {
      setGridEnabledState(value);
      setTimeout(() => {
        apiRef.current?.setGridVisible(value);
      }, 0);
    },
    [],
  );

  const refitCanvas = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;
    const zoomPct = api.fitToContent();
    setZoomState(zoomPct);
    api.recalcOffset();
  }, []);

  const fitToContent = useCallback((padding?: number) => {
    const api = apiRef.current;
    if (!api) return PLANNER_VIEWPORT.defaultZoomPercent;
    const zoomPct = api.fitToContent(padding);
    setZoomState(zoomPct);
    api.recalcOffset();
    return zoomPct;
  }, []);

  const setLayerVisibility = useCallback((layerVisible: Record<PlannerLayerCategory, boolean>) => {
    apiRef.current?.setLayerVisibility(layerVisible);
  }, []);

  const resizeObject = useCallback((shapeId: string, widthMm: number, heightMm: number) => {
    apiRef.current?.resizeObject(shapeId, widthMm, heightMm);
  }, []);

  const setObjectRotation = useCallback((shapeId: string, angleDeg: number) => {
    apiRef.current?.setObjectRotation(shapeId, angleDeg);
  }, []);

  const setObjectLock = useCallback((shapeId: string, locked: boolean) => {
    apiRef.current?.setObjectLock(shapeId, locked);
  }, []);

  const clientToSceneUnits = useCallback((clientX: number, clientY: number) => {
    return apiRef.current?.clientToSceneUnits(clientX, clientY) ?? null;
  }, []);

  const setFloorPlanUnderlay = useCallback(
    async (source: string, options?: { opacity?: number; fileName?: string }) => {
      const api = apiRef.current;
      if (!api) return;
      await api.setFloorPlanUnderlay(source, options);
    },
    [],
  );

  const zoomIn = useCallback(() => {
    setZoomState((z) => {
      if (z >= PLANNER_VIEWPORT.zoomMaxPercent) return z;
      const next = z + 10;
      apiRef.current?.setZoom(next);
      return next;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoomState((z) => {
      if (z <= PLANNER_VIEWPORT.zoomMinPercent) return z;
      const next = z - 10;
      apiRef.current?.setZoom(next);
      return next;
    });
  }, []);

  const value = useMemo<FloorplanContextValue>(
    () => ({
      roomEdit,
      states,
      redoStates,
      roomEditStates,
      roomEditRedoStates,
      selections,
      ungroupable,
      zoom,
      gridEnabled,
      snapEnabled,
      drawTool,
      drawColor,
      drawFillColor,
      contextMenu,
      defaultChair,
      setDefaultChair,
      setSelections,
      setUngroupable,
      setZoom,
      setGridEnabled,
      setStates,
      setRedoStates,
      setRoomEditStates,
      setRoomEditRedoStates,
      pushState,
      insertObject,
      exportDraft,
      importDraft,
      exportSvg,
      exportPngBlob,
      performOperation,
      editRoom: editRoomMode,
      endEditRoom,
      undo,
      redo,
      clone: () => {
        performOperation('COPY');
        setTimeout(() => performOperation('PASTE'), 100);
      },
      copy: () => performOperation('COPY'),
      paste: () => performOperation('PASTE'),
      deleteSelection: () => {
        if (selections.length) performOperation('DELETE');
      },
      rotateClockWise: () => performOperation('ROTATE'),
      rotateAntiClockWise: () => performOperation('ROTATE_ANTI'),
      group: () => performOperation('GROUP'),
      ungroup: () => performOperation('UNGROUP'),
      placeInCenter: (direction) => performOperation(direction),
      arrange: (side) => performOperation(side as FloorplanOperation),
      zoomIn,
      zoomOut,
      toggleGrid: () => setGridEnabled(!gridEnabled),
      toggleSnap: () => setSnapEnabledState(!snapEnabled),
      setDrawTool,
      setDrawColor,
      setDrawFillColor,
      closeContextMenu,
      registerCanvasApi,
      refitCanvas,
      fitToContent,
      setLayerVisibility,
      resizeObject,
      setObjectRotation,
      setObjectLock,
      clientToSceneUnits,
      setFloorPlanUnderlay,
    }),
    [
      roomEdit,
      states,
      redoStates,
      roomEditStates,
      roomEditRedoStates,
      selections,
      ungroupable,
      zoom,
      gridEnabled,
      snapEnabled,
      drawTool,
      drawColor,
      drawFillColor,
      contextMenu,
      defaultChair,
      pushState,
      insertObject,
      exportDraft,
      importDraft,
      exportSvg,
      exportPngBlob,
      performOperation,
      editRoomMode,
      endEditRoom,
      undo,
      redo,
      zoomIn,
      zoomOut,
      setZoom,
      setGridEnabled,
      setDrawTool,
      setDrawColor,
      setDrawFillColor,
      closeContextMenu,
      registerCanvasApi,
      refitCanvas,
      fitToContent,
      setLayerVisibility,
      resizeObject,
      setObjectRotation,
      setObjectLock,
      clientToSceneUnits,
      setFloorPlanUnderlay,
    ],
  );

  return <FloorplanContext.Provider value={value}>{children}</FloorplanContext.Provider>;
}

export function useFloorplan() {
  const ctx = useContext(FloorplanContext);
  if (!ctx) throw new Error('useFloorplan must be used within FloorplanProvider');
  return ctx;
}
