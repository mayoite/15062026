"use client";

import { useRef, useState } from "react";

import { getTldrawEditor } from "@/features/oando-planner/r3f/usePlannerR3FSync";
import { usePlannerStore, validateImportedProject } from "@/features/oando-planner/data/plannerStore";
import { useToastStore } from "@/features/oando-planner/data/toastStore";
import { exportPDF } from "@/features/oando-planner/lib/export/exportPDF";
import { exportSVG } from "@/features/oando-planner/lib/export/exportSVG";
import { exportBOQJSON } from "@/features/oando-planner/lib/export/exportBOQ";
import { generateBOQ } from "@/features/oando-planner/lib/export/boqGenerator";
import { copyToClipboard, encodeProjectToURL } from "@/features/oando-planner/lib/shareProject";

import {
  buildPortalPublishData,
  buildProjectExportData,
  buildSharePayload,
  normalizeImportedProject,
  resolvePortalProjectId,
} from "./editorTopBarData";

interface UseEditorTopBarActionsArgs {
  onSave?: () => void;
  readOnly?: boolean;
}

async function syncSavedProjectToSupabase(status: "draft" | "active" = "draft") {
  const state = usePlannerStore.getState();
  const projectId = resolvePortalProjectId(state.currentProjectKey);
  if (!state.currentProjectKey || !projectId) return;

  const response = await fetch("/api/plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: projectId,
      projectName: state.projectName,
      data: buildPortalPublishData(state),
      status,
    }),
  });

  if (response.status === 401) return;
  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export function useEditorTopBarActions({ onSave, readOnly = false }: UseEditorTopBarActionsArgs) {
  const addToast = useToastStore((state) => state.addToast);
  const clearAll = usePlannerStore((state) => state.clearAll);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareURL, setShareURL] = useState("");
  const [shareCopied, setShareCopied] = useState(false);

  const handleSave = async () => {
    if (readOnly) {
      addToast("info", "Save is disabled in read-only mode");
      return;
    }
    if (onSave) {
      onSave();
    } else {
      usePlannerStore.getState().saveProject();
    }

    try {
      await syncSavedProjectToSupabase("draft");
      addToast("success", "Project saved");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addToast("error", `Local save succeeded; cloud save failed: ${message}`);
    }
  };

  const handleExportJSON = () => {
    if (readOnly) {
      addToast("info", "Export is disabled in read-only mode");
      return;
    }
    const state = usePlannerStore.getState();
    const data = buildProjectExportData(state);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${state.projectName.replace(/\s+/g, "-")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    addToast("success", "JSON exported");
  };

  const handleExportPNG = async () => {
    if (readOnly) {
      addToast("info", "Export is disabled in read-only mode");
      return;
    }
    const state = usePlannerStore.getState();
    const filename = state.projectName.replace(/\s+/g, "-") || "floor-plan";
    const minimumWidth = 1920;

    if (state.show3D) {
      const canvas = document.querySelector("[data-engine] canvas, canvas[data-engine]") as HTMLCanvasElement | null;
      if (canvas) {
        const url = canvas.toDataURL("image/png");
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${filename}.png`;
        anchor.click();
        addToast("success", "PNG exported (3D view)");
        return;
      }
    }

    const editor = getTldrawEditor();
    if (editor) {
      try {
        const { exportAs } = await import("tldraw");
        const ids = editor.getCurrentPageShapes().map((shape) => shape.id);
        if (ids.length === 0) {
          addToast("error", "Nothing to export - add some shapes first");
          return;
        }

        const bounds = editor.getSelectionPageBounds() ?? editor.getCurrentPageBounds();
        let scale = 2;
        if (bounds && bounds.width > 0) {
          scale = Math.max(2, Math.ceil(minimumWidth / bounds.width));
        }

        await exportAs(editor, ids, { format: "png", name: filename, scale });
        addToast("success", "PNG exported");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "unknown error";
        addToast("error", `PNG export failed: ${message}`);
      }
      return;
    }

    try {
      const { exportPNG } = await import("../../lib/export/exportPNG");
      exportPNG(state.projectName, state.walls, state.rooms, state.furniture, state.doors, state.windows, minimumWidth);
      addToast("success", "PNG exported");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "unknown error";
      addToast("error", `PNG export failed: ${message}`);
    }
  };

  const handleExportPDF = async () => {
    if (readOnly) {
      addToast("info", "Export is disabled in read-only mode");
      return;
    }
    const state = usePlannerStore.getState();
    try {
      await exportPDF(state.projectName, state.walls, state.rooms, state.furniture, state.doors, state.windows);
      addToast("success", "PDF blueprint exported");
    } catch {
      addToast("error", "Failed to export PDF");
    }
  };

  const handleExportSVG = () => {
    if (readOnly) {
      addToast("info", "Export is disabled in read-only mode");
      return;
    }
    const state = usePlannerStore.getState();
    try {
      const result = exportSVG(state.projectName, state.walls, state.rooms, state.furniture, state.doors, state.windows);
      addToast(result ? "success" : "error", result ? "SVG floor plan exported" : "No floor plan data to export");
    } catch {
      addToast("error", "Failed to export SVG");
    }
  };

  const handleExportBOQ = async () => {
    if (readOnly) {
      addToast("info", "Export is disabled in read-only mode");
      return;
    }
    const state = usePlannerStore.getState();
    try {
      const boq = generateBOQ(state.furniture, state.doors, state.windows, state.walls, state.rooms);
      
      const { exportBoqToPdf } = await import("@/features/planner/shared/export/pdfExport");
      
      const rows = boq.categories.flatMap((cat) => 
        cat.items.map((item) => ({
          name: item.name,
          category: cat.category,
          quantity: item.quantity,
          widthCm: item.widthMm / 10,
          depthCm: item.depthMm / 10,
          heightCm: item.heightMm / 10,
          spec: item.sku
        }))
      );

      const layout = {
        projectName: state.projectName,
        clientName: "", // Could be added to planner state later
        preparedBy: "Oando Suite",
        roomWidthMm: state.rooms.length > 0 ? 0 : 0, // Placeholder
        roomDepthMm: 0,
        generatedAt: new Date().toISOString(),
        unitSystem: "metric" as const,
      };

      await exportBoqToPdf({ layout, rows });
      addToast("success", "Branded PDF BOQ exported");
    } catch (e) {
      console.error(e);
      addToast("error", "Failed to export PDF BOQ");
    }
  };

  const handleExportBOQJSON = () => {
    if (readOnly) {
      addToast("info", "Export is disabled in read-only mode");
      return;
    }
    const state = usePlannerStore.getState();
    try {
      const boq = generateBOQ(state.furniture, state.doors, state.windows, state.walls, state.rooms);
      exportBOQJSON(state.projectName, boq);
      addToast("success", "BOQ exported as JSON");
    } catch {
      addToast("error", "Failed to export BOQ JSON");
    }
  };

  const handleShare = () => {
    if (readOnly) {
      addToast("info", "Share is disabled in read-only mode");
      return;
    }
    const state = usePlannerStore.getState();
    const url = encodeProjectToURL(buildSharePayload(state));
    setShareURL(url);
    setShareCopied(false);
    setShareModalOpen(true);
  };

  const handlePublishToPortal = async () => {
    if (readOnly) {
      addToast("info", "Publish is disabled in read-only mode");
      return;
    }
    let state = usePlannerStore.getState();
    if (!state.currentProjectKey) {
      state.saveProject();
      state = usePlannerStore.getState();
    }

    const projectId = resolvePortalProjectId(state.currentProjectKey);
    const newKey = `planner_${projectId}`;

    addToast("info", "Publishing plan to portal...");

    try {
      await syncSavedProjectToSupabase("active");
      usePlannerStore.setState({ currentProjectKey: newKey });

      const portalURL = `${window.location.origin}/portal/${projectId}`;
      setShareURL(portalURL);
      setShareCopied(false);
      setShareModalOpen(true);
      addToast("success", "Published to Client Portal!");
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Unknown error";
      addToast("error", `Failed to publish: ${message}`);
    }
  };

  const handleCopyShareURL = async () => {
    const copied = await copyToClipboard(shareURL);
    if (copied) {
      setShareCopied(true);
      addToast("success", "Share link copied to clipboard");
      setTimeout(() => setShareCopied(false), 2500);
      return;
    }
    addToast("error", "Failed to copy link");
  };

  const handleImport = () => {
    if (readOnly) {
      addToast("info", "Import is disabled in read-only mode");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleImportImage = () => {
    if (readOnly) {
      addToast("info", "Import is disabled in read-only mode");
      return;
    }
    imageInputRef.current?.click();
  };

  const handleImageImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      addToast("error", "PDF files must first be converted to an image format (PNG/JPG). Please use a PDF-to-image converter and try again.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const url = loadEvent.target?.result as string;
      const image = new Image();
      image.onload = () => {
        usePlannerStore.getState().setBackgroundImage({
          url,
          x: 0,
          y: 0,
          width: image.naturalWidth,
          height: image.naturalHeight,
          scale: 1,
          opacity: 0.5,
          isCalibrating: true,
          isLocked: false,
          calibrationPoints: [],
          calibrationDistanceMm: 3000,
        });
        addToast("info", "Floor plan image loaded. Please click two reference points to calibrate scale.");
      };
      image.onerror = () => {
        addToast("error", "Failed to load image file. Please try a different file.");
      };
      image.src = url;
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) {
      addToast("info", "Import is disabled in read-only mode");
      event.target.value = "";
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const data = JSON.parse(loadEvent.target?.result as string);
        const validation = validateImportedProject(data);
        if (!validation.valid) {
          const errorMessage = validation.errors.slice(0, 3).join("; ");
          addToast("error", `Invalid project file: ${errorMessage}`);
          return;
        }

        if (confirm("Import this project? Current unsaved changes will be lost.")) {
          usePlannerStore.setState(normalizeImportedProject(data));
          addToast("success", "Project imported");
        }
      } catch {
        addToast("error", "Failed to parse JSON file. Make sure it is valid JSON.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleNewProject = () => {
    if (readOnly) {
      addToast("info", "New project is disabled in read-only mode");
      return;
    }
    if (!confirm("Start a new project? Unsaved changes will be lost.")) return;
    clearAll();
    usePlannerStore.setState({ projectName: "Untitled Project" });
    addToast("info", "New project created");
  };

  return {
    fileInputRef,
    imageInputRef,
    shareModalOpen,
    setShareModalOpen,
    shareURL,
    shareCopied,
    handleSave,
    handleExportJSON,
    handleExportPNG,
    handleExportPDF,
    handleExportSVG,
    handleExportBOQ,
    handleExportBOQJSON,
    handleShare,
    handlePublishToPortal,
    handleCopyShareURL,
    handleImport,
    handleImportImage,
    handleImageImport,
    handleFileChange,
    handleNewProject,
  };
}
