/**
 * PlannerWorkspace — unified workspace planner editor shell.
 *
 * Tldraw canvas + catalog + inspector + 3D preview + AI advisor.
 */

"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { X } from "lucide-react";
import type { Editor } from "tldraw";
import { usePlannerStore } from "@/features/planner/store/plannerStore";
import { Planner3DViewer } from "@/features/planner/3d";
import { SharedTldrawEngine } from "@/features/planner/shared/engine/SharedTldrawEngine";
import { PLANNER_TLDRAW_SHAPE_UTILS, PLANNER_TLDRAW_TOOLS } from "@/features/planner/tldraw/plannerTldrawRegistration";
import { SplitViewLayout } from "@/features/planner/shared/components/SplitViewLayout";
import type { PlannerViewerShape } from "@/features/planner/viewer/PlannerViewer";
import { PlannerSkeleton } from "@/features/planner/ui/PlannerSkeleton";
import { PropertiesInspector } from "@/features/planner/editor/inspector/PropertiesInspector";

import { TemplatePickerModal } from "@/features/planner/editor/templates/TemplatePickerModal";
import { PlannerLeftPanel } from "@/features/planner/editor/PlannerLeftPanel";
import { PlannerMobileDock } from "@/features/planner/editor/PlannerMobileDock";
import { PlannerTopBar } from "@/features/planner/editor/PlannerTopBar";
import { PlannerToolRail, type PlannerToolId } from "@/features/planner/editor/PlannerToolRail";
import { usePlannerPanels } from "@/features/planner/editor/usePlannerPanels";
import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import { type LayoutTemplate } from "@/features/planner/templates/layoutTemplates";
import { CatalogDropGhost } from "@/features/planner/catalog/CatalogDropGhost";
import { BlueprintPanel } from "@/features/planner/editor/BlueprintPanel";
import { PlannerEmptyCanvas } from "@/features/planner/ui/PlannerEmptyCanvas";
import { useTheme } from "@/features/planner/components/WorkspaceThemeProvider";
import { usePlannerAutosave } from "@/features/planner/hooks/usePlannerAutosave";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";
import { BlueprintUnderlay } from "@/features/planner/editor/BlueprintUnderlay";
import { CalibrationCapture } from "@/features/planner/editor/CalibrationCapture";
import { BlueprintMoveCapture } from "@/features/planner/editor/BlueprintMoveCapture";
import { BlueprintTraceGuideOverlay } from "@/features/planner/editor/BlueprintTraceGuideOverlay";
import { LayerVisibilityPanel } from "@/features/planner/editor/LayerVisibilityPanel";
import { LayerManagerPanel } from "@/features/planner/editor/LayerManagerPanel";
import { applyLayerVisibility } from "@/features/planner/editor/layerVisibility";
import { CanvasMeasurementOverlay } from "@/features/planner/editor/CanvasMeasurementOverlay";
import {
  configurePlannerCamera,
  fitPlannerContent,
  setDefaultPlannerCamera,
} from "@/features/planner/editor/plannerCamera";
import { getPageMetrics, type PlanMetrics } from "@/features/planner/editor/planMetrics";
import { getEditorSelectionStatus } from "@/features/planner/editor/editorSelectionStatus";
import { PlannerStepBar } from "@/features/planner/editor/PlannerStepBar";
import { PlannerStatusBar } from "@/features/planner/editor/PlannerStatusBar";
import { PlannerWorkflowPanel } from "@/features/planner/editor/PlannerWorkflowPanel";
import { SnapIndicatorOverlay } from "@/features/planner/editor/SnapIndicatorOverlay";
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
import { ExportModal } from "@/features/planner/editor/ExportModal";
import {
  applyShapes,
  buildCatalogShape,
  buildTemplateShapes,
  toPlannerViewerShapes,
} from "@/features/planner/editor/plannerShapeFactories";
import { applyRoomPreset } from "@/features/planner/lib/applyRoomPreset";
import {
  acceptsCatalogDrag,
  readCatalogDragPayload,
} from "@/features/planner/catalog/shapeTypeRegistry";
import type { RoomPreset } from "@/features/planner/catalog/roomPresets";
import {
  plannerUnitSystemToMeasurementUnit,
  type MeasurementUnit,
} from "@/features/planner/lib/measurements";
import {
  resolvePlannerToolKey,
  type PlannerToolBinding,
} from "@/features/planner/editor/plannerKeyboardShortcuts";
import { PlannerSessionDialog, type PlannerSavedEntry } from "@/features/planner/ui/PlannerSessionDialog";
import { buildPlannerDocumentFromEditor, loadPlannerDocumentIntoEditor } from "@/features/planner/lib/documentBridge";
import {
  LOCAL_CURRENT_DRAFT_ID,
  createPlannerExportPayload,
  formatPlannerSavedPlanTimestamp,
  sanitizePlannerPlanName,
} from "@/features/planner/lib/sessionState";
import {
  deletePlannerDraftDocument,
  listPlannerDraftDocuments,
  loadPlannerDraftDocument,
  savePlannerDraftDocument,
  type PlannerDraftScope,
} from "@/features/planner/persistence/plannerDraft";
import { parsePlannerDocumentImportFile } from "@/features/planner/persistence/plannerImport";
import { hydrateCloudPlanIntoIndexedDb } from "@/features/planner/persistence/cloudPlanHydration";
import { normalizePlannerDocument } from "@/features/planner/model";

type PlannerWorkspaceProps = {
  guestMode?: boolean;
  planId?: string;
};

export function PlannerWorkspace({ guestMode = false, planId }: PlannerWorkspaceProps) {
  const { resolvedTheme } = useTheme();
  const panels = usePlannerPanels();
  const [viewMode, setViewMode] = useState<"2d" | "3d" | "split">("2d");

  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [, setViewerShapes] = useState<PlannerViewerShape[]>([]);
  const [activeTool, setActiveTool] = useState<PlannerToolId>("select");
  const [activePlannerTool, setActivePlannerTool] = useState<
    "select" | "pan" | "wall" | "room" | "door" | "window" | "furniture" | "zone" | "measure"
  >("select");
  const [shapeCount, setShapeCount] = useState(0);
  const [dragItem, setDragItem] = useState<CatalogItem | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const [planMetrics, setPlanMetrics] = useState<PlanMetrics>(getPageMetrics(null));
  const [selectionStatus, setSelectionStatus] = useState<string | null>(null);
  const [camera, setCamera] = useState<{ x: number; y: number; z: number } | null>(null);
  const [planNameOverride, setPlanNameOverride] = useState<string | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(planId ?? null);
  const [sessionStatusMessage, setSessionStatusMessage] = useState<string | null>(null);
  const [sessionErrorMessage, setSessionErrorMessage] = useState<string | null>(null);
  const [localDraftVersion, setLocalDraftVersion] = useState(0);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const blueprint = usePlannerWorkspaceStore((s) => s.blueprint);
  const layerVisible = usePlannerWorkspaceStore((s) => s.layerVisible);
  const plannerStep = usePlannerWorkspaceStore((s) => s.plannerStep);
  const setPlannerStep = usePlannerWorkspaceStore((s) => s.setPlannerStep);
  const workspaceUnitSystem = usePlannerWorkspaceStore((s) => s.unitSystem);
  const [leftTab, setLeftTab] = useState<PlannerLeftTab>(getStepLeftTab(plannerStep));
  const setPlannerTool = usePlannerStore((s) => s.setTool);
  const {
    status: saveStatus,
    lastSavedAt,
    restoreSnapshot,
    retrySave,
  } = usePlannerAutosave(editor, guestMode, planId);
  const measurementUnit = useMemo<MeasurementUnit>(
    () => plannerUnitSystemToMeasurementUnit(workspaceUnitSystem),
    [workspaceUnitSystem],
  );
  const plannerStepGates = useMemo(
    () => evaluatePlannerStepGates(editor, planMetrics),
    [editor, planMetrics],
  );
  const disabledSteps = useMemo(
    () => getDisabledPlannerSteps(plannerStepGates),
    [plannerStepGates],
  );

  const currentDraftScope = useMemo<PlannerDraftScope>(
    () => ({ documentId: LOCAL_CURRENT_DRAFT_ID }),
    [],
  );

  const draftPlanName = useMemo(() => {
    void localDraftVersion;
    const localDraft = loadPlannerDraftDocument(currentDraftScope);
    if (!localDraft) return "Workspace Plan";
    return localDraft.title ?? localDraft.name;
  }, [currentDraftScope, localDraftVersion]);

  const draftNameKey = useMemo(
    () => `${currentDraftScope.documentId ?? ""}:${localDraftVersion}`,
    [currentDraftScope, localDraftVersion],
  );
  const [planNameKey, setPlanNameKey] = useState(draftNameKey);
  if (planNameKey !== draftNameKey) {
    setPlanNameKey(draftNameKey);
    setPlanNameOverride(null);
  }

  const planName = planNameOverride ?? draftPlanName;

  const syncViewerShapes = useCallback((instance: Editor) => {
    setViewerShapes(toPlannerViewerShapes(instance.getCurrentPageShapes()));
  }, []);

  const applyToolBinding = useCallback((binding: PlannerToolBinding) => {
    const editorToolId =
      binding.toolId === "planner-furniture" ? "select" : binding.toolId;
    const railToolId: PlannerToolId = editorToolId;
    setActiveTool(railToolId);
    setActivePlannerTool(binding.plannerTool);
    setPlannerTool(binding.plannerTool);
    if (editor) {
      editor.setCurrentTool(editorToolId);
    }
  }, [editor, setPlannerTool]);

  const syncPlannerStep = useCallback((step: PlannerStep) => {
    setPlannerStep(step);
    setLeftTab(getStepLeftTab(step));
    applyToolBinding(getStepToolBinding(step));

    if (panels.isCompact) {
      if (step === "catalog" || step === "room") {
        panels.setLeftOpen(true);
        panels.setRightOpen(false);
      } else if (step === "review") {
        panels.setRightOpen(true);
        panels.setLeftOpen(false);
      }
    }
  }, [applyToolBinding, panels, setPlannerStep]);

  const handleToolSelect = useCallback((
    tool: PlannerToolId,
    plannerTool: "select" | "pan" | "wall" | "room" | "door" | "window" | "furniture" | "zone" | "measure",
  ) => {
    applyToolBinding({ toolId: tool, plannerTool });
  }, [applyToolBinding]);

  const placeCatalogItem = useCallback((item: CatalogItem, x: number, y: number) => {
    if (!editor) return;
    editor.createShape(
      buildCatalogShape(item, x, y) as unknown as Parameters<Editor["createShape"]>[0],
    );
    syncViewerShapes(editor);
    const count = editor.getCurrentPageShapes().length;
    setShapeCount(count);
    if (count === 1) {
      requestAnimationFrame(() => fitPlannerContent(editor));
    }
  }, [editor, syncViewerShapes]);

  const handleCatalogItemClick = useCallback((item: CatalogItem) => {
    if (!editor) return;
    const existingCount = editor.getCurrentPageShapes().length;
    const x = 220 + (existingCount % 5) * 120;
    const y = 180 + Math.floor(existingCount / 5) * 100;
    placeCatalogItem(item, x, y);
  }, [editor, placeCatalogItem]);

  const handleApplyTemplate = useCallback((template: LayoutTemplate) => {
    if (!editor) return;
    applyShapes(editor, buildTemplateShapes(template));
    setIsTemplateOpen(false);
    syncViewerShapes(editor);
    setShapeCount(editor.getCurrentPageShapes().length);
  }, [editor, syncViewerShapes]);

  const handleApplyRoomPreset = useCallback((preset: RoomPreset) => {
    if (!editor) return;
    applyRoomPreset(editor, preset);
    syncPlannerStep("room");
    syncViewerShapes(editor);
    setShapeCount(editor.getCurrentPageShapes().length);
    setPlanMetrics(getPageMetrics(editor));
    setSelectionStatus(getEditorSelectionStatus(editor));
  }, [editor, syncPlannerStep, syncViewerShapes]);

  const buildCurrentPlannerDocument = useCallback(() => {
    if (!editor) {
      return normalizePlannerDocument({
        id: activeDocumentId ?? undefined,
        name: sanitizePlannerPlanName(planName),
        title: sanitizePlannerPlanName(planName),
        unitSystem: workspaceUnitSystem,
      });
    }

    return buildPlannerDocumentFromEditor(editor, {
      documentId: activeDocumentId,
      name: sanitizePlannerPlanName(planName),
      projectName: sanitizePlannerPlanName(planName),
      unitSystem: workspaceUnitSystem === "imperial" ? "ft-in" : "mm",
    });
  }, [activeDocumentId, editor, planName, workspaceUnitSystem]);
  const viewerDocument = buildCurrentPlannerDocument();

  const applyPlannerDocument = useCallback((document: ReturnType<typeof normalizePlannerDocument>) => {
    if (!editor) return false;
    const normalized = normalizePlannerDocument(document);
    const loaded = loadPlannerDocumentIntoEditor(editor, normalized);
    if (!loaded) {
      setSessionErrorMessage("This planner document could not be loaded into the current workspace.");
      return false;
    }
    setPlanNameOverride(normalized.title ?? normalized.name);
    setActiveDocumentId(normalized.id ?? null);
    setSessionErrorMessage(null);
    setSessionStatusMessage(`Loaded ${normalized.title ?? normalized.name}`);
    setLocalDraftVersion((value) => value + 1);
    return true;
  }, [editor, setPlanNameOverride]);

  const handleEditorMount = useCallback((instance: Editor) => {
    setEditor(instance);
    setActiveTool("select");
    setActivePlannerTool("select");
    setPlannerTool("select");

    configurePlannerCamera(instance);

    void (async () => {
      if (!guestMode && planId?.trim()) {
        await hydrateCloudPlanIntoIndexedDb(planId, guestMode);
      }
      await restoreSnapshot(instance);
      const count = instance.getCurrentPageShapes().length;
      setShapeCount(count);
      syncViewerShapes(instance);

      requestAnimationFrame(() => {
        if (count === 0) {
          setDefaultPlannerCamera(instance);
        } else {
          fitPlannerContent(instance);
        }
        syncCamera();
      });
    })();

    const syncDoc = () => {
      syncViewerShapes(instance);
      const count = instance.getCurrentPageShapes().length;
      setShapeCount(count);
      setPlanMetrics(getPageMetrics(instance));
      setSelectionStatus(getEditorSelectionStatus(instance));
    };

    const syncSession = () => {
      setSelectionStatus(getEditorSelectionStatus(instance));
    };

    const syncCamera = () => {
      const cam = instance.getCamera();
      setCamera({ x: cam.x, y: cam.y, z: cam.z });
    };

    syncDoc();
    syncCamera();
    syncSession();

    const cleanupDoc = instance.store.listen(syncDoc, { scope: "document" });
    const cleanupSession = instance.store.listen(syncSession, { scope: "session" });
    const cleanupCamera = instance.store.listen(syncCamera, { scope: "session" });

    setShapeCount(instance.getCurrentPageShapes().length);

    return () => {
      cleanupDoc();
      cleanupSession();
      cleanupCamera();
    };
  }, [guestMode, planId, setPlannerTool, syncViewerShapes, restoreSnapshot]);

  useEffect(() => {
    if (!editor) return;
    applyLayerVisibility(editor, layerVisible);
  }, [editor, layerVisible]);

  const handleCatalogDragStart = useCallback((item: CatalogItem) => {
    setDragItem(item);
  }, []);

  const handleCanvasDragOver = useCallback((e: DragEvent) => {
    if (!acceptsCatalogDrag(e.dataTransfer)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setGhostPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleCanvasDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setGhostPos(null);
    setDragItem(null);
    if (!editor) return;
    const raw = readCatalogDragPayload(e.dataTransfer);
    if (!raw) return;
    try {
      const item = JSON.parse(raw) as CatalogItem;
      const pagePoint = editor.screenToPage({ x: e.clientX, y: e.clientY });
      placeCatalogItem(item, pagePoint.x, pagePoint.y);
    } catch {
      // Invalid drag payload — ignore.
    }
  }, [editor, placeCatalogItem]);

  const handleCanvasDragLeave = useCallback((e: DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setGhostPos(null);
    setDragItem(null);
  }, []);

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
        setViewMode((prev) => prev === "2d" ? "3d" : prev === "3d" ? "split" : "2d");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [applyToolBinding, isTemplateOpen]);

  const canvas2D = (
    <Suspense fallback={<PlannerSkeleton />}>
      <div className="relative w-full h-full">
        <BlueprintUnderlay camera={camera} />
        <SharedTldrawEngine
          onMount={handleEditorMount}
          shapeUtils={PLANNER_TLDRAW_SHAPE_UTILS as unknown as []}
          tools={PLANNER_TLDRAW_TOOLS as unknown as []}
        />
        <BlueprintMoveCapture editor={editor} />
        <CalibrationCapture editor={editor} />
      </div>
    </Suspense>
  );

  const canvas3D = (
    <Suspense fallback={<PlannerSkeleton />}>
      <Planner3DViewer document={viewerDocument} className="h-full min-h-0" />
    </Suspense>
  );

  const handleCanvasReset = useCallback(() => {
    if (!editor) return;
    setShapeCount(0);
    setPlanMetrics(getPageMetrics(editor));
    syncViewerShapes(editor);
  }, [editor, syncViewerShapes]);

  const localDraft = useMemo(() => {
    void localDraftVersion;
    return loadPlannerDraftDocument(currentDraftScope);
  }, [currentDraftScope, localDraftVersion]);

  const localDraftSessions = useMemo(() => {
    void localDraftVersion;
    return listPlannerDraftDocuments()
      .filter((entry) => entry.scope.documentId && entry.scope.documentId !== LOCAL_CURRENT_DRAFT_ID);
  }, [localDraftVersion]);

  const plannerSavedEntries = useMemo<PlannerSavedEntry[]>(
    () => {
      const namedEntries = localDraftSessions.map((entry) => ({
        id: entry.scope.documentId ?? entry.envelope.document.id ?? entry.storageKey,
        name: entry.envelope.document.title ?? entry.envelope.document.name,
        source: "local" as const,
        isActive: activeDocumentId === (entry.scope.documentId ?? entry.envelope.document.id ?? entry.storageKey),
        canDelete: true,
        canRename: true,
        updatedAtLabel: formatPlannerSavedPlanTimestamp(
          entry.envelope.document.updatedAt ?? entry.envelope.document.createdAt ?? entry.envelope.savedAt,
        ),
        itemCount: entry.envelope.document.itemCount,
        detail: `${entry.envelope.document.roomWidthMm}mm x ${entry.envelope.document.roomDepthMm}mm`,
        subtitle: entry.envelope.document.projectName ?? "Named local session",
        statusLabel: entry.envelope.document.unitSystem === "imperial" ? "Imperial units" : "Metric units",
      }));

      if (!localDraft) {
        return namedEntries;
      }

      return [
        {
          id: LOCAL_CURRENT_DRAFT_ID,
          name: `${localDraft.title ?? localDraft.name} (Current Draft)`,
          source: "local" as const,
          isActive: !activeDocumentId || activeDocumentId === LOCAL_CURRENT_DRAFT_ID,
          canDelete: false,
          canRename: false,
          updatedAtLabel: formatPlannerSavedPlanTimestamp(localDraft.updatedAt ?? localDraft.createdAt),
          itemCount: localDraft.itemCount,
          detail: `${localDraft.roomWidthMm}mm x ${localDraft.roomDepthMm}mm`,
          subtitle: localDraft.projectName ?? "Rolling browser draft",
          statusLabel: localDraft.unitSystem === "imperial" ? "Imperial units" : "Metric units",
        },
        ...namedEntries,
      ];
    },
    [activeDocumentId, localDraft, localDraftSessions],
  );

  const handleSaveDraft = useCallback(() => {
    const draftDocument = buildCurrentPlannerDocument();
    const namedDocumentId = activeDocumentId ?? draftDocument.id ?? crypto.randomUUID();
    const normalizedName = sanitizePlannerPlanName(planName);
    const normalizedDraft = normalizePlannerDocument({
      ...draftDocument,
      id: namedDocumentId,
      name: normalizedName,
      title: normalizedName,
    });

    const savedCurrent = savePlannerDraftDocument(normalizedDraft, currentDraftScope);
    const savedNamed = savePlannerDraftDocument(normalizedDraft, { documentId: namedDocumentId });
    setActiveDocumentId(namedDocumentId);
    setLocalDraftVersion((value) => value + 1);
    if (!savedCurrent || !savedNamed) {
      setSessionErrorMessage("Local draft save is unavailable in this environment.");
      return;
    }
    setSessionErrorMessage(null);
    setSessionStatusMessage(`Local session saved ${formatPlannerSavedPlanTimestamp(savedNamed.savedAt)}`);
  }, [activeDocumentId, buildCurrentPlannerDocument, currentDraftScope, planName]);

  const handleSaveAsNewSession = useCallback(() => {
    const draftDocument = buildCurrentPlannerDocument();
    const newDocumentId = crypto.randomUUID();
    const normalizedName = sanitizePlannerPlanName(
      activeDocumentId ? `${planName} Copy` : planName,
    );
    const normalizedDraft = normalizePlannerDocument({
      ...draftDocument,
      id: newDocumentId,
      name: normalizedName,
      title: normalizedName,
    });

    const savedCurrent = savePlannerDraftDocument(normalizedDraft, currentDraftScope);
    const savedNamed = savePlannerDraftDocument(normalizedDraft, { documentId: newDocumentId });
    setActiveDocumentId(newDocumentId);
    setPlanNameOverride(normalizedName);
    setLocalDraftVersion((value) => value + 1);
    if (!savedCurrent || !savedNamed) {
      setSessionErrorMessage("New local session could not be created.");
      return;
    }
    setSessionErrorMessage(null);
    setSessionStatusMessage(`New local session created ${formatPlannerSavedPlanTimestamp(savedNamed.savedAt)}`);
  }, [activeDocumentId, buildCurrentPlannerDocument, currentDraftScope, planName, setPlanNameOverride]);

  const handleLoadPlan = useCallback((plan: PlannerSavedEntry) => {
    if (plan.source !== "local") {
      setSessionErrorMessage("Only local draft loading is enabled in this planner session.");
      return;
    }
    const scope = plan.id === LOCAL_CURRENT_DRAFT_ID ? currentDraftScope : { documentId: plan.id };
    const draft = loadPlannerDraftDocument(scope);
    if (!draft) {
      setSessionErrorMessage("Local draft not found.");
      return;
    }
    applyPlannerDocument(draft);
  }, [applyPlannerDocument, currentDraftScope]);

  const handleDeletePlan = useCallback((plan: PlannerSavedEntry) => {
    if (plan.source !== "local" || plan.id === LOCAL_CURRENT_DRAFT_ID) {
      setSessionErrorMessage("Only named local sessions can be deleted here.");
      return;
    }

    const deleted = deletePlannerDraftDocument({ documentId: plan.id });
    if (!deleted) {
      setSessionErrorMessage("Local session could not be deleted.");
      return;
    }

    if (activeDocumentId === plan.id) {
      setActiveDocumentId(null);
    }

    setLocalDraftVersion((value) => value + 1);
    setSessionErrorMessage(null);
    setSessionStatusMessage(`Deleted local session: ${plan.name}`);
  }, [activeDocumentId]);

  const handleRenamePlan = useCallback((plan: PlannerSavedEntry, nextNameInput: string) => {
    if (plan.source !== "local" || plan.id === LOCAL_CURRENT_DRAFT_ID) {
      setSessionErrorMessage("Only named local sessions can be renamed here.");
      return;
    }

    const existing = loadPlannerDraftDocument({ documentId: plan.id });
    if (!existing) {
      setSessionErrorMessage("Local session not found.");
      return;
    }

    const nextName = sanitizePlannerPlanName(nextNameInput);
    const renamed = normalizePlannerDocument({
      ...existing,
      name: nextName,
      title: nextName,
    });

    const savedNamed = savePlannerDraftDocument(renamed, { documentId: plan.id });
    if (activeDocumentId === plan.id) {
      savePlannerDraftDocument(renamed, currentDraftScope);
      setPlanNameOverride(nextName);
    }
    setLocalDraftVersion((value) => value + 1);
    if (!savedNamed) {
      setSessionErrorMessage("Local session could not be renamed.");
      return;
    }

    setSessionErrorMessage(null);
    setSessionStatusMessage(`Renamed local session to ${nextName}`);
  }, [activeDocumentId, currentDraftScope, setPlanNameOverride]);

  const handleImportRequest = useCallback(() => {
    importInputRef.current?.click();
  }, []);

  const handleImportFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const parsed = await parsePlannerDocumentImportFile(file);
    if (!parsed.ok || !parsed.document) {
      setSessionErrorMessage(parsed.errors.join(" | "));
      event.currentTarget.value = "";
      return;
    }

    const loaded = applyPlannerDocument(parsed.document);
    if (loaded) {
      const documentId = parsed.document.id ?? crypto.randomUUID();
      const normalizedName = sanitizePlannerPlanName(parsed.document.title ?? parsed.document.name);
      const normalizedDocument = normalizePlannerDocument({
        ...parsed.document,
        id: documentId,
        name: normalizedName,
        title: normalizedName,
      });
      savePlannerDraftDocument(normalizedDocument, currentDraftScope);
      savePlannerDraftDocument(normalizedDocument, { documentId });
      setActiveDocumentId(documentId);
      setLocalDraftVersion((value) => value + 1);
      setSessionStatusMessage(`Imported planner JSON: ${normalizedName}`);
    }
    event.currentTarget.value = "";
  }, [applyPlannerDocument, currentDraftScope]);

  const handleExportJson = useCallback(() => {
    const plannerDocument = buildCurrentPlannerDocument();
    const payload = JSON.stringify(createPlannerExportPayload(plannerDocument), null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `${sanitizePlannerPlanName(planName).toLowerCase().replace(/[^a-z0-9]+/g, "-") || "planner-document"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setSessionStatusMessage("Planner JSON exported.");
  }, [buildCurrentPlannerDocument, planName]);

  const handleOpen3dSession = useCallback(() => {
    setViewMode("3d");
    setSessionStatusMessage("Switched to 3D view.");
  }, []);

  const handleOpenAiAssist = useCallback(() => {
    setLeftTab("ai-assist");
    if (panels.isCompact) {
      panels.setLeftOpen(true);
      panels.setRightOpen(false);
    }
  }, [panels]);

  return (
    <div className="pw-shell">
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImportFileChange}
      />
      <PlannerTopBar
        guestMode={guestMode}
        planName={planName}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        onRetrySave={retrySave}
        onOpenSession={() => setIsSessionOpen(true)}
        onOpenTemplates={() => setIsTemplateOpen(true)}
        onOpenAi={handleOpenAiAssist}
        editor={editor}
        onOpenExport={() => setIsExportOpen(true)}
        onCanvasReset={handleCanvasReset}
      />

      <div className={`pw-workspace${panels.isCompact ? " pw-workspace--compact" : ""}`}>
        {panels.isCompact && (panels.leftOpenRaw || panels.rightOpenRaw) && (
          <button
            type="button"
            className="pw-panel-backdrop"
            aria-label="Close panel"
            onClick={panels.closeAll}
          />
        )}

        <PlannerToolRail
          activeTool={activeTool}
          activePlannerTool={activePlannerTool}
          tooltipSide={panels.isCompact ? "top" : "right"}
          onSelect={handleToolSelect}
        />

        <PlannerLeftPanel
          guestMode={guestMode}
          editor={editor}
          plannerStep={plannerStep}
          activeTab={leftTab}
          onTabChange={setLeftTab}
          onItemClick={handleCatalogItemClick}
          onDragStart={handleCatalogDragStart}
          onApplyRoomPreset={handleApplyRoomPreset}
          unitSystem={measurementUnit}
        />

        <main className="pw-canvas-area" aria-label="Workspace canvas">
          <div
            className={`pw-canvas-surface pw-tldraw-container ${resolvedTheme === "dark" ? "tl-theme__dark" : "tl-theme__light"}`}
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
            onDragLeave={handleCanvasDragLeave}
          >
            {shapeCount === 0 && (
              <PlannerEmptyCanvas
                guestMode={guestMode}
                onDrawWalls={() => handleToolSelect("planner-wall", "wall")}
                onOpenTemplates={() => setIsTemplateOpen(true)}
                onImportBlueprint={() => setIsBlueprintOpen(true)}
              />
            )}
            <BlueprintTraceGuideOverlay
              activePlannerTool={activePlannerTool}
              blueprintLoaded={Boolean(blueprint.dataUrl)}
              underlayVisible={layerVisible.underlay}
              calibrated={Boolean(blueprint.mmPerUnit)}
              calibrating={blueprint.calibrating}
              interactionMode={blueprint.interactionMode}
            />
            <SnapIndicatorOverlay editor={editor} />
            <CanvasMeasurementOverlay editor={editor} unitSystem={measurementUnit} />
            <SplitViewLayout
              view={viewMode}
              children2D={canvas2D}
              children3D={canvas3D}
            />
          </div>
          <PlannerStatusBar metrics={planMetrics} selectionStatus={selectionStatus} />
        </main>

        <aside className="pw-right-panel" data-open={panels.rightOpen}>
          <PlannerStepBar
            current={plannerStep}
            disabledSteps={disabledSteps}
            onChange={syncPlannerStep}
            compact={panels.isCompact}
          />
          <PlannerWorkflowPanel
            editor={editor}
            metrics={planMetrics}
            step={plannerStep}
            onStepChange={syncPlannerStep}
            onOpenExport={() => setIsExportOpen(true)}
          />
          <PropertiesInspector editor={editor} />
          <LayerVisibilityPanel editor={editor} />
          <LayerManagerPanel editor={editor} unitSystem={workspaceUnitSystem} />
        </aside>

        {panels.isCompact && (
          <PlannerMobileDock
            leftActive={panels.leftOpenRaw}
            rightActive={panels.rightOpenRaw}
            onToggleLeft={panels.toggleLeft}
            onToggleRight={panels.toggleRight}
            onFocusCanvas={panels.closeAll}
          />
        )}
      </div>

      <TemplatePickerModal
        isOpen={isTemplateOpen}
        onClose={() => setIsTemplateOpen(false)}
        onApply={handleApplyTemplate}
      />

      <PlannerSessionDialog
        open={isSessionOpen}
        onOpenChange={setIsSessionOpen}
        planName={planName}
        onPlanNameChange={setPlanNameOverride}
        plans={plannerSavedEntries}
        isAuthenticated={false}
        statusMessage={sessionStatusMessage}
        errorMessage={sessionErrorMessage}
        canOpen3d={shapeCount > 0}
        onSaveCloud={() => setSessionErrorMessage("Cloud save is intentionally disabled in this local-first planner session.")}
        onSaveDraft={handleSaveDraft}
        onSaveAsNewSession={handleSaveAsNewSession}
        onLoadPlan={handleLoadPlan}
        onDeletePlan={handleDeletePlan}
        onRenamePlan={handleRenamePlan}
        onImport={handleImportRequest}
        onExportJson={handleExportJson}
        onOpen3d={handleOpen3dSession}
        onDismissError={() => setSessionErrorMessage(null)}
      />

      {dragItem && ghostPos && <CatalogDropGhost item={dragItem} x={ghostPos.x} y={ghostPos.y} />}

      {editor && isExportOpen && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          editor={editor}
        />
      )}

      {isBlueprintOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative max-w-lg rounded-2xl border border-soft bg-panel p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setIsBlueprintOpen(false)}
              className="absolute right-3 top-3 text-muted hover:text-default"
              aria-label="Close"
            >
              <X size={16} aria-hidden />
            </button>
            <BlueprintPanel embedded />
          </div>
        </div>
      )}
    </div>
  );
}
