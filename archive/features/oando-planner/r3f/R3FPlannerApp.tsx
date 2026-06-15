"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { PlannerEnvironment } from "./meshes/PlannerEnvironment";
import type { CatalogItem } from "@/features/planner/shared/catalog/types";
import { PlannerScene } from "./PlannerScene";
import { PlannerCamera } from "./PlannerCamera";
import { FurnitureLayer } from "./FurnitureLayer";
import { CatalogSidebar } from "./ui/CatalogSidebar";
import { PlannerHeader } from "./ui/PlannerHeader";
import { SecondaryToolbar } from "./ui/SecondaryToolbar";
import { R3FInspectorPanel } from "./ui/R3FInspectorPanel";
import { RoomPresetsModal } from "./ui/RoomPresetsModal";
import { ExportModal } from "./ui/ExportModal";
import { ShortcutsModal } from "./ui/ShortcutsModal";
import { WalkOverlay } from "./ui/WalkOverlay";
import { AutoFurnishModal } from "./ui/AutoFurnishModal";
import { CameraPresetsPanel, type CameraPreset } from "./ui/CameraPresetsPanel";
import { usePlannerR3FStore } from "./usePlannerR3FStore";
import { buildBoq } from "@/features/planner/shared/boq/buildBoq";
import { exportBoqToCsv, downloadCsv } from "@/features/planner/shared/export/exportBoqCsv";
import { buildPlannerGuestSeed } from "@/features/oando-planner/guest/plannerGuestSeed";

function checkWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function WebGLUnavailable() {
  return (
    <div className="flex h-full items-center justify-center bg-neutral-50 p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <svg className="h-8 w-8 text-red-400" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-neutral-800 mb-2">WebGL Not Available</h2>
        <p className="text-[13px] text-neutral-600 mb-4 leading-relaxed">
          The 3D planner requires WebGL support, which your browser or device does not currently support.
        </p>
        <div className="rounded-xl bg-neutral-100 p-4 text-left text-[12px] text-neutral-600 mb-5 space-y-2">
          <p className="font-semibold text-neutral-700">Try these fixes:</p>
          <ul className="space-y-1 list-disc pl-4">
            <li>Update your browser to the latest version</li>
            <li>Enable hardware acceleration in browser settings</li>
            <li>Update your graphics card drivers</li>
            <li>Try a different browser (Chrome, Firefox, Edge)</li>
          </ul>
        </div>
        <Link
          href="/planner/guest"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-500 transition-colors"
        >
          Open Guest Planner
        </Link>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center bg-neutral-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-500" />
        <p className="text-[13px] text-neutral-500">Loading 3D planner...</p>
      </div>
    </div>
  );
}

function useKeyboardShortcuts(onShowShortcuts: () => void) {
  const undo = usePlannerR3FStore((s) => s.undo);
  const redo = usePlannerR3FStore((s) => s.redo);
  const selectedId = usePlannerR3FStore((s) => s.selectedId);
  const removeItem = usePlannerR3FStore((s) => s.removeItem);
  const removeSelected = usePlannerR3FStore((s) => s.removeSelected);
  const duplicateItem = usePlannerR3FStore((s) => s.duplicateItem);
  const clearSelection = usePlannerR3FStore((s) => s.clearSelection);
  const selectedIds = usePlannerR3FStore((s) => s.selectedIds);
  const cameraMode = usePlannerR3FStore((s) => s.cameraMode);
  const setCameraMode = usePlannerR3FStore((s) => s.setCameraMode);
  const setPlannerMode = usePlannerR3FStore((s) => s.setPlannerMode);
  const toggleSnap = usePlannerR3FStore((s) => s.toggleSnap);
  const toggleWalls = usePlannerR3FStore((s) => s.toggleWalls);
  const setTransformMode = usePlannerR3FStore((s) => s.setTransformMode);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (cameraMode === "walk") {
        if (e.key === "Escape") {
          e.preventDefault();
          setPlannerMode("layout");
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length > 1) {
          e.preventDefault();
          removeSelected();
        } else if (selectedId) {
          e.preventDefault();
          removeItem(selectedId);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        if (selectedId) {
          e.preventDefault();
          duplicateItem(selectedId);
        }
      }
      if (e.key === "Escape") {
        clearSelection();
      }

      if (e.key === "1") setCameraMode("orbit");
      if (e.key === "2") setCameraMode("top-down");
      if (e.key === "3") {
        setCameraMode("walk");
        setPlannerMode("walk");
      }

      if (e.key === "g" || e.key === "G") setTransformMode("translate");
      if (e.key === "r" && !e.metaKey && !e.ctrlKey) setTransformMode("rotate");
      if (e.key === "s" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toggleSnap();
      }
      if (e.key === "w" && !e.metaKey && !e.ctrlKey) {
        toggleWalls();
      }
      if (e.key === "?") {
        onShowShortcuts();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [
    undo, redo, selectedId, selectedIds, removeItem, removeSelected,
    duplicateItem, clearSelection, cameraMode, setCameraMode,
    setPlannerMode, toggleSnap, toggleWalls, setTransformMode,
    onShowShortcuts,
  ]);
}

function useBuildBoq(items: ReturnType<typeof usePlannerR3FStore.getState>["items"], catalog: CatalogItem[]) {
  return useCallback(() => {
    const catalogMap = new Map(catalog.map((c) => [c.id, c]));
    const placedItems = items.map((i) => ({
      catalogId: i.catalogId,
      name: i.name,
      category: i.category,
      widthCm: i.widthMm / 10,
      depthCm: i.depthMm / 10,
      heightCm: i.heightMm / 10,
    }));
    return buildBoq(placedItems, catalogMap);
  }, [items, catalog]);
}

export function R3FPlannerApp({
  catalog,
  guestMode = false,
}: {
  catalog: CatalogItem[];
  guestMode?: boolean;
}) {
  const items = usePlannerR3FStore((s) => s.items);
  const room = usePlannerR3FStore((s) => s.room);
  const cameraMode = usePlannerR3FStore((s) => s.cameraMode);
  const plannerMode = usePlannerR3FStore((s) => s.plannerMode);
  const [webglOk] = useState(() => checkWebGL());
  const [showExport, setShowExport] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAutoFurnish, setShowAutoFurnish] = useState(false);
  const [cameraPresets, setCameraPresets] = useState<CameraPreset[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [saveToast, setSaveToast] = useState<string | null>(null);

  const getBoq = useBuildBoq(items, catalog);

  useKeyboardShortcuts(() => setShowShortcuts(true));

  const handleSave = useCallback(() => {
    if (guestMode) {
      setSaveToast("Save is disabled in guest mode");
      setTimeout(() => setSaveToast(null), 2000);
      return;
    }
    try {
      const state = usePlannerR3FStore.getState();
      const saveData = {
        room: state.room,
        items: state.items,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem("r3f-planner-save", JSON.stringify(saveData));
      setSaveToast("Plan saved");
      setTimeout(() => setSaveToast(null), 2000);
    } catch {
      setSaveToast("Save failed");
      setTimeout(() => setSaveToast(null), 2000);
    }
  }, [guestMode]);

  useEffect(() => {
    if (guestMode) {
      const seed = buildPlannerGuestSeed(catalog);
      usePlannerR3FStore.setState({
        room: seed.room,
        items: seed.items.map((item, index) => ({
          ...item,
          id: `guest-seed-${index + 1}`,
        })),
        selectedId: null,
        selectedIds: [],
        plannerMode: "layout",
        showRoomPresets: false,
        roomPresetApplied: true,
        undoStack: [],
        redoStack: [],
      });
      usePlannerR3FStore.getState().clearSelection();
      return;
    }

    try {
      const saved = localStorage.getItem("r3f-planner-save");
      if (saved && items.length === 0) {
        const data = JSON.parse(saved);
        if (data.room) usePlannerR3FStore.getState().setRoom(data.room);
        if (Array.isArray(data.items) && data.items.length > 0) {
          for (const item of data.items) {
            usePlannerR3FStore.getState().addItem(item);
          }
          usePlannerR3FStore.getState().setSelectedId(null);
          usePlannerR3FStore.getState().setShowRoomPresets(false);
        }
      }
    } catch {
      // ignore invalid saved data
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog, guestMode]);

  useEffect(() => {
    if (guestMode && plannerMode === "export") {
      usePlannerR3FStore.getState().setPlannerMode("layout");
    }
  }, [guestMode, plannerMode]);

  const handleExportBoq = useCallback(() => {
    const boq = getBoq();
    const csv = exportBoqToCsv(boq, {
      projectName: "Planner Layout",
      roomWidthMm: room.widthMm,
      roomDepthMm: room.depthMm,
      unitSystem: "metric",
      generatedAt: new Date().toISOString(),
    });
    downloadCsv(csv, `boq-${Date.now()}.csv`);
  }, [getBoq, room]);

  const handleHeaderExport = useCallback(() => {
    setShowExport(true);
  }, []);

  const handleCapturePanorama = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const store = usePlannerR3FStore.getState();
    const liveState = store.liveCameraState;
    const roomW = store.room.widthMm / 1000;
    const roomD = store.room.depthMm / 1000;
    const centerX = liveState ? liveState.target[0] : roomW / 2;
    const centerY = liveState ? liveState.position[1] : roomW * 0.6;
    const centerZ = liveState ? liveState.target[2] : roomD / 2;

    const cubeFaces = [
      { label: "px", target: [1, 0, 0], up: [0, 1, 0] },
      { label: "nx", target: [-1, 0, 0], up: [0, 1, 0] },
      { label: "py", target: [0, 1, 0], up: [0, 0, -1] },
      { label: "ny", target: [0, -1, 0], up: [0, 0, 1] },
      { label: "pz", target: [0, 0, 1], up: [0, 1, 0] },
      { label: "nz", target: [0, 0, -1], up: [0, 1, 0] },
    ] as const;

    setSaveToast("Rendering equirectangular panorama...");

    let faceIndex = 0;
    const faceImages: Record<string, HTMLCanvasElement> = {};

    const captureNextFace = () => {
      if (faceIndex >= cubeFaces.length) {
        const faceSize = faceImages["px"]?.width ?? canvas.width;
        const eqWidth = faceSize * 2;
        const eqHeight = faceSize;
        const eqCanvas = document.createElement("canvas");
        eqCanvas.width = eqWidth;
        eqCanvas.height = eqHeight;
        const eqCtx = eqCanvas.getContext("2d");

        if (eqCtx) {
          const faceData: Record<string, ImageData> = {};
          for (const key of Object.keys(faceImages)) {
            const fCtx = faceImages[key].getContext("2d");
            if (fCtx) faceData[key] = fCtx.getImageData(0, 0, faceSize, faceSize);
          }

          const eqImageData = eqCtx.createImageData(eqWidth, eqHeight);
          const out = eqImageData.data;

          for (let py = 0; py < eqHeight; py++) {
            const theta = ((py / eqHeight) - 0.5) * Math.PI;
            const cosTheta = Math.cos(theta);
            const sinTheta = Math.sin(theta);

            for (let px = 0; px < eqWidth; px++) {
              const phi = ((px / eqWidth) - 0.5) * 2 * Math.PI;
              const x3d = cosTheta * Math.sin(phi);
              const y3d = sinTheta;
              const z3d = cosTheta * Math.cos(phi);

              const absX = Math.abs(x3d);
              const absY = Math.abs(y3d);
              const absZ = Math.abs(z3d);

              let face: string;
              let u: number;
              let v: number;

              if (absX >= absY && absX >= absZ) {
                if (x3d > 0) { face = "px"; u = -z3d / absX; v = -y3d / absX; }
                else { face = "nx"; u = z3d / absX; v = -y3d / absX; }
              } else if (absY >= absX && absY >= absZ) {
                if (y3d > 0) { face = "py"; u = x3d / absY; v = z3d / absY; }
                else { face = "ny"; u = x3d / absY; v = -z3d / absY; }
              } else {
                if (z3d > 0) { face = "pz"; u = x3d / absZ; v = -y3d / absZ; }
                else { face = "nz"; u = -x3d / absZ; v = -y3d / absZ; }
              }

              const fu = Math.round(((u + 1) / 2) * (faceSize - 1));
              const fv = Math.round(((v + 1) / 2) * (faceSize - 1));

              const srcData = faceData[face];
              if (srcData) {
                const si = (fv * faceSize + fu) * 4;
                const di = (py * eqWidth + px) * 4;
                out[di] = srcData.data[si];
                out[di + 1] = srcData.data[si + 1];
                out[di + 2] = srcData.data[si + 2];
                out[di + 3] = srcData.data[si + 3];
              }
            }
          }

          eqCtx.putImageData(eqImageData, 0, 0);

          const link = document.createElement("a");
          link.download = `panorama-equirectangular-${Date.now()}.png`;
          link.href = eqCanvas.toDataURL("image/png");
          link.click();
        }

        setSaveToast("Equirectangular panorama exported");
        setTimeout(() => setSaveToast(null), 2000);
        if (liveState) {
          store.applyCameraPreset({
            position: liveState.position,
            target: liveState.target,
            fov: liveState.fov,
          });
        }
        return;
      }

      const face = cubeFaces[faceIndex];
      store.applyCameraPreset({
        position: [centerX, centerY, centerZ],
        target: [centerX + face.target[0], centerY + face.target[1], centerZ + face.target[2]],
        fov: 90,
      });

      setTimeout(() => {
        try {
          const faceCanvas = document.createElement("canvas");
          faceCanvas.width = canvas.width;
          faceCanvas.height = canvas.height;
          const faceCtx = faceCanvas.getContext("2d");
          if (faceCtx) faceCtx.drawImage(canvas, 0, 0);
          faceImages[face.label] = faceCanvas;
        } catch {
          // skip face
        }
        faceIndex++;
        captureNextFace();
      }, 400);
    };

    captureNextFace();
  }, []);

  if (!webglOk) return <WebGLUnavailable />;

  return (
    <div className="relative flex h-full w-full flex-col bg-neutral-100">
      <PlannerHeader
        onSave={guestMode ? undefined : handleSave}
        onExport={guestMode ? undefined : handleHeaderExport}
        guestMode={guestMode}
      />
      <SecondaryToolbar onAutoFurnish={guestMode ? undefined : () => setShowAutoFurnish(true)} />

      <div className="relative flex flex-1 min-h-0 md:flex-row">
        <CatalogSidebar catalog={catalog} />

        <div className="relative flex-1 min-w-0">
          {cameraMode === "walk" && <WalkOverlay />}

          <CameraPresetsPanel
            presets={cameraPresets}
            onPresetsChange={setCameraPresets}
            onCapturePanorama={
              guestMode
                ? () => {
                    setSaveToast("Export is disabled in guest mode");
                    setTimeout(() => setSaveToast(null), 2000);
                  }
                : handleCapturePanorama
            }
            canvasRef={canvasRef}
            allowExport={!guestMode}
          />

          <div className="h-full">
            <Suspense fallback={<LoadingFallback />}>
              <Canvas
                ref={canvasRef}
                shadows
                gl={{ antialias: true, toneMapping: 3, preserveDrawingBuffer: true }}
                dpr={[1, 2]}
                style={{ background: "var(--surface-panel)" }}
              >
                <PlannerEnvironment />
                <PlannerCamera />
                <PlannerScene />
                <FurnitureLayer />
              </Canvas>
            </Suspense>
          </div>
        </div>

        <R3FInspectorPanel
          onExportBoq={!guestMode && items.length > 0 ? handleExportBoq : undefined}
        />
      </div>

      <RoomPresetsModal />
      <ExportModal
        open={showExport || plannerMode === "export"}
        onClose={() => {
          setShowExport(false);
          if (plannerMode === "export") {
            usePlannerR3FStore.getState().setPlannerMode("layout");
          }
        }}
        catalog={catalog}
        canvasRef={canvasRef}
        guestMode={guestMode}
      />
      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <AutoFurnishModal
        open={showAutoFurnish}
        onClose={() => setShowAutoFurnish(false)}
        catalog={catalog}
        guestMode={guestMode}
      />

      {saveToast && (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">
          {saveToast}
        </div>
      )}
    </div>
  );
}
