"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { usePlannerStore } from "../../data/plannerStore";
import { usePlannerGeometryStore } from "../../data/plannerGeometryStore";
import { usePlannerFurnitureStore } from "../../data/plannerFurnitureStore";
import { usePlannerProjectStore } from "../../data/plannerProjectStore";
import { usePlannerHistoryStore } from "../../data/plannerHistoryStore";
import { useToastStore } from "../../data/toastStore";
import { useAIStore } from "../../data/aiStore";
import { decodeProjectFromHash } from "../../lib/shareProject";
import {
  applyKonvaRefineItemsToPlannerState,
  buildPlannerTldrawKonvaHandoff,
} from "../../lib/plannerKonvaRefine";
import { getTldrawEditor } from "../../r3f/usePlannerR3FSync";
import type { PlannerTldrawKonvaHandoffItem } from "../../model/plannerHandoff";
import type { MeasurementItem } from "../../data/plannerTypes";

function captureThumbnail(): string | null {
  return null;
}

export interface PlannerPageState {
  // View state
  isMobileView: boolean;
  loading: boolean;
  isSharedView: boolean;
  // Panel open states
  templateOpen: boolean;
  shortcutsOpen: boolean;
  boqOpen: boolean;
  quoteOpen: boolean;
  clusterOpen: boolean;
  autoArrangeOpen: boolean;
  presentationOpen: boolean;
  zonePlanningOpen: boolean;
  showSpacing: boolean;
  integrationsOpen: boolean;
  refineOpen: boolean;
  refineHandoff: ReturnType<typeof buildPlannerTldrawKonvaHandoff> | null;
  // Setters / actions
  setTemplateOpen: (v: boolean) => void;
  setShortcutsOpen: (v: boolean) => void;
  setBoqOpen: (v: boolean) => void;
  setQuoteOpen: (v: boolean) => void;
  setClusterOpen: (v: boolean) => void;
  setAutoArrangeOpen: (v: boolean) => void;
  setPresentationOpen: (v: boolean) => void;
  setZonePlanningOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSpacing: React.Dispatch<React.SetStateAction<boolean>>;
  setIntegrationsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // Workflow actions
  saveWithThumbnail: () => void;
  openTemplates: () => void;
  openRefineStage: () => void;
  applyRefineStage: (items: PlannerTldrawKonvaHandoffItem[]) => void;
  closeRefineStage: () => void;
  goToSketchStage: () => void;
  goToPreviewStage: () => void;
}

/**
 * Extracts all state, effects, and callbacks from OandoPlannerPage to keep
 * the component body focused on rendering.
 */
export function usePlannerPageState(
  guestMode: boolean,
  isSharedViewProp: boolean,
): PlannerPageState {
  const searchParams = useSearchParams();
  const setViewMode = usePlannerStore((s) => s.setViewMode);
  const saveProject = usePlannerStore((s) => s.saveProject);
  const loadProject = usePlannerStore((s) => s.loadProject);
  const addToast = useToastStore((s) => s.addToast);
  const { setOpen: setAIOpen } = useAIStore();

  const [isMobileView, setIsMobileView] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );
  const [loading, setLoading] = useState(true);
  const [isSharedView, setIsSharedView] = useState(isSharedViewProp);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [boqOpen, setBoqOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [clusterOpen, setClusterOpen] = useState(false);
  const [autoArrangeOpen, setAutoArrangeOpen] = useState(false);
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [zonePlanningOpen, setZonePlanningOpen] = useState(false);
  const [showSpacing, setShowSpacing] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineHandoff, setRefineHandoff] = useState<ReturnType<
    typeof buildPlannerTldrawKonvaHandoff
  > | null>(null);

  const sessionReadOnly = guestMode || isSharedView;

  // ── Resize listener ──────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Hash-based shared-project loader / guest seed ──────────────────────────
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("share=")) {
      const sharedData = decodeProjectFromHash(hash);
      if (sharedData) {
        // Route state to domain stores directly — facade setState doesn't own these slices
        usePlannerGeometryStore.setState({
          walls: sharedData.walls || [],
          rooms: sharedData.rooms || [],
          doors: sharedData.doors || [],
          windows: sharedData.windows || [],
          measurements: (sharedData.measurements || []).map((m: MeasurementItem) => ({
            ...m,
            label: m.label || "",
          })),
          drawingWall: null,
          drawingRoom: [],
          drawingZone: [],
        });
        usePlannerFurnitureStore.setState({
          furniture: (sharedData.furniture || []).map((f, i) => ({
            ...f,
            zIndex: f.zIndex ?? i,
          })),
          selectedId: null,
          selectedIds: [],
        });
        usePlannerProjectStore.setState({
          projectName: sharedData.projectName || "Shared Project",
          currentProjectKey: null,
          isDirty: false,
          lastSavedAt: null,
        });
        usePlannerHistoryStore.setState({ undoStack: [], redoStack: [], clipboard: null });
        window.setTimeout(() => setIsSharedView(true), 0);
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        useToastStore.getState().addToast("info", "Shared project loaded (read-only view)");
      }
    } else if (guestMode) {
      // Seed a starter room so guests don't land on a blank canvas
      const geo = usePlannerGeometryStore.getState();
      const furn = usePlannerFurnitureStore.getState();
      const hasContent = geo.walls.length > 0 || geo.rooms.length > 0 || furn.furniture.length > 0;
      if (!hasContent) {
        usePlannerGeometryStore.setState({
          walls: [
            { id: "guest-w1", start: { x: 100, y: 100 }, end: { x: 900, y: 100 }, thickness: 12, color: "var(--border-strong)" },
            { id: "guest-w2", start: { x: 900, y: 100 }, end: { x: 900, y: 700 }, thickness: 12, color: "var(--border-strong)" },
            { id: "guest-w3", start: { x: 900, y: 700 }, end: { x: 100, y: 700 }, thickness: 12, color: "var(--border-strong)" },
            { id: "guest-w4", start: { x: 100, y: 700 }, end: { x: 100, y: 100 }, thickness: 12, color: "var(--border-strong)" },
          ],
          rooms: [
            {
              id: "guest-room-1",
              points: [
                { x: 100, y: 100 },
                { x: 900, y: 100 },
                { x: 900, y: 700 },
                { x: 100, y: 700 },
              ],
              name: "Open Office",
              color: "var(--color-ocean-boat-blue-500)",
            },
          ],
          doors: [{ id: "guest-d1", width: 90, swing: "left", x: 250, y: 0, rotation: 0, openAngle: 90 }],
          windows: [{ id: "guest-win1", width: 150, style: "single", x: 300, y: 0, rotation: 0 }],
        });
        usePlannerFurnitureStore.setState({
          furniture: [
            { id: "guest-f1", catalogId: "ws-linear-140", name: "Linear Desk 1400", x: 250, y: 250, width: 140, height: 70, rotation: 0, color: "var(--border-soft)", shape: "workstation-linear", zIndex: 0 },
            { id: "guest-f2", catalogId: "ch-task-std",   name: "Task Chair Standard", x: 320, y: 340, width: 50, height: 50, rotation: 0, color: "var(--border-soft)", shape: "task-chair", zIndex: 1 },
            { id: "guest-f3", catalogId: "ws-linear-140", name: "Linear Desk 1400", x: 500, y: 250, width: 140, height: 70, rotation: 0, color: "var(--border-soft)", shape: "workstation-linear", zIndex: 2 },
            { id: "guest-f4", catalogId: "ch-task-std",   name: "Task Chair Standard", x: 570, y: 340, width: 50, height: 50, rotation: 0, color: "var(--border-soft)", shape: "task-chair", zIndex: 3 },
            { id: "guest-f5", catalogId: "tbl-meeting-6", name: "Meeting Table 6-Seat", x: 500, y: 550, width: 240, height: 120, rotation: 0, color: "var(--border-soft)", shape: "meeting-table-6", zIndex: 4 },
          ],
        });
        usePlannerProjectStore.setState({ projectName: "Guest Demo – Office Layout", isDirty: false });
      }
    }
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [guestMode]);

  // ── Load project from ?load= query param ─────────────────────────────────
  useEffect(() => {
    if (isSharedView || sessionReadOnly) return;
    const loadKey = searchParams.get("load");
    if (!loadKey) return;
    loadProject(loadKey);
    useToastStore.getState().addToast("info", "Saved plan loaded");
  }, [isSharedView, loadProject, searchParams, sessionReadOnly]);

  // ── Auto-save every 30 seconds ────────────────────────────────────────────
  useEffect(() => {
    if (sessionReadOnly) return;
    const interval = setInterval(() => {
      const store = usePlannerStore.getState();
      if (store.isDirty && store.hasContent()) {
        store.saveProject(captureThumbnail() ?? undefined);
        useToastStore.getState().addToast("info", "Auto-saved");
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [sessionReadOnly]);

  // ── Unsaved-changes beforeunload guard ────────────────────────────────────
  useEffect(() => {
    if (sessionReadOnly) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (usePlannerStore.getState().isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [sessionReadOnly]);

  // ── Global keyboard shortcuts ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShortcutsOpen((o) => !o);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setAIOpen(true);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (sessionReadOnly) {
          addToast("info", guestMode ? "Save is disabled in guest mode" : "Save is disabled in read-only view");
          return;
        }
        saveProject(captureThumbnail() ?? undefined);
        useToastStore.getState().addToast("success", "Project saved");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [addToast, guestMode, saveProject, setAIOpen, sessionReadOnly]);

  // ── Callbacks ─────────────────────────────────────────────────────────────
  const saveWithThumbnail = useCallback(() => {
    if (sessionReadOnly) {
      addToast("info", guestMode ? "Save is disabled in guest mode" : "Save is disabled in read-only view");
      return;
    }
    saveProject(captureThumbnail() ?? undefined);
  }, [addToast, guestMode, saveProject, sessionReadOnly]);

  const closeRefineStage = useCallback(() => {
    setRefineOpen(false);
    setRefineHandoff(null);
  }, []);

  const goToSketchStage = useCallback(() => {
    closeRefineStage();
    setViewMode("2d");
  }, [closeRefineStage, setViewMode]);

  const goToPreviewStage = useCallback(() => {
    closeRefineStage();
    setViewMode("3d");
  }, [closeRefineStage, setViewMode]);

  const openTemplates = useCallback(() => {
    if (sessionReadOnly) {
      addToast("info", guestMode ? "Templates are disabled in guest mode" : "Templates are disabled in read-only view");
      return;
    }
    setTemplateOpen(true);
  }, [addToast, guestMode, sessionReadOnly]);

  const openRefineStage = useCallback(() => {
    if (sessionReadOnly) {
      addToast("info", guestMode ? "Refine stage is disabled in guest mode" : "Refine stage is disabled in read-only view");
      return;
    }
    const store = usePlannerStore.getState();
    if (!store.hasContent()) {
      addToast("info", "Add room geometry before opening refine");
      return;
    }
    const editor = getTldrawEditor();
    if (!editor) {
      addToast("error", "Refine stage is unavailable until the planner canvas is ready");
      return;
    }
    setViewMode("2d");
    setRefineHandoff(buildPlannerTldrawKonvaHandoff(editor, store));
    setRefineOpen(true);
  }, [addToast, guestMode, sessionReadOnly, setViewMode]);

  const applyRefineStage = useCallback(
    (items: PlannerTldrawKonvaHandoffItem[]) => {
      if (sessionReadOnly) {
        addToast("info", guestMode ? "Refine apply is disabled in guest mode" : "Refine apply is disabled in read-only view");
        closeRefineStage();
        return;
      }
      const store = usePlannerStore.getState();
      store.pushSnapshot();
      usePlannerStore.setState((current) => ({
        ...applyKonvaRefineItemsToPlannerState(current, items),
        selectedId: null,
        selectedIds: [],
      }));
      addToast("success", "Konva refine edits applied back into Oando Planner");
      closeRefineStage();
    },
    [addToast, closeRefineStage, guestMode, sessionReadOnly],
  );

  return {
    isMobileView,
    loading,
    isSharedView,
    templateOpen,
    shortcutsOpen,
    boqOpen,
    quoteOpen,
    clusterOpen,
    autoArrangeOpen,
    presentationOpen,
    zonePlanningOpen,
    showSpacing,
    integrationsOpen,
    refineOpen,
    refineHandoff,
    setTemplateOpen,
    setShortcutsOpen,
    setBoqOpen,
    setQuoteOpen,
    setClusterOpen,
    setAutoArrangeOpen,
    setPresentationOpen,
    setZonePlanningOpen,
    setShowSpacing,
    setIntegrationsOpen,
    saveWithThumbnail,
    openTemplates,
    openRefineStage,
    applyRefineStage,
    closeRefineStage,
    goToSketchStage,
    goToPreviewStage,
  };
}
