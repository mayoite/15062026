import { useCallback, useEffect, useState } from "react";
import {
  AssetRecordType,
  createShapeId,
  getIndices,
  toRichText,
  type Editor,
  type TLGeoShape,
  type TLLineShape,
} from "@/features/planner/shared/types/legacyEditorStub";

import type { BoqItem, CatalogProduct, PlannerDrawingTool, PlannerStep, RoomPreset } from "@/features/planner/shared/types/planner";

import { runPlannerComplianceCheck } from "../lib/compliance";
import { buildPlannerDocumentFromEditor, loadPlannerDocumentIntoEditor } from "../lib/documentBridge";
import {
  alignPlannerSelection,
  configureBasicShapeTool,
  configureWallTool,
  createPlannerDoorOpening,
  createPlannerWallSegment,
  distributePlannerSelection,
  readPlannerSelectionDimensions,
  resolvePlannerWallJoins,
  type PlannerSelectionDimensions,
  updatePlannerSelectionDimensions,
} from "../lib/editorTools";
import {
  deriveViewportState,
  formatDimensionPair,
  getShapeMeta,
  getStructuralShapes,
  type CanvasMeasurement,
} from "../lib/measurements";
import { buildPlannerQuoteCartItems, calculatePlannerBoqTotal } from "../lib/quoteBridge";
import { sanitizePlannerPlanName } from "../lib/sessionState";
import { usePlannerUiState } from "./usePlannerUiState";
import {
  createPlannerDocument,
  normalizePlannerDocument,
  type PlannerDocument as SavedPlannerDocument,
} from "../model";

const ROOM_BOUNDARY_ID = createShapeId("room-boundary");

const PAGE_UNIT_MM = 10;

/** Parse dimension numbers from a raw dimension string, respecting mm/cm/m units.
 *  Heuristic: if both numbers are small (<300) and no explicit 'mm' marker, treat as cm. */
function parseDimensionToMm(raw: string | undefined | null): { widthMm: number; depthMm: number } | null {
  if (!raw) return null;
  const normalized = String(raw).trim().toLowerCase();
  const numbers = normalized.match(/\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length < 2) return null;

  const a = Number.parseFloat(numbers[0]);
  const b = Number.parseFloat(numbers[1]);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null;

  // Detect unit from the string
  let multiplier = 1; // default: mm
  const hasExplicitMm = /\bmm\b/.test(normalized);
  const hasExplicitCm = /\bcm\b/.test(normalized);
  const hasExplicitM = /\bm\b/.test(normalized) && !hasExplicitMm && !hasExplicitCm;

  if (hasExplicitCm) {
    multiplier = 10;
  } else if (hasExplicitM) {
    multiplier = 1000;
  } else if (/\bin(?:ch(?:es)?)?\b|"/.test(normalized)) {
    multiplier = 25.4;
  } else if (/\bft|'/.test(normalized)) {
    multiplier = 304.8;
  } else if (!hasExplicitMm && a < 300 && b < 300) {
    // Heuristic: numbers like "120 x 60" with no unit are likely cm, not mm
    // (A 120mm desk is only 12cm — impossibly small)
    multiplier = 10;
  }

  const widthMm = Math.round(a * multiplier);
  const depthMm = Math.round(b * multiplier);

  // Clamp minimum to 300mm (30cm) — anything smaller is likely a parsing error
  return {
    widthMm: Math.max(300, widthMm),
    depthMm: Math.max(300, depthMm),
  };
}

const ROOM_PRESETS: RoomPreset[] = [
  // ── Single spaces ──────────────────────────────────────────────────────────
  {
    id: "cabin",
    name: "Cabin",
    summary: "Private enclosed office for 1–2 people.",
    widthMm: 3000, heightMm: 3000,
    zones: [{ label: "Cabin", widthMm: 3000 }],
  },
  {
    id: "meeting-room",
    name: "Meeting Room",
    summary: "Balanced conference room shell.",
    widthMm: 4800, heightMm: 3600,
    zones: [{ label: "Meeting Room", widthMm: 4800 }],
  },
  {
    id: "workspace",
    name: "Workspace",
    summary: "Open-plan workspace for 6–8 workstations.",
    widthMm: 6000, heightMm: 4800,
    zones: [{ label: "Workspace", widthMm: 6000 }],
  },
  // ── 2 spaces ───────────────────────────────────────────────────────────────
  {
    id: "cabin-workspace",
    name: "Cabin + Workspace",
    summary: "Private cabin and open workstation bay side by side.",
    widthMm: 9000, heightMm: 4800,
    zones: [
      { label: "Cabin", widthMm: 3000 },
      { label: "Workspace", widthMm: 6000 },
    ],
  },
  // ── 3 spaces ───────────────────────────────────────────────────────────────
  {
    id: "cabin-workspace-meeting",
    name: "Cabin + Workspace + Meeting",
    summary: "Three-zone office: private, open-plan, and conference.",
    widthMm: 13800, heightMm: 5400,
    zones: [
      { label: "Cabin", widthMm: 3000 },
      { label: "Workspace", widthMm: 6000 },
      { label: "Meeting Room", widthMm: 4800 },
    ],
  },
  // ── 5 spaces ───────────────────────────────────────────────────────────────
  {
    id: "full-office-suite",
    name: "Full Office Suite",
    summary: "Cabin · Workspace · Meeting · Pantry · Reception — 5 zones.",
    widthMm: 18000, heightMm: 7200,
    zones: [
      { label: "Cabin", widthMm: 3000 },
      { label: "Workspace", widthMm: 6000 },
      { label: "Meeting Room", widthMm: 4800 },
      { label: "Pantry", widthMm: 2100 },
      { label: "Reception", widthMm: 2100 },
    ],
  },
  // ── Executive floor (7th preset) ───────────────────────────────────────────
  {
    id: "executive-floor",
    name: "Executive Floor",
    summary: "Two cabins, boardroom, lounge, and support — 5 zones.",
    widthMm: 21600, heightMm: 9000,
    zones: [
      { label: "Cabin A", widthMm: 3600 },
      { label: "Cabin B", widthMm: 3600 },
      { label: "Boardroom", widthMm: 7200 },
      { label: "Lounge", widthMm: 4200 },
      { label: "Support", widthMm: 3000 },
    ],
  },
];

interface UsePlannerWorkspaceOptions {
  mode: "desktop" | "mobile" | "auto";
  planName: string;
  setPlanName: (value: string) => void;
  activeDocumentId: string | null;
  setActiveDocumentId: (value: string | null) => void;
  navigate: (href: string) => void;
  addBoqItem: (item: ReturnType<typeof buildPlannerQuoteCartItems>[number]) => void;
  clearBoqCart: () => void;
  catalogProducts?: CatalogProduct[];
}

function getCatalogMetadataValue(product: CatalogProduct, key: string) {
  if (!product.metadata || typeof product.metadata !== "object" || Array.isArray(product.metadata)) {
    return undefined;
  }

  const raw = product.metadata[key];
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : undefined;
}

function areSelectionDimensionsEqual(
  left: PlannerSelectionDimensions | null,
  right: PlannerSelectionDimensions | null,
) {
  if (left === right) return true;
  if (!left || !right) return false;
  return (
    left.shapeId === right.shapeId &&
    left.shapeName === right.shapeName &&
    left.mode === right.mode &&
    left.widthMm === right.widthMm &&
    left.heightMm === right.heightMm
  );
}

export function usePlannerWorkspace({
  mode,
  planName,
  setPlanName,
  activeDocumentId,
  setActiveDocumentId,
  navigate,
  addBoqItem,
  clearBoqCart,
}: UsePlannerWorkspaceOptions) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [boqItems, setBoqItems] = useState<BoqItem[]>([]);
  const [hasRoomShellDraft, setHasRoomShellDraft] = useState(false);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [hasSelection, setHasSelection] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [roomMetrics, setRoomMetrics] = useState("W 9000 x H 6500 mm");
  const [selectedMetrics, setSelectedMetrics] = useState<string | null>(null);
  const [selectionDimensions, setSelectionDimensions] = useState<PlannerSelectionDimensions | null>(null);
  const [canvasMeasurements, setCanvasMeasurements] = useState<CanvasMeasurement[]>([]);
  const [gridState, setGridState] = useState({ originX: 0, originY: 0, zoom: 1 });
  const [aiSuggestions, setAiSuggestions] = useState<
    Array<{ type: "warning" | "tip" | "action"; text: string }>
  >([]);
  const ui = usePlannerUiState({ mode });
  const {
    isMobileMode,
    currentStep,
    activeDrawingTool,
    showCatalog,
    showLayers,
    showInspector,
    catalogPinned,
    layersPinned,
    inspectorPinned,
    isSnapMode,
    isGridVisible,
    unitSystem,
    activePanel,
    showAi,
    mobileCatalogOpen,
    mobileLayersOpen,
    mobileInspectorOpen,
    setCurrentStep,
    setActiveDrawingTool,
    setShowCatalog,
    setShowLayers,
    setShowInspector,
    setCatalogPinned,
    setLayersPinned,
    setInspectorPinned,
    setIsSnapMode,
    setIsGridVisible,
    setUnitSystem,
    setActivePanel,
    setShowAi,
    setMobileCatalogOpen,
    setMobileLayersOpen,
    setMobileInspectorOpen,
  } = ui;

  const canEnterCatalog = hasRoomShellDraft;
  const canEnterMeasure = hasRoomShellDraft;
  const canEnterReview = hasRoomShellDraft;

  const getActionableSelectionIds = useCallback(
    () =>
      editor
        ?.getSelectedShapeIds()
        .filter((shapeId) => {
          const meta = getShapeMeta(editor.getShape(shapeId)?.meta);
          return shapeId !== ROOM_BOUNDARY_ID && !meta.isRoomDimension;
        }) ?? [],
    [editor],
  );

  const selectDrawingTool = useCallback(
    (tool: PlannerDrawingTool) => {
      setActiveDrawingTool(tool);
      if (!editor) return;

      if (tool === "line") {
        configureWallTool(editor);
        return;
      }

      if (tool === "geo") {
        configureBasicShapeTool(editor);
        return;
      }

      // text and arrow map directly to tldraw native tools
      editor.setCurrentTool(tool);
    },
    [editor, setActiveDrawingTool],
  );

  const applyStepMode = useCallback(
    (nextStep: PlannerStep, options?: { force?: boolean }) => {
      const force = options?.force === true;
      if (!force && nextStep === "catalog" && !canEnterCatalog) return;
      if (!force && nextStep === "measure" && !canEnterMeasure) return;
      if (!force && nextStep === "review" && !canEnterReview) return;

      setCurrentStep(nextStep);

      if (nextStep === "room") {
        setShowCatalog(true);
        setShowInspector(true);
        setActivePanel("catalog");
        setMobileLayersOpen(false);
        setMobileInspectorOpen(false);
        selectDrawingTool("line");
        return;
      }

      if (nextStep === "catalog") {
        setShowCatalog(true);
        setShowInspector(true);
        setActivePanel("catalog");
        setMobileLayersOpen(false);
        setMobileInspectorOpen(false);
        selectDrawingTool("select");
        return;
      }

      if (nextStep === "measure") {
        setShowCatalog(false);
        setShowLayers(true);
        setShowInspector(true);
        setInspectorPinned(true);
        setActivePanel("inspector");
        setMobileCatalogOpen(false);
        setMobileLayersOpen(false);
        if (isMobileMode) {
          setMobileInspectorOpen(true);
        }
        // Activate the line tool for measurement drawing
        selectDrawingTool("line");
        return;
      }

      // review step
      setShowCatalog(false);
      setShowLayers(true);
      setShowInspector(true);
      setInspectorPinned(true);
      setActivePanel("inspector");
      setMobileCatalogOpen(false);
      setMobileLayersOpen(false);
      if (isMobileMode) {
        setMobileInspectorOpen(true);
      }
      selectDrawingTool("select");
    },
    [
      canEnterCatalog,
      canEnterMeasure,
      canEnterReview,
      isMobileMode,
      selectDrawingTool,
      setActivePanel,
      setCurrentStep,
      setInspectorPinned,
      setMobileCatalogOpen,
      setMobileInspectorOpen,
      setMobileLayersOpen,
      setShowCatalog,
      setShowInspector,
      setShowLayers,
    ],
  );

  const applyPlannerDocument = useCallback(
    (document: SavedPlannerDocument) => {
      const normalized = normalizePlannerDocument(document);

      setPlanName(sanitizePlannerPlanName(normalized.name));
      setActiveDocumentId(normalized.id ?? null);
      setUnitSystem(normalized.unitSystem === "imperial" ? "ft-in" : "mm");

      if (editor) {
        loadPlannerDocumentIntoEditor(null, normalized);
        const structuralShapes = getStructuralShapes(editor);
        setHasRoomShellDraft(structuralShapes.length > 0);
      }

      applyStepMode(normalized.itemCount > 0 ? "catalog" : "room", { force: true });
    },
    [
      applyStepMode,
      editor,
      setActiveDocumentId,
      setPlanName,
      setUnitSystem,
    ],
  );

  const buildAiSuggestions = useCallback(
    (items: BoqItem[], totalShapes: number, geometricWarnings: string[] = []) => {
      const suggestions: Array<{ type: "warning" | "tip" | "action"; text: string }> = [];

      if (geometricWarnings.length > 0) {
        geometricWarnings.forEach((warning) => {
          suggestions.push({
            type: warning.includes("CRITICAL") ? "action" : "warning",
            text: warning,
          });
        });
      } else if (items.length >= 6) {
        suggestions.push({ type: "tip", text: "Healthy density. Clearances look compliant." });
      }

      if (currentStep === "room") {
        suggestions.push({
          type: "tip",
          text: "Step 1 is room shell only. Use presets, wall chains, or basic shapes to define the room first.",
        });
      }

      if (currentStep === "catalog" && items.length === 0) {
        suggestions.push({
          type: "tip",
          text: "Step 2 is catalog. Place modules only after the room shell is defined.",
        });
      }

      if (currentStep === "review" && items.length > 0) {
        suggestions.push({
          type: "action",
          text: `${items.length} item(s) ready. Open the BOQ enquiry to continue.`,
        });
      }

      setAiSuggestions(suggestions);
    },
    [currentStep],
  );

  const handleMount = useCallback((app: Editor) => {
    setEditor(app);
    app.updateInstanceState({ isGridMode: false });
    app.user.updateUserPreferences({ isSnapMode: true });
    configureWallTool(app);
    setActiveDrawingTool("line");
  }, [setActiveDrawingTool]);

  useEffect(() => {
    if (editor) {
      editor.user.updateUserPreferences({ isSnapMode });
    }
  }, [editor, isSnapMode]);

  useEffect(() => {
    if (editor) {
      editor.updateInstanceState({ isGridMode: false });
    }
  }, [editor, isGridVisible]);

  const syncViewportState = useCallback(() => {
    if (!editor) return;

    const selectedShapeIds = editor.getSelectedShapeIds();
    const viewportState = deriveViewportState(editor, selectedShapeIds, unitSystem);

    setZoomPercent(viewportState.zoomPercent);
    setGridState(viewportState.gridState);
    setHasSelection(viewportState.hasSelection);
    setCanUndo(viewportState.canUndo);
    setCanRedo(viewportState.canRedo);
    setRoomMetrics(viewportState.roomMetrics);
    setSelectedMetrics(viewportState.selectedMetrics);
    const nextSelectionDimensions = readPlannerSelectionDimensions(editor, selectedShapeIds);
    setSelectionDimensions((currentSelectionDimensions) =>
      areSelectionDimensionsEqual(currentSelectionDimensions, nextSelectionDimensions)
        ? currentSelectionDimensions
        : nextSelectionDimensions,
    );
    setCanvasMeasurements(viewportState.canvasMeasurements);
  }, [editor, unitSystem]);

  useEffect(() => {
    if (!editor) return;

    let frameId = 0;
    const scheduleViewportSync = () => {
      if (frameId !== 0) return;

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        syncViewportState();
      });
    };

    scheduleViewportSync();
    const stopListening = editor.store.listen(scheduleViewportSync);

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
      stopListening();
    };
  }, [editor, syncViewportState]);

  useEffect(() => {
    if (!editor) return;

    const syncBoq = () => {
      const shapes = editor.getCurrentPageShapes();
      const items = shapes
        .filter((shape) => getShapeMeta(shape.meta).isPlannerItem)
        .map((shape) => {
          const meta = getShapeMeta(shape.meta);
          const measuredWidthMm =
            "props" in shape && shape.props && typeof shape.props === "object" && "w" in shape.props && typeof shape.props.w === "number"
              ? Math.round(shape.props.w * PAGE_UNIT_MM)
              : null;
          const measuredDepthMm =
            "props" in shape && shape.props && typeof shape.props === "object" && "h" in shape.props && typeof shape.props.h === "number"
              ? Math.round(shape.props.h * PAGE_UNIT_MM)
              : null;
          const measuredDimensions =
            measuredWidthMm && measuredDepthMm
              ? formatDimensionPair(measuredWidthMm, measuredDepthMm, unitSystem)
              : meta.dimensions || "";
          return {
            id: String(shape.id),
            productId: meta.productId,
            productSlug: meta.productSlug,
            plannerSourceSlug: meta.plannerSourceSlug,
            name: meta.text || "Custom Module",
            category: meta.category || "Workstations",
            price: 0,
            imageUrl: meta.imageUrl,
            dimensions: measuredDimensions,
          } satisfies BoqItem;
        });
      const structuralShapes = getStructuralShapes(editor);

      setBoqItems(items);
      setHasRoomShellDraft(structuralShapes.length > 0);
      const geometricWarnings = runPlannerComplianceCheck(null, shapes);
      buildAiSuggestions(items, shapes.length, geometricWarnings);
    };

    syncBoq();

    const stopListening = editor.store.listen(
      (history) => {
        const { added, updated, removed } = history.changes;
        if (
          Object.keys(added).length > 0 ||
          Object.keys(updated).length > 0 ||
          Object.keys(removed).length > 0
        ) {
          syncBoq();
        }
      },
      { scope: "document" },
    );

    return () => stopListening();
  }, [buildAiSuggestions, editor, unitSystem]);

  const buildCurrentPlannerDocument = useCallback(() => {
    if (!editor) {
      return createPlannerDocument({
        id: activeDocumentId ?? undefined,
        name: planName,
        unitSystem: unitSystem === "ft-in" ? "imperial" : "metric",
      });
    }

    return buildPlannerDocumentFromEditor(null, {
      documentId: activeDocumentId,
      name: planName,
      unitSystem,
    });
  }, [activeDocumentId, editor, planName, unitSystem]);

  const handleDropFurniture = useCallback(
    (product: CatalogProduct | { name: string; category: string }) => {
      if (!editor) return;
      if (currentStep !== "catalog" || !canEnterCatalog) {
        setAiSuggestions([
          {
            type: "warning",
            text: "Product placement belongs to Step 2. Finish the room shell first, then move to Catalog.",
          },
        ]);
        setShowCatalog(true);
        setShowInspector(true);
        return;
      }

      const viewportCenter = editor.getViewportPageBounds().center;
      let width = 120;
      let height = 120;

      const dimensions = "specs" in product ? product.specs?.dimensions : undefined;
      const parsedDims = parseDimensionToMm(dimensions);
      if (parsedDims) {
        width = parsedDims.widthMm / PAGE_UNIT_MM || 120;
        height = parsedDims.depthMm / PAGE_UNIT_MM || 120;
      }

      const productId = "id" in product && typeof product.id === "string" ? product.id : undefined;
      const productSlug = "slug" in product && typeof product.slug === "string" ? product.slug : undefined;
      const plannerSourceSlug =
        ("plannerSourceSlug" in product && typeof product.plannerSourceSlug === "string"
          ? product.plannerSourceSlug
          : undefined) ??
        getCatalogMetadataValue(product as CatalogProduct, "plannerSourceSlug") ??
        getCatalogMetadataValue(product as CatalogProduct, "sourceSlug");
      const imageUrl =
        ("flagship_image" in product ? product.flagship_image || product.images?.[0] : undefined) ?? undefined;
      const meta = {
        text: product.name,
        productId,
        productSlug,
        plannerSourceSlug,
        imageUrl,
        isPlannerItem: true,
        category: product.category || getCatalogMetadataValue(product as CatalogProduct, "category") || "Workstations",
        dimensions: dimensions || "",
      };

      const snapToPlacementGrid = (value: number) => Math.round(value / 40) * 40;
      const x = snapToPlacementGrid(viewportCenter.x - width / 2);
      const y = snapToPlacementGrid(viewportCenter.y - height / 2);

      if (imageUrl) {
        const assetId = AssetRecordType.createId();
        editor.createAssets([
          {
            id: assetId,
            type: "image",
            typeName: "asset",
            props: {
              w: width,
              h: height,
              name: product.name,
              isAnimated: false,
              mimeType: "image/png",
              src: imageUrl,
            },
            meta: {},
          },
        ]);

        editor.createShape({
          id: createShapeId(),
          type: "image",
          x,
          y,
          props: { w: width, h: height, assetId },
          meta,
        });
        return;
      }

      editor.createShape({
        id: createShapeId(),
        type: "geo",
        x,
        y,
        props: { geo: "rectangle", w: width, h: height, color: "blue", fill: "semi", size: "s" } as TLGeoShape["props"],
        meta,
      });
    },
    [canEnterCatalog, currentStep, editor, setShowCatalog, setShowInspector],
  );

  const handleClearAll = useCallback(() => {
    if (!editor) return;

    const shapeIds = editor.getCurrentPageShapes().map((shape) => shape.id);

    editor.deleteShapes(shapeIds);
    setActiveDocumentId(null);
    setPlanName("Untitled plan");
    applyStepMode("room");
  }, [applyStepMode, editor, setActiveDocumentId, setPlanName]);

  const handleApplyRoomPreset = useCallback(
    (preset: RoomPreset) => {
      if (!editor) return;

      // Clear canvas
      const existingIds = editor.getCurrentPageShapes().map((s) => s.id);
      if (existingIds.length > 0) editor.deleteShapes(existingIds);

      const SCALE = 0.1; // mm → canvas units (1 unit = 10mm)
      const W = preset.widthMm * SCALE;
      const H = preset.heightMm * SCALE;
      const vc = editor.getViewportPageBounds().center;
      const ox = vc.x - W / 2;
      const oy = vc.y - H / 2;

      const zones = preset.zones ?? [{ label: preset.name, widthMm: preset.widthMm }];
      const isMultiZone = zones.length > 1;

      // Wall thickness in canvas units (120mm walls)
      const WALL_T = 120 * SCALE; // 12 canvas units
      // Door opening width in canvas units (900mm)
      const DOOR_W = 900 * SCALE; // 90 canvas units

      // ── 1. Outer boundary shell (always) ─────────────────────────────────
      const outerIdx = getIndices(5);
      const outerPts = [
        { x: 0, y: 0 }, { x: W, y: 0 },
        { x: W, y: H }, { x: 0, y: H }, { x: 0, y: 0 },
      ];
      editor.createShape({
        id: ROOM_BOUNDARY_ID,
        type: "line",
        x: ox, y: oy,
        props: {
          color: "black",
          dash: "solid",
          size: "m",
          spline: "line",
          scale: 1,
          points: Object.fromEntries(
            outerPts.map((pt, i) => [
              outerIdx[i],
              { id: outerIdx[i], index: outerIdx[i], x: pt.x, y: pt.y },
            ]),
          ),
        } as TLLineShape["props"],
        meta: { isRoomShell: true, structureType: "room-shell", presetId: preset.id, text: preset.name },
      });

      if (isMultiZone) {
        // ── 2. Thick partition walls between zones ────────────────────────
        let xCursor = 0;
        zones.forEach((zone, zIdx) => {
          const zoneW = zone.widthMm * SCALE;

          if (zIdx < zones.length - 1) {
            xCursor += zoneW;

            // Thick partition wall as a geo rectangle
            editor.createShape({
              id: createShapeId(`wall-${preset.id}-${zIdx}`),
              type: "geo",
              x: ox + xCursor - WALL_T / 2,
              y: oy,
              props: {
                geo: "rectangle",
                w: WALL_T,
                h: H,
                color: "black",
                fill: "solid",
                size: "s",
                dash: "solid",
              } as TLGeoShape["props"],
              meta: { structureType: "wall-segment" },
            });

            // Door opening cut — centred vertically in the wall
            const doorY = oy + H / 2 - DOOR_W / 2;
            editor.createShape({
              id: createShapeId(`door-${preset.id}-${zIdx}`),
              type: "geo",
              x: ox + xCursor - WALL_T / 2 - 1,
              y: doorY,
              props: {
                geo: "rectangle",
                w: WALL_T + 2,
                h: DOOR_W,
                color: "grey",
                fill: "solid",
                size: "s",
                dash: "draw",
              } as TLGeoShape["props"],
              meta: { structureType: "door-opening" },
            });
          }

          // ── 3. Zone label text at centre of each space ───────────────────
          // Compute correct zone start
          let zoneOx = 0;
          for (let k = 0; k < zIdx; k++) {
            zoneOx += (zones[k]?.widthMm ?? 0) * SCALE;
          }
          const zoneCx = ox + zoneOx + zoneW / 2;
          const zoneCy = oy + H / 2;

          editor.createShape({
            id: createShapeId(`label-${preset.id}-${zIdx}`),
            type: "note",
            x: zoneCx - Math.min(zoneW * 0.38, 120),
            y: zoneCy - 20,
            props: {
              richText: toRichText(zone.label),
              size: "m",
              font: "sans",
              color: "grey",
              labelColor: "black",
              align: "middle",
              verticalAlign: "middle",
              growY: 0,
              url: "",
              scale: 1,
              fontSizeAdjustment: 0,
            },
          });
        });

        // Outer boundary walls (thick geo on all 4 sides)
        // Top wall
        editor.createShape({
          id: createShapeId(`wall-top-${preset.id}`),
          type: "geo",
          x: ox, y: oy,
          props: { geo: "rectangle", w: W, h: WALL_T, color: "black", fill: "solid", size: "s", dash: "solid" } as TLGeoShape["props"],
          meta: { structureType: "wall-segment" },
        });
        // Bottom wall
        editor.createShape({
          id: createShapeId(`wall-bottom-${preset.id}`),
          type: "geo",
          x: ox, y: oy + H - WALL_T,
          props: { geo: "rectangle", w: W, h: WALL_T, color: "black", fill: "solid", size: "s", dash: "solid" } as TLGeoShape["props"],
          meta: { structureType: "wall-segment" },
        });
        // Left wall
        editor.createShape({
          id: createShapeId(`wall-left-${preset.id}`),
          type: "geo",
          x: ox, y: oy,
          props: { geo: "rectangle", w: WALL_T, h: H, color: "black", fill: "solid", size: "s", dash: "solid" } as TLGeoShape["props"],
          meta: { structureType: "wall-segment" },
        });
        // Right wall
        editor.createShape({
          id: createShapeId(`wall-right-${preset.id}`),
          type: "geo",
          x: ox + W - WALL_T, y: oy,
          props: { geo: "rectangle", w: WALL_T, h: H, color: "black", fill: "solid", size: "s", dash: "solid" } as TLGeoShape["props"],
          meta: { structureType: "wall-segment" },
        });
        // Main entry door on bottom wall
        editor.createShape({
          id: createShapeId(`door-entry-${preset.id}`),
          type: "geo",
          x: ox + W / 2 - DOOR_W / 2,
          y: oy + H - WALL_T - 1,
          props: {
            geo: "rectangle",
            w: DOOR_W,
            h: WALL_T + 2,
            color: "grey",
            fill: "solid",
            size: "s",
            dash: "draw",
          } as TLGeoShape["props"],
          meta: { structureType: "door-opening" },
        });

      } else {
        // Single-zone: simple vertical dividers (legacy behaviour)
        let xCursor = 0;
        zones.forEach((zone, zIdx) => {
          const zoneW = zone.widthMm * SCALE;
          if (zIdx < zones.length - 1) {
            xCursor += zoneW;
            const divIdx = getIndices(2);
            editor.createShape({
              id: createShapeId(`divider-${preset.id}-${zIdx}`),
              type: "line",
              x: ox + xCursor, y: oy,
              props: {
                color: "grey",
                dash: "solid",
                size: "s",
                spline: "line",
                scale: 1,
                points: Object.fromEntries(
                  [{ x: 0, y: 0 }, { x: 0, y: H }].map((pt, i) => [
                    divIdx[i],
                    { id: divIdx[i], index: divIdx[i], x: pt.x, y: pt.y },
                  ]),
                ),
              } as TLLineShape["props"],
              meta: { structureType: "wall" },
            });
          }
        });
      }

      applyStepMode("room");
      editor.select(ROOM_BOUNDARY_ID);
      editor.zoomToSelection({ animation: { duration: 200 } });
    },
    [applyStepMode, editor],
  );

  const handleActivateWallTool = useCallback(() => {
    if (currentStep === "room") applyStepMode("room");
    selectDrawingTool("line");
  }, [applyStepMode, currentStep, selectDrawingTool]);

  const handleActivateBasicShapeTool = useCallback(() => {
    if (currentStep === "room") applyStepMode("room");
    selectDrawingTool("geo");
  }, [applyStepMode, currentStep, selectDrawingTool]);

  const handleAddWallSegment = useCallback(() => {
    if (!editor) return;
    if (currentStep === "room") applyStepMode("room");
    createPlannerWallSegment(editor);
    resolvePlannerWallJoins(editor);
  }, [applyStepMode, currentStep, editor]);

  const handleAddDoorOpening = useCallback(() => {
    if (!editor) return;
    if (currentStep === "room") applyStepMode("room");
    createPlannerDoorOpening(editor);
  }, [applyStepMode, currentStep, editor]);

  const handleResolveWallJoins = useCallback(() => {
    if (!editor) return;
    const selectedIds = getActionableSelectionIds();
    resolvePlannerWallJoins(editor, selectedIds.length > 0 ? selectedIds : undefined);
  }, [editor, getActionableSelectionIds]);

  const handleAdvanceBoqFlow = useCallback(() => {
    if (currentStep === "room") {
      if (!canEnterCatalog) return;
      applyStepMode("catalog");
      return;
    }
    if (currentStep === "catalog") {
      if (!canEnterMeasure) return;
      applyStepMode("measure");
      return;
    }
    if (currentStep === "measure") {
      if (!canEnterReview) return;
      applyStepMode("review");
      return;
    }
    if (boqItems.length === 0) return;

    clearBoqCart();
    buildPlannerQuoteCartItems(boqItems).forEach((item) => {
      addBoqItem(item);
    });

    navigate("/quote-cart");
  }, [addBoqItem, applyStepMode, boqItems, canEnterCatalog, canEnterMeasure, canEnterReview, clearBoqCart, currentStep, navigate]);

  const totalBoq = calculatePlannerBoqTotal(boqItems);

  const adjustZoom = useCallback(
    (factor: number) => {
      if (!editor) return;

      const camera = editor.getCamera();
      const nextZoom = Math.max(20, Math.min(400, Math.round(camera.z * factor * 100))) / 100;
      editor.setCamera({ ...camera, z: nextZoom });
      setZoomPercent(Math.round(nextZoom * 100));
    },
    [editor],
  );

  const handleUndo = useCallback(() => {
    if (!editor || !editor.canUndo()) return;
    editor.undo();
  }, [editor]);

  const handleRedo = useCallback(() => {
    if (!editor || !editor.canRedo()) return;
    editor.redo();
  }, [editor]);

  const handleFitToDrawing = useCallback(() => {
    if (!editor) return;
    editor.zoomToFit({ animation: { duration: 200 } });
  }, [editor]);

  const handleFitToSelection = useCallback(() => {
    if (!editor || getActionableSelectionIds().length === 0) return;
    editor.zoomToSelection({ animation: { duration: 200 } });
  }, [editor, getActionableSelectionIds]);

  const handleDeselectSelection = useCallback(() => {
    if (!editor) return;
    editor.selectNone();
  }, [editor]);

  const handleDuplicateSelection = useCallback(() => {
    if (!editor) return;
    const selectedIds = getActionableSelectionIds();
    if (selectedIds.length === 0) return;
    editor.duplicateShapes(selectedIds, { x: 40, y: 40 });
  }, [editor, getActionableSelectionIds]);

  const handleDeleteSelection = useCallback(() => {
    if (!editor) return;
    const selectedIds = getActionableSelectionIds();
    if (selectedIds.length === 0) return;
    editor.deleteShapes(selectedIds);
  }, [editor, getActionableSelectionIds]);

  const handleAlignSelection = useCallback(
    (operation: Parameters<Editor["alignShapes"]>[1]) => {
      if (!editor) return;
      alignPlannerSelection(editor, getActionableSelectionIds(), operation);
    },
    [editor, getActionableSelectionIds],
  );

  const handleDistributeSelection = useCallback(
    (operation: Parameters<Editor["distributeShapes"]>[1]) => {
      if (!editor) return;
      distributePlannerSelection(editor, getActionableSelectionIds(), operation);
    },
    [editor, getActionableSelectionIds],
  );

  const handleUpdateSelectionDimensions = useCallback(
    (next: { widthMm?: number; heightMm?: number | null }) => {
      if (!editor || !selectionDimensions) return;
      const didUpdateSelection = updatePlannerSelectionDimensions(editor, selectionDimensions, next);
      if (didUpdateSelection && selectionDimensions.mode === "line") {
        resolvePlannerWallJoins(editor, [selectionDimensions.shapeId]);
      }
    },
    [editor, selectionDimensions],
  );

  return {
    roomPresets: ROOM_PRESETS,
    editor,
    boqItems,
    canEnterCatalog,
    canEnterMeasure,
    canEnterReview,
    currentStep,
    activeDrawingTool,
    showCatalog,
    showLayers,
    showInspector,
    catalogPinned,
    layersPinned,
    inspectorPinned,
    isSnapMode,
    isGridVisible,
    zoomPercent,
    hasSelection,
    canUndo,
    canRedo,
      roomMetrics,
      selectedMetrics,
      selectionDimensions,
      canvasMeasurements,
      unitSystem,
    gridState,
    activePanel,
    aiSuggestions,
    showAi,
    mobileCatalogOpen,
    mobileLayersOpen,
    mobileInspectorOpen,
    isMobileMode,
    totalBoq,
    setShowCatalog,
    setShowLayers,
    setShowInspector,
    setCatalogPinned,
    setLayersPinned,
    setInspectorPinned,
    setIsSnapMode,
    setIsGridVisible,
    setUnitSystem,
    setActivePanel,
    setShowAi,
    setMobileCatalogOpen,
    setMobileLayersOpen,
    setMobileInspectorOpen,
    selectDrawingTool,
    handleMount,
    applyStepMode,
    applyPlannerDocument,
    buildCurrentPlannerDocument,
    handleDropFurniture,
    handleClearAll,
      handleApplyRoomPreset,
      handleActivateWallTool,
      handleActivateBasicShapeTool,
      handleAddWallSegment,
      handleAddDoorOpening,
      handleResolveWallJoins,
      handleAdvanceBoqFlow,
      adjustZoom,
      handleUndo,
      handleRedo,
      handleFitToDrawing,
      handleFitToSelection,
      handleDeselectSelection,
      handleDuplicateSelection,
      handleDeleteSelection,
      handleAlignSelection,
      handleDistributeSelection,
      handleUpdateSelectionDimensions,
    };
  }
