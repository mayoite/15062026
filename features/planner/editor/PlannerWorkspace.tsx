/**
 * PlannerWorkspace — unified workspace planner editor shell.
 *
 * Fabric canvas + interface as the 2D engine.
 * Combined with 3D (r3f). Fabric drives the 2D canvas and feeds the 3D viewer.
 *
 * Session / persistence handlers live in usePlannerSessionHandlers.ts (split for file-size).
 */

"use client";

import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { PanelRightClose } from "lucide-react";
import { usePlannerStore } from "@/features/planner/store/plannerStore";
import { usePlannerUIStore } from "@/features/planner/store/plannerUIStore";
import dynamic from "next/dynamic";
// P7-10: three.js must NOT be in the initial bundle — load async only when 3D view mounts.
const Planner3DViewer = dynamic(
  () => import("@/features/planner/3d/Planner3DViewer").then((m) => ({ default: m.Planner3DViewer })),
  { ssr: false },
);
import { PlannerSkeleton } from "@/features/planner/ui/PlannerSkeleton";
import { getPlannerFabricRuntime } from "@/features/planner/canvas-fabric";
import { queueQuickStarterLayout } from "@/features/planner/ai/quickStarterLayout";
import { readFloorPlanImageFile } from "@/features/planner/lib/floorPlanImageImport";
import { PlannerToolRail } from "@/features/planner/editor/PlannerToolRail";
import { PlannerToolFabricSync } from "@/features/planner/editor/PlannerToolFabricSync";
import { plannerToolToToolId } from "@/features/planner/editor/plannerToolFabricBridge";
import { readPlannerToolVisibilityMode } from "@/features/planner/editor/plannerToolVisibility";
import { PlannerLeftPanel } from "@/features/planner/editor/PlannerLeftPanel";
import { PlannerTopBar } from "@/features/planner/editor/PlannerTopBar";
import { PlannerSubTopBar } from "@/features/planner/editor/PlannerSubTopBar";
import { usePlannerPanels } from "@/features/planner/editor/usePlannerPanels";
import {
  readPlannerWorkspacePreferences,
  writePlannerWorkspacePreferences,
} from "@/features/planner/editor/plannerWorkspacePreferences";
import { PlannerChromeHost } from "@/features/planner/editor/chrome/PlannerChromeHost";
import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import {
  catalogFootprintToCanvasUnits,
  resolveCatalogItemBlock2D,
  resolveCatalogPlacementFootprintMm,
} from "@/features/planner/catalog/catalogBlockBridge";
import { blockToSvg } from "@/lib/catalog/blocks2d";
import { usePlannerCatalogStore } from "@/features/planner/catalog/catalogStore";
import { usePlannerCatalogHydration } from "@/features/planner/catalog/usePlannerCatalogHydration";
import {
  getDefaultPlacementCatalogItemId,
  isFurniturePlacementCatalogItem,
} from "@/features/planner/catalog/placementCatalogResolver";
import {
  isCatalogShapeType,
  isRoomCatalogShapeType,
  PlannerCatalogShapeType,
  acceptsCatalogDrag,
  readCatalogDragPayload,
} from "@/features/planner/catalog/shapeTypeRegistry";
import { buildTemplateCanvasPlacements, type LayoutTemplate } from "@/features/planner/templates/layoutTemplates";
import { CatalogDropFlash } from "@/features/planner/catalog/CatalogDropFlash";
import { CatalogDropGhost } from "@/features/planner/catalog/CatalogDropGhost";
import { PlannerWorkspaceLayout } from "@/features/planner/editor/PlannerWorkspaceLayout";
import { PlannerErrorBoundary } from "@/features/planner/editor/PlannerErrorBoundary";
import { PlannerCanvasStage } from "@/features/planner/editor/PlannerCanvasStage";

import { useTheme } from "@/features/planner/components/WorkspaceThemeProvider";
import { usePlannerFabricAutosave } from "@/features/planner/hooks/usePlannerFabricAutosave";
import {
  useFabricPlanMetrics,
  useFabricSelectionStatus,
} from "@/features/planner/hooks/useFabricPlannerState";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";
import { PlannerStatusBar } from "@/features/planner/editor/PlannerStatusBar";
import { TemplatePickerModal } from "@/features/planner/editor/templates/TemplatePickerModal";
import { ExportModal } from "@/features/planner/editor/ExportModal";
import {
  getStepLeftTab,
  getStepToolBinding,
  type PlannerLeftTab,
} from "@/features/planner/editor/plannerStepBindings";
import {
  evaluatePlannerStepGates,
  getDisabledPlannerSteps,
  type PlannerStep,
} from "@/features/planner/editor/plannerStep";
import {
  plannerUnitSystemToMeasurementUnit,
  type MeasurementUnit,
} from "@/features/planner/lib/measurements";
import {
  resolvePlannerToolKey,
  type PlannerToolBinding,
} from "@/features/planner/editor/plannerKeyboardShortcuts";
import { buildPlannerDocumentFromEditor } from "@/features/planner/document/plannerDocumentBridge";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import {
  buildSketchPlanFabricDraft,
  getSketchRecoveryMessage,
  type SketchRecoveryState,
} from "@/features/planner/ai/sketchToPlan";
import {
  SketchToPlanRouteErrorSchema,
  SketchToPlanRouteResponseSchema,
  type SketchRecoveryReason,
} from "@/lib/api/schemas";

import { resetPlannerChromeLayout } from "@/features/planner/editor/chrome/plannerChromeStorage";
import {
  FloorplanProvider,
  FabricCanvasWorkspace,
  RoomPresetsOnOpen,
  setPlannerFabricRuntime,
  setPlannerFabricRuntimeState,
  createPlannerFabricRuntimeCleanup,
  useFloorplan,
} from "@/features/planner/canvas-fabric";
import { applyLayerVisibility } from "@/features/planner/editor/layerVisibility";
import { sanitizePlannerPlanName } from "@/features/planner/lib/sessionState";
import { usePlannerSessionHandlers } from "@/features/planner/editor/usePlannerSessionHandlers";

const PropertiesInspector = dynamic(
  () => import("@/features/planner/editor/inspector/PropertiesInspector").then((m) => ({ default: m.PropertiesInspector })),
  { ssr: false, loading: () => null },
);
const LayerVisibilityPanel = dynamic(
  () => import("@/features/planner/editor/LayerVisibilityPanel").then((m) => ({ default: m.LayerVisibilityPanel })),
  { ssr: false, loading: () => null },
);
const LayerManagerPanel = dynamic(
  () => import("@/features/planner/editor/LayerManagerPanel").then((m) => ({ default: m.LayerManagerPanel })),
  { ssr: false, loading: () => null },
);
const PlannerSessionDialog = dynamic(
  () => import("@/features/planner/ui/PlannerSessionDialog").then((m) => ({ default: m.PlannerSessionDialog })),
  { ssr: false, loading: () => null },
);

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT"
    || target.tagName === "TEXTAREA"
    || target.tagName === "SELECT"
    || target.isContentEditable
  );
}

/** Single source of truth: Fabric canvas grid. Syncs UI store + hotkey G.
 * BUG-03 fix: skips the keydown listener registration in full-3D mode where
 * the Fabric canvas is inactive or disposed.
 */
function FabricGridBridge() {
  const { gridEnabled, toggleGrid } = useFloorplan();

  useEffect(() => {
    usePlannerUIStore.getState().setShowGrid(gridEnabled);
  }, [gridEnabled]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "g" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableKeyboardTarget(event.target)) return;
      // BUG-03: do not toggle grid when Fabric canvas is not active (3D-only mode).
      const shell = document.querySelector(".pw-shell");
      const activeViewMode = shell?.querySelector("[data-view-mode]")?.getAttribute("data-view-mode");
      if (activeViewMode === "3d") return;
      event.preventDefault();
      toggleGrid();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleGrid]);

  return null;
}

function PlannerStatusBarWithFabricGrid(
  props: Omit<ComponentProps<typeof PlannerStatusBar>, "showGrid" | "onToggleGrid">,
) {
  const { gridEnabled, toggleGrid } = useFloorplan();
  return (
    <PlannerStatusBar
      {...props}
      showGrid={gridEnabled}
      onToggleGrid={toggleGrid}
    />
  );
}

type SketchRecoveryPanelProps = {
  recovery: SketchRecoveryState;
  onTraceManual: () => void;
  onRetry: () => void;
  onAccept: () => void;
  onReject: () => void;
  onDismiss: () => void;
};

function SketchRecoveryPanel({
  recovery,
  onTraceManual,
  onRetry,
  onAccept,
  onReject,
  onDismiss,
}: SketchRecoveryPanelProps) {
  if (recovery.status === "idle") return null;

  const isPreview = recovery.status === "preview";
  const isFallback = recovery.status === "fallback";
  const isConverting = recovery.status === "converting";
  const isAccepted = recovery.status === "accepted";
  const isRejected = recovery.status === "rejected";
  const title =
    recovery.status === "preview"
      ? `Preview ready: ${recovery.fileName}`
      : recovery.status === "fallback"
        ? `Trace from reference: ${recovery.fileName}`
        : recovery.status === "converting"
          ? `Converting sketch: ${recovery.fileName}`
          : recovery.status === "accepted"
            ? `Sketch conversion accepted: ${recovery.fileName}`
            : `Sketch kept as reference: ${recovery.fileName}`;
  const body =
    recovery.status === "preview"
      ? "Review the generated geometry before it becomes the working draft."
      : recovery.status === "fallback"
        ? recovery.message
        : recovery.status === "converting"
          ? "The sketch is already underlaid so you can keep tracing while conversion runs."
          : recovery.status === "accepted"
            ? "The generated plan is now the active draft."
            : "The previous draft has been restored and the sketch stays visible as a reference.";

  return (
    <div className="fixed right-4 top-20 z-[9998] w-[min(34rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-950/95">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            Sketch recovery
          </p>
          <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
        </div>
        {isFallback || isAccepted || isRejected ? (
          <button
            type="button"
            className="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={onDismiss}
          >
            Dismiss
          </button>
        ) : null}
      </div>

      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{body}</p>

      {recovery.status === "preview" && recovery.warnings.length ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Warnings</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {recovery.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {isPreview ? (
          <>
            <button
              type="button"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              onClick={onAccept}
            >
              Accept preview
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={onReject}
            >
              Reject preview
            </button>
          </>
        ) : null}
        {isFallback || isRejected ? (
          <>
            <button
              type="button"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              onClick={onTraceManual}
            >
              Trace manually
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={onRetry}
            >
              Retry conversion
            </button>
          </>
        ) : null}
        {isAccepted ? (
          <button
            type="button"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={onDismiss}
          >
            Close
          </button>
        ) : null}
        {isConverting ? (
          <span className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Waiting for conversion...
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Fabric2DWith3DSync({
  viewMode,
}: {
  viewMode: "2d" | "3d" | "split";
}) {
  const { refitCanvas } = useFloorplan();
  const refitCanvasSoon = useCallback(() => {
    const timer = window.setTimeout(() => refitCanvas(), 80);
    return () => window.clearTimeout(timer);
  }, [refitCanvas]);

  useEffect(() => {
    if (viewMode !== "2d") return;
    return refitCanvasSoon();
  }, [refitCanvasSoon, viewMode]);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col fabric-canvas-host">
      <PlannerToolFabricSync />
      <RoomPresetsOnOpen />
      <FabricCanvasWorkspace />
    </div>
  );
}

type PlannerWorkspaceProps = {
  guestMode?: boolean;
  planId?: string;
};



function PlannerWorkspaceContent({ guestMode = false, planId }: PlannerWorkspaceProps) {
  useTheme();
  const {
    editRoom,
    endEditRoom,
    exportDraft,
    exportSvg,
    exportPngBlob,
    importDraft,
    insertObject,
    setLayerVisibility,
    resizeObject,
    fitToContent,
    clientToSceneUnits,
    setFloorPlanUnderlay,
    redoStates,
    roomEditRedoStates,
    roomEditStates,
    selections,
    states,
  } = useFloorplan();
  const [viewMode, setViewMode] = useState<"2d" | "3d" | "split">("2d");
  const [shellVisible, setShellVisible] = useState(false);
  const panels = usePlannerPanels({ enabled: shellVisible });
  const {
    applyStepLayout,
    closeAll,
    isCompact,
    leftCollapsed,
    rightCollapsed,
    leftOpen,
    leftOpenRaw,
    rightOpen,
    rightOpenRaw,
    setLeftOpen,
    setRightOpen,
    toggleLeft,
    toggleRight,
    toggleLeftCollapsed,
    toggleRightCollapsed,
  } = panels;
  const isOnline = useOnlineStatus();
  const [preferencesHydrated, setPreferencesHydrated] = useState(false);

  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSessionOpen, setIsSessionOpen] = useState(false);

  const [dragItem, setDragItem] = useState<CatalogItem | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const [isCatalogOverCanvas, setIsCatalogOverCanvas] = useState(false);
  const [dropFlash, setDropFlash] = useState<{ x: number; y: number } | null>(null);
  const canvasSurfaceRef = useRef<HTMLDivElement | null>(null);
  const chromeLayerRef = useRef<HTMLDivElement | null>(null);
  const [isCanvasDragging] = useState(false);
  const selectionOpenedRightPanelRef = useRef(false);
  const sketchUploadPayloadRef = useRef<{
    dataUrl: string;
    fileName: string;
    prompt: string;
    includeRooms: boolean;
  } | null>(null);
  const [sketchRecovery, setSketchRecovery] = useState<SketchRecoveryState>({ status: "idle" });

  const importInputRef = useRef<HTMLInputElement | null>(null);
  const floorPlanInputRef = useRef<HTMLInputElement | null>(null);
  const plannerStep = usePlannerWorkspaceStore((s) => s.plannerStep);
  const setPlannerStep = usePlannerWorkspaceStore((s) => s.setPlannerStep);
  const workspaceUnitSystem = usePlannerWorkspaceStore((s) => s.unitSystem);
  const layerVisible = usePlannerWorkspaceStore((s) => s.layerVisible);
  const [leftTab, setLeftTab] = useState<PlannerLeftTab>(getStepLeftTab(plannerStep));
  const setPlannerTool = usePlannerStore((s) => s.setTool);
  const plannerTool = usePlannerStore((s) => s.tool);
  const setActiveCatalogId = usePlannerStore((s) => s.setActiveCatalogId);
  const recordRecentPlacement = usePlannerCatalogStore((s) => s.recordRecentPlacement);
  usePlannerCatalogHydration({ enabled: shellVisible });
  const searchParams = useSearchParams();
  const didBootstrapRef = useRef(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setShellVisible(true);
      performance.mark("planner-shell-visible");
    });
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      const saved = readPlannerWorkspacePreferences();
      setViewMode(saved.viewMode);
      usePlannerCatalogStore.getState().setQuery(saved.catalogQuery);
      setPreferencesHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!preferencesHydrated) return;
    writePlannerWorkspacePreferences({ viewMode });
  }, [preferencesHydrated, viewMode]);

  useEffect(() => usePlannerCatalogStore.subscribe((state) => {
    writePlannerWorkspacePreferences({ catalogQuery: state.query });
  }), []);

  const placeCatalogIntoFabric = useCallback((
    item: CatalogItem & { left?: number; top?: number },
    scene?: { x: number; y: number },
  ) => {
    const footprint = resolveCatalogPlacementFootprintMm(item);
    const { width: widthCu, depth: depthCu } = catalogFootprintToCanvasUnits(footprint);
    const block = resolveCatalogItemBlock2D(item);
    const instanceId = `fi-${item.id}-${Date.now().toString(36)}`;
    const variant = isRoomCatalogShapeType(item.shapeType)
      ? "room"
      : isCatalogShapeType(item.shapeType, PlannerCatalogShapeType.zone)
        ? "zone"
        : "furniture";
    insertObject({
      type: "GENERIC",
      object: {
        id: instanceId,
        catalogItemId: item.id,
        left: scene?.x ?? item.left,
        top: scene?.y ?? item.top,
        name: item.shortName || item.name || "Catalog Item",
        title: item.shortName || item.name || "Catalog Item",
        variant,
        width: widthCu,
        height: depthCu,
        svg: block ? blockToSvg(block) : undefined,
      },
    });
  }, [insertObject]);

  const fabricRevisionKey = useMemo(
    () => `${states.length}:${redoStates.length}:${roomEditStates.length}:${roomEditRedoStates.length}`,
    [redoStates.length, roomEditRedoStates.length, roomEditStates.length, states.length],
  );
  const fabricSerializedDraft = useMemo(() => {
    void fabricRevisionKey;
    return exportDraft();
  }, [exportDraft, fabricRevisionKey]);
  const exportFabricDraft = useCallback(() => fabricSerializedDraft, [fabricSerializedDraft]);
  const {
    status: saveStatus,
    envelopeStatus: saveEnvelopeStatus,
    lastSavedAt,
    restoreSnapshot,
    retrySave,
  } = usePlannerFabricAutosave(exportFabricDraft, guestMode, planId, fabricRevisionKey, {
    enabled: shellVisible,
  });

  const measurementUnit = useMemo<MeasurementUnit>(
    () => plannerUnitSystemToMeasurementUnit(workspaceUnitSystem),
    [workspaceUnitSystem],
  );
  const planMetrics = useFabricPlanMetrics();
  const plannerStepGates = useMemo(
    () => evaluatePlannerStepGates(null, planMetrics),
    [planMetrics],
  );
  const disabledSteps = useMemo(
    () => getDisabledPlannerSteps(plannerStepGates),
    [plannerStepGates],
  );
  const selectionStatus = useFabricSelectionStatus();

  useEffect(() => {
    setPlannerFabricRuntime({
      exportDraft,
      importDraft,
      exportSvg,
      exportPngBlob,
      placeCatalogItem: placeCatalogIntoFabric,
      insertObject,
      setLayerVisibility,
      resizeObject,
      editRoom,
      endEditRoom,
      fitToContent,
      clientToSceneUnits,
      setFloorPlanUnderlay,
    });
    // BUG-05: use generation-scoped cleanup so strict-mode double-mount does
    // not let the first mount's cleanup wipe the second mount's runtime.
    return createPlannerFabricRuntimeCleanup();
  }, [
    editRoom,
    endEditRoom,
    exportDraft,
    exportPngBlob,
    exportSvg,
    importDraft,
    insertObject,
    placeCatalogIntoFabric,
    setLayerVisibility,
    resizeObject,
    fitToContent,
    clientToSceneUnits,
    setFloorPlanUnderlay,
  ]);

  useEffect(() => {
    setPlannerFabricRuntimeState({
      serializedDraft: fabricSerializedDraft,
      selections,
      layerVisible,
    });
    applyLayerVisibility(null, layerVisible);
  }, [fabricSerializedDraft, layerVisible, selections]);

  const shapeCount = useMemo(() => {
    if (!fabricSerializedDraft) return 0;
    try {
      const state = JSON.parse(fabricSerializedDraft) as { objects?: unknown[] };
      return state.objects?.length ?? 0;
    } catch {
      return 0;
    }
  }, [fabricSerializedDraft]);

  // Use refs so buildCurrentPlannerDocument can read activeDocumentId and planName without
  // forward-reference TDZ errors (as they live inside or are derived from the session handlers,
  // which themselves need to trigger/evaluate document building).
  const activeDocumentIdRef = useRef<string | null>(planId ?? null);
  const planNameRef = useRef<string>("Workspace Plan");

  const buildCurrentPlannerDocument = useCallback(() => {
    return buildPlannerDocumentFromEditor(null, {
      id: activeDocumentIdRef.current ?? undefined,
      title: sanitizePlannerPlanName(planNameRef.current),
    });
  }, []);

  // ── Session handlers (extracted to usePlannerSessionHandlers.ts) ──────────
  const session = usePlannerSessionHandlers({
    getCurrentPlannerDocument: buildCurrentPlannerDocument,
    importDraft,
    planId,
    guestMode,
    shapeCount,
    saveStatus,
    fitToContent,
    bootstrapEnabled: shellVisible,
  });

  const {
    planNameOverride,
    setPlanNameOverride,
    activeDocumentId,
    sessionStatusMessage,
    setSessionStatusMessage,
    sessionErrorMessage,
    setSessionErrorMessage,
    sessionBusy,
    draftPlanName,
    draftNameKey,
    authUserId,
    isAdmin,
    plannerManagedProducts,
    handleUpsertManagedProduct,
    handleDeleteManagedProduct,
    handleStartFreshLayout,
    handleSaveCloud: sessionHandleSaveCloud,
    handleSaveDraft: sessionHandleSaveDraft,
    handleSaveAsNewSession: sessionHandleSaveAsNewSession,
    handleLoadPlan,
    handleDeletePlan,
    handleRenamePlan,
    handleImportFileChange,
    handleExportJson: sessionHandleExportJson,
    buildSavedEntries,
  } = session;

  const [planNameKey, setPlanNameKey] = useState(draftNameKey);
  useEffect(() => {
    if (planNameKey === draftNameKey) return;
    setPlanNameKey(draftNameKey);
    setPlanNameOverride(null);
  }, [draftNameKey, planNameKey, setPlanNameOverride]);

  const planName = planNameOverride ?? draftPlanName;

  // Keep refs in sync so buildCurrentPlannerDocument always sees the latest values.
  useEffect(() => {
    activeDocumentIdRef.current = activeDocumentId;
    planNameRef.current = planName;
  }, [activeDocumentId, planName]);

  const currentPlannerDocument = useMemo(() => {
    return buildPlannerDocumentFromEditor(null, {
      id: activeDocumentId ?? undefined,
      title: sanitizePlannerPlanName(planName),
    });
  }, [activeDocumentId, planName]);

  // Wrap session handlers to pass planName (resolved here)
  const handleSaveDraft = useCallback(() => sessionHandleSaveDraft(planName), [sessionHandleSaveDraft, planName]);
  const handleSaveCloud = useCallback(() => sessionHandleSaveCloud(planName), [sessionHandleSaveCloud, planName]);
  const handleSaveAsNewSession = useCallback(() => sessionHandleSaveAsNewSession(planName), [sessionHandleSaveAsNewSession, planName]);
  const handleExportJson = useCallback(() => sessionHandleExportJson(buildCurrentPlannerDocument, planName), [sessionHandleExportJson, buildCurrentPlannerDocument, planName]);

  const plannerSavedEntries = useMemo(
    () => buildSavedEntries(activeDocumentId),
    [buildSavedEntries, activeDocumentId],
  );

  const applyToolBinding = useCallback((binding: PlannerToolBinding) => {
    if (binding.plannerTool === "furniture" && !usePlannerStore.getState().activeCatalogId) {
      const defaultCatalogId = getDefaultPlacementCatalogItemId();
      if (defaultCatalogId) {
        setActiveCatalogId(defaultCatalogId);
        recordRecentPlacement(defaultCatalogId);
      }
      setLeftTab("library");
      if (!leftOpen) {
        setLeftOpen(true);
      }
    }

    setPlannerTool(binding.plannerTool);
  }, [leftOpen, recordRecentPlacement, setActiveCatalogId, setLeftOpen, setPlannerTool]);

  const syncPlannerStep = useCallback((step: PlannerStep) => {
    setPlannerStep(step);
    setLeftTab(getStepLeftTab(step));
    applyToolBinding(getStepToolBinding(step));
    applyStepLayout(step);
  }, [applyStepLayout, applyToolBinding, setPlannerStep]);

  const handlePlannerStepChange = useCallback((step: PlannerStep) => {
    syncPlannerStep(step);
  }, [syncPlannerStep]);

  useEffect(() => {
    applyStepLayout(plannerStep);
  }, [applyStepLayout, plannerStep]);

  const handleCatalogItemClick = useCallback((item: CatalogItem) => {
    if (isFurniturePlacementCatalogItem(item)) {
      placeCatalogIntoFabric(item);
      recordRecentPlacement(item.id);
      return;
    }

    if (isRoomCatalogShapeType(item.shapeType)) {
      applyToolBinding({ toolId: "planner-room", plannerTool: "room" });
    } else if (isCatalogShapeType(item.shapeType, PlannerCatalogShapeType.zone)) {
      applyToolBinding({ toolId: "planner-zone", plannerTool: "zone" });
    }
  }, [applyToolBinding, placeCatalogIntoFabric, recordRecentPlacement]);

  useEffect(() => {
    if (isCompact) {
      selectionOpenedRightPanelRef.current = false;
      return;
    }

    const hasSelection = Boolean(selectionStatus);
    if (hasSelection && !rightOpen) {
      setRightOpen(true);
      selectionOpenedRightPanelRef.current = true;
      return;
    }

    if (!hasSelection && selectionOpenedRightPanelRef.current) {
      setRightOpen(false);
      selectionOpenedRightPanelRef.current = false;
    }
  }, [isCompact, rightOpen, selectionStatus, setRightOpen]);

  const handleApplyTemplate = useCallback((template: LayoutTemplate) => {
    // P4-09: confirm before replacing an existing non-empty canvas.
    if (shapeCount > 0) {
      const confirmed = window.confirm(
        `Applying "${template.name}" will replace your current ${shapeCount} object${shapeCount !== 1 ? "s" : ""}. Continue?`,
      );
      if (!confirmed) return;
    }

    const roomWidthCm = template.recommendedRoomSize.minWidth;
    const roomHeightCm = template.recommendedRoomSize.minHeight;
    insertObject({
      type: "ROOM",
      object: {
        title: template.name,
        width: roomWidthCm,
        height: roomHeightCm,
      },
    });

    for (const shape of buildTemplateCanvasPlacements(template)) {
      placeCatalogIntoFabric({
        id: shape.id,
        name: shape.label,
        shortName: shape.label,
        category: "equipment",
        shapeType: shape.type,
        widthMm: shape.width,
        heightMm: shape.height,
        depthMm: shape.height,
        description: `${template.name} — ${shape.label}`,
        tags: [],
        left: shape.left,
        top: shape.top,
      });
    }

    setIsTemplateOpen(false);
    setSessionStatusMessage(`Applied template: ${template.name}`);
  }, [insertObject, placeCatalogIntoFabric, shapeCount, setSessionStatusMessage]);

  useEffect(() => {
    if (didBootstrapRef.current) return;
    didBootstrapRef.current = true;
    let cancelled = false;

    const initialBinding = getStepToolBinding(usePlannerWorkspaceStore.getState().plannerStep);
    setPlannerTool(initialBinding.plannerTool);

    void (async () => {
      if (cancelled) return;
      if (searchParams?.get("fresh") === "1") {
        await handleStartFreshLayout();
        return;
      }
      if (cancelled) return;
      await restoreSnapshot(importDraft);
    })();
    return () => {
      cancelled = true;
    };
    // One-shot bootstrap on mount — do not re-run when handlers change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearCatalogDrag = useCallback(() => {
    setDragItem(null);
    setGhostPos(null);
    setIsCatalogOverCanvas(false);
  }, []);

  const handleCatalogDragStart = useCallback((item: CatalogItem) => {
    setDragItem(item);
    setIsCatalogOverCanvas(false);
  }, []);

  const handleCatalogDragEnd = useCallback(() => {
    clearCatalogDrag();
  }, [clearCatalogDrag]);

  useEffect(() => {
    if (!dragItem) return;

    const onDragOver = (event: globalThis.DragEvent) => {
      if (!event.dataTransfer || !acceptsCatalogDrag(event.dataTransfer)) return;
      event.preventDefault();
      setGhostPos({ x: event.clientX, y: event.clientY });
      const overCanvas = canvasSurfaceRef.current?.contains(event.target as Node) ?? false;
      setIsCatalogOverCanvas(overCanvas);
      event.dataTransfer.dropEffect = overCanvas ? "copy" : "none";
    };

    const onDragEnd = () => {
      clearCatalogDrag();
    };

    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragend", onDragEnd);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragend", onDragEnd);
    };
  }, [clearCatalogDrag, dragItem]);

  useEffect(() => {
    if (!dropFlash) return;
    const timer = window.setTimeout(() => setDropFlash(null), 520);
    return () => window.clearTimeout(timer);
  }, [dropFlash]);

  const handleCanvasDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    if (!acceptsCatalogDrag(e.dataTransfer)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setGhostPos({ x: e.clientX, y: e.clientY });
    setIsCatalogOverCanvas(true);
  }, []);

  const handleCanvasDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const raw = readCatalogDragPayload(e.dataTransfer);
    if (!raw) {
      clearCatalogDrag();
      return;
    }
    try {
      const item = JSON.parse(raw) as CatalogItem;
      const scene = getPlannerFabricRuntime()?.clientToSceneUnits(e.clientX, e.clientY) ?? undefined;
      placeCatalogIntoFabric(item, scene ?? undefined);
      recordRecentPlacement(item.id);
      setDropFlash({ x: e.clientX, y: e.clientY });
    } catch {
      // Invalid drag payload — ignore.
    } finally {
      clearCatalogDrag();
    }
  }, [clearCatalogDrag, placeCatalogIntoFabric, recordRecentPlacement]);

  const ghostFootprint = useMemo(() => {
    if (!dragItem) return null;
    return { w: 48, h: 32 };
  }, [dragItem]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const binding = resolvePlannerToolKey(e);
      if (binding) {
        e.preventDefault();
        applyToolBinding(binding);
        return;
      }

      if (e.key === "Escape") {
        if (isTemplateOpen) setIsTemplateOpen(false);
      }
      if (e.ctrlKey && e.key === "Tab") {
        e.preventDefault();
        setViewMode((prev) => (prev === "2d" ? "3d" : "2d"));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [applyToolBinding, isTemplateOpen]);

  const plannerLeftPanel = useMemo(
    () => (
      <PlannerLeftPanel
        guestMode={guestMode}
        plannerStep={plannerStep}
        panelOpen={leftOpen}
        panelCollapsed={!isCompact && leftCollapsed}
        showPanelToggle={leftOpen}
        onTogglePanel={toggleLeft}
        activeTab={leftTab}
        onTabChange={setLeftTab}
        onItemClick={handleCatalogItemClick}
        onDragStart={handleCatalogDragStart}
        onDragEnd={handleCatalogDragEnd}
        unitSystem={measurementUnit}
      />
    ),
    [
      guestMode,
      plannerStep,
      leftOpen,
      leftCollapsed,
      isCompact,
      leftTab,
      measurementUnit,
      handleCatalogItemClick,
      handleCatalogDragStart,
      handleCatalogDragEnd,
      toggleLeft,
    ],
  );

  const canvas2D = useMemo(
    () => (
      <Fabric2DWith3DSync
        viewMode={viewMode}
      />
    ),
    [viewMode],
  );

  const canvas3D = (
    <Suspense fallback={<PlannerSkeleton />}>
      <div className="pw-viewer-host h-full min-h-0 w-full">
        <PlannerErrorBoundary label="3D Viewer">
          <Planner3DViewer document={currentPlannerDocument} />
        </PlannerErrorBoundary>
      </div>
    </Suspense>
  );

  const handleOpenAiAssist = useCallback(() => {
    setLeftTab("ai-assist");
    setLeftOpen(true);
    if (isCompact) {
      setRightOpen(false);
    }
  }, [isCompact, setLeftOpen, setRightOpen]);

  const handleResetChromeLayout = useCallback(() => {
    resetPlannerChromeLayout();
    setSessionStatusMessage("Planner chrome layout reset.");
  }, [setSessionStatusMessage]);

  const handleOpen3dSession = useCallback(() => {
    setViewMode("3d");
    setSessionStatusMessage("Switched to 3D view.");
  }, [setSessionStatusMessage]);

  const handleImportRequest = useCallback(() => {
    importInputRef.current?.click();
  }, []);

  const handleFloorPlanUploadRequest = useCallback(() => {
    floorPlanInputRef.current?.click();
  }, []);

  const applySketchUnderlay = useCallback(
    async (payload: {
      dataUrl: string;
      fileName: string;
      prompt: string;
      includeRooms: boolean;
    }) => {
      await setFloorPlanUnderlay(payload.dataUrl, { fileName: payload.fileName });
    },
    [setFloorPlanUnderlay],
  );

  const setSketchRecoveryFallback = useCallback(
    (fileName: string, reason: SketchRecoveryReason) => {
      const message = getSketchRecoveryMessage(reason);
      setSketchRecovery({ status: "fallback", fileName, reason, message });
      setSessionStatusMessage(message);
      setSessionErrorMessage(message);
    },
    [setSessionErrorMessage, setSessionStatusMessage],
  );

  const startSketchConversion = useCallback(
    async (payload: {
      dataUrl: string;
      fileName: string;
      prompt: string;
      includeRooms: boolean;
    }) => {
      const previousDraftJson = exportDraft() ?? JSON.stringify({ objects: [] });
      sketchUploadPayloadRef.current = payload;
      setSketchRecovery({ status: "converting", fileName: payload.fileName });
      setSessionErrorMessage(null);
      setSessionStatusMessage("Converting sketch into an editable plan...");

      try {
        await applySketchUnderlay(payload);
      } catch (err) {
        const reason =
          err instanceof Error && /decode|unsupported|mime|image/i.test(err.message)
            ? "unsupported_input"
            : "server_error";
        setSketchRecoveryFallback(payload.fileName, reason);
        return;
      }

      try {
        const response = await fetch("/api/planner/sketch-to-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageDataUrl: payload.dataUrl,
            fileName: payload.fileName,
            prompt: payload.prompt,
            includeRooms: payload.includeRooms,
          }),
        });
        const rawBody = await response.json().catch(() => null);

        if (response.ok) {
          const parsed = SketchToPlanRouteResponseSchema.safeParse(rawBody);
          if (!parsed.success) {
            setSketchRecoveryFallback(payload.fileName, "invalid_response");
            return;
          }
          if (parsed.data.status === "fallback") {
            setSketchRecovery({
              status: "fallback",
              fileName: parsed.data.fileName,
              reason: parsed.data.reason,
              message: parsed.data.message,
            });
            setSessionStatusMessage(parsed.data.message);
            setSessionErrorMessage(parsed.data.message);
            return;
          }

          const generatedDraftJson = buildSketchPlanFabricDraft({
            objects: parsed.data.objects as Parameters<typeof buildSketchPlanFabricDraft>[0]["objects"],
            warnings: Array.isArray(parsed.data.warnings)
              ? parsed.data.warnings.filter((warning): warning is string => typeof warning === "string")
              : [],
          });
          try {
            await applySketchUnderlay(payload);
          } catch (previewUnderlayErr) {
            const reason =
              previewUnderlayErr instanceof Error && /decode|unsupported|mime|image/i.test(previewUnderlayErr.message)
                ? "unsupported_input"
                : "server_error";
            setSketchRecoveryFallback(payload.fileName, reason);
            return;
          }
          setSketchRecovery({
            status: "preview",
            fileName: parsed.data.fileName,
            generatedDraftJson,
            previousDraftJson,
            warnings: parsed.data.warnings,
          });
          setSessionErrorMessage(null);
          setSessionStatusMessage(`Preview ready: ${parsed.data.fileName}`);
          return;
        }

        const parsedError = SketchToPlanRouteErrorSchema.safeParse(rawBody);
        if (parsedError.success) {
          const reason = parsedError.data.error.details?.reason ?? "server_error";
          if (reason === "server_error") {
            setSketchRecoveryFallback(payload.fileName, reason);
            return;
          }
          setSketchRecovery({
            status: "fallback",
            fileName: parsedError.data.error.details?.fileName ?? payload.fileName,
            reason,
            message: getSketchRecoveryMessage(reason),
          });
          setSessionStatusMessage(getSketchRecoveryMessage(reason));
          setSessionErrorMessage(getSketchRecoveryMessage(reason));
          return;
        }

        const reason = response.status >= 500 ? "server_error" : "invalid_response";
        setSketchRecoveryFallback(payload.fileName, reason);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not convert the sketch image.";
        const reason =
          /timeout|timed out|aborted/i.test(message) ? "timeout" :
          /decode|unsupported|mime|image/i.test(message) ? "unsupported_input" :
          "server_error";
        setSketchRecovery({
          status: "fallback",
          fileName: payload.fileName,
          reason,
          message: getSketchRecoveryMessage(reason),
        });
        setSessionStatusMessage(getSketchRecoveryMessage(reason));
        setSessionErrorMessage(getSketchRecoveryMessage(reason));
      }
    },
    [
      applySketchUnderlay,
      exportDraft,
      importDraft,
      setSessionErrorMessage,
      setSessionStatusMessage,
      setSketchRecoveryFallback,
    ],
  );

  const handleSketchRetry = useCallback(() => {
    const payload = sketchUploadPayloadRef.current;
    if (!payload) return;
    void startSketchConversion(payload);
  }, [startSketchConversion]);

  const handleSketchAccept = useCallback(async () => {
    if (sketchRecovery.status !== "preview") return;
    const gen = "generatedDraftJson" in sketchRecovery ? sketchRecovery.generatedDraftJson : null;
    const fn = "fileName" in sketchRecovery ? sketchRecovery.fileName : "unknown";
    const payload = sketchUploadPayloadRef.current;
    if (!gen) return;
    try {
      await importDraft(gen);
      if (payload) {
        await applySketchUnderlay(payload);
      }
    } catch (acceptErr) {
      const reason =
        acceptErr instanceof Error && /decode|unsupported|mime|image/i.test(acceptErr.message)
          ? "unsupported_input"
          : "server_error";
      setSketchRecoveryFallback(fn, reason);
      return;
    }
    sketchUploadPayloadRef.current = null;
    setSketchRecovery({ status: "accepted", fileName: fn });
    setSessionErrorMessage(null);
    setSessionStatusMessage(`Sketch conversion accepted: ${fn}`);
  }, [sketchRecovery, importDraft, applySketchUnderlay, setSessionErrorMessage, setSessionStatusMessage]);

  const handleSketchReject = useCallback(async () => {
    if (sketchRecovery.status !== "preview") return;
    const payload = sketchUploadPayloadRef.current;
    try {
      await importDraft(sketchRecovery.previousDraftJson);
      if (payload) {
        await applySketchUnderlay(payload);
      }
    } catch (underlayErr) {
      const reason =
        underlayErr instanceof Error && /decode|unsupported|mime|image/i.test(underlayErr.message)
          ? "unsupported_input"
          : "server_error";
      setSketchRecoveryFallback(sketchRecovery.fileName, reason);
      return;
    }
    setSketchRecovery({ status: "rejected", fileName: sketchRecovery.fileName });
    setSessionErrorMessage(null);
    setSessionStatusMessage(`Sketch kept as reference: ${sketchRecovery.fileName}`);
  }, [
    applySketchUnderlay,
    importDraft,
    sketchRecovery,
    setSessionErrorMessage,
    setSessionStatusMessage,
    setSketchRecoveryFallback,
  ]);

  const handleSketchTraceManual = useCallback(() => {
    applyToolBinding({ toolId: "planner-wall", plannerTool: "wall" });
    setSessionErrorMessage(null);
    if (sketchRecovery.status === "fallback") {
      setSessionStatusMessage(`Trace manually from the sketch reference: ${sketchRecovery.fileName}`);
    } else if (sketchRecovery.status === "rejected") {
      setSessionStatusMessage(`Continue tracing the sketch reference: ${sketchRecovery.fileName}`);
    }
  }, [applyToolBinding, sketchRecovery.fileName, sketchRecovery.status, setSessionErrorMessage, setSessionStatusMessage]);

  const handleSketchDismiss = useCallback(() => {
    setSketchRecovery({ status: "idle" });
    setSessionErrorMessage(null);
    setSessionStatusMessage(null);
  }, [setSessionErrorMessage, setSessionStatusMessage]);

  const handleFloorPlanFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.currentTarget.value = "";
      if (!file) return;
      try {
        const payload = await readFloorPlanImageFile(file);
        await startSketchConversion({
          dataUrl: payload.dataUrl,
          fileName: payload.fileName,
          prompt: "Convert this sketch into an editable floor plan with walls and rooms.",
          includeRooms: true,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not convert the sketch image.";
        setSketchRecovery({
          status: "fallback",
          fileName: file.name,
          reason: "unsupported_input",
          message: getSketchRecoveryMessage("unsupported_input"),
        });
        setSessionStatusMessage(message);
        setSessionErrorMessage(getSketchRecoveryMessage("unsupported_input"));
      }
    },
    [setSessionErrorMessage, setSessionStatusMessage, startSketchConversion],
  );

  const topBar = (
    <PlannerTopBar
      guestMode={guestMode}
      planName={planName}
      plannerStep={plannerStep}
      disabledSteps={disabledSteps}
      onPlannerStepChange={handlePlannerStepChange}
      saveStatus={saveStatus}
      saveEnvelopeStatus={saveEnvelopeStatus}
      lastSavedAt={lastSavedAt}
      onRetrySave={retrySave}
      onOpenSession={() => setIsSessionOpen(true)}
      onSaveDraft={handleSaveDraft}
      onImport={handleImportRequest}
      onUploadFloorPlan={handleFloorPlanUploadRequest}
      onOpenTemplates={() => setIsTemplateOpen(true)}
      onOpenAi={handleOpenAiAssist}
      isOnline={isOnline}
    />
  );

  const subTopBar = (
    <PlannerSubTopBar
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      leftCollapsed={leftCollapsed}
      rightCollapsed={rightCollapsed}
      onToggleLeftCollapsed={toggleLeftCollapsed}
      onToggleRightCollapsed={toggleRightCollapsed}
      onResetLayout={handleResetChromeLayout}
      onOpenExport={() => setIsExportOpen(true)}
    />
  );

  const handleQuickLayout = useCallback(() => {
    queueQuickStarterLayout();
  }, []);

  const toolVisibilityMode = useMemo(() => readPlannerToolVisibilityMode(), []);
  const activeToolId = useMemo(() => plannerToolToToolId(plannerTool), [plannerTool]);

  const toolRail = isCompact ? null : (
    <PlannerToolRail
      activeTool={activeToolId}
      activePlannerTool={plannerTool}
      step={plannerStep}
      visibilityMode={toolVisibilityMode}
      onSelect={(toolId, storeTool) => applyToolBinding({ toolId, plannerTool: storeTool })}
    />
  );

  const rightPanel = (
    <aside
      className="pw-right-panel"
      data-open={rightOpen}
      data-collapsed={!isCompact && rightCollapsed ? true : undefined}
      data-step={plannerStep}
      data-selection={selectionStatus ? "active" : undefined}
    >
      <div className="pw-panel-tabs" aria-label="Right panel">
        <p className="pw-panel-tab pwx-panel-tab" data-active>
          Properties
        </p>
        <button
          type="button"
          className="pw-panel-collapse pw-icon-btn"
          onClick={toggleRightCollapsed}
          aria-label="Close right panel"
        >
          <PanelRightClose size={14} strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className="pw-panel-body" hidden={rightCollapsed}>
        <PropertiesInspector step={plannerStep} />
        {plannerStep === "review" ? <LayerVisibilityPanel /> : null}
        {plannerStep === "review" ? <LayerManagerPanel unitSystem={workspaceUnitSystem} /> : null}
      </div>
    </aside>
  );

  const canvasStage = (
    <PlannerCanvasStage
      viewMode={viewMode}
      chromeLayerRef={chromeLayerRef}
      canvasSurfaceRef={canvasSurfaceRef}
      dragItem={dragItem}
      isCatalogOverCanvas={isCatalogOverCanvas}
      handleCanvasDragOver={handleCanvasDragOver}
      handleCanvasDrop={handleCanvasDrop}
      canvas2D={canvas2D}
      canvas3D={canvas3D}
      shapeCount={shapeCount}
      guestMode={guestMode}
      applyToolBinding={applyToolBinding}
      setIsTemplateOpen={setIsTemplateOpen}
      onQuickLayout={handleQuickLayout}
      onUploadFloorPlan={handleFloorPlanUploadRequest}
      toolRail={toolRail}
      plannerChromeHost={<PlannerChromeHost />}
      statusBar={
        <PlannerStatusBarWithFabricGrid
          metrics={planMetrics}
          selectionStatus={selectionStatus}
          unitSystem={workspaceUnitSystem}
          snapStatusLabel="Pending"
        />
      }
    />
  );

  return (
    <>
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => handleImportFileChange(e, planName)}
      />
      <input
        ref={floorPlanInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFloorPlanFileChange}
      />
      <PlannerWorkspaceLayout
        topBar={topBar}
        subTopBar={subTopBar}
        leftPanel={plannerLeftPanel}
        rightPanel={rightPanel}
        canvasArea={canvasStage}
        isCompact={isCompact}
        plannerStep={plannerStep}
        leftOpenRaw={leftOpenRaw}
        rightOpenRaw={rightOpenRaw}
        leftCollapsed={leftCollapsed}
        rightCollapsed={rightCollapsed}
        isCanvasDragging={isCanvasDragging}
        closeAll={closeAll}
        toggleLeft={toggleLeft}
        toggleRight={toggleRight}
        isOnline={isOnline}
        templateModal={
          <TemplatePickerModal
            isOpen={isTemplateOpen}
            onClose={() => setIsTemplateOpen(false)}
            onApply={handleApplyTemplate}
          />
        }
        sessionDialog={
          <PlannerSessionDialog
            open={isSessionOpen}
            onOpenChange={setIsSessionOpen}
            planName={planName}
            onPlanNameChange={setPlanNameOverride}
            plans={plannerSavedEntries}
            isAuthenticated={!!authUserId}
            isBusy={sessionBusy}
            statusMessage={sessionStatusMessage}
            errorMessage={sessionErrorMessage}
            canOpen3d={shapeCount > 0}
            isAdmin={isAdmin}
            managedProducts={plannerManagedProducts}
            onSaveCloud={handleSaveCloud}
            onSaveDraft={handleSaveDraft}
            onSaveAsNewSession={handleSaveAsNewSession}
            onLoadPlan={handleLoadPlan}
            onDeletePlan={handleDeletePlan}
            onRenamePlan={handleRenamePlan}
            onImport={handleImportRequest}
            onExportJson={handleExportJson}
            onOpen3d={handleOpen3dSession}
            onUpsertManagedProduct={handleUpsertManagedProduct}
            onDeleteManagedProduct={handleDeleteManagedProduct}
            onStartFreshLayout={handleStartFreshLayout}
            onDismissError={() => setSessionErrorMessage(null)}
            isOnline={isOnline}
          />
        }
        dragOverlay={
          <>
            <SketchRecoveryPanel
              recovery={sketchRecovery}
              onTraceManual={handleSketchTraceManual}
              onRetry={handleSketchRetry}
              onAccept={handleSketchAccept}
              onReject={() => void handleSketchReject()}
              onDismiss={handleSketchDismiss}
            />
            {dragItem && ghostPos && ghostFootprint ? (
              <CatalogDropGhost
                item={dragItem}
                x={ghostPos.x}
                y={ghostPos.y}
                width={ghostFootprint.w}
                height={ghostFootprint.h}
                valid={isCatalogOverCanvas}
              />
            ) : null}
            {dropFlash ? <CatalogDropFlash x={dropFlash.x} y={dropFlash.y} /> : null}
          </>
        }
        exportModal={
          isExportOpen ? (
            <ExportModal
              isOpen={isExportOpen}
              onClose={() => setIsExportOpen(false)}
            />
          ) : null
        }
      />
    </>
  );
}

export function PlannerWorkspace(props: PlannerWorkspaceProps) {
  return (
    <FloorplanProvider>
      <FabricGridBridge />
      <PlannerToolFabricSync />
      <PlannerWorkspaceContent {...props} />
    </FloorplanProvider>
  );
}
