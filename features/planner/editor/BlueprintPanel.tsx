"use client";

import { useCallback, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  FileImage,
  ImageIcon,
  Loader2,
  Move,
  Ruler,
  Shrink,
  Trash2,
} from "lucide-react";

import { usePlannerWorkspaceStore } from "../store/workspaceStore";
import { getPdfPageCount, pdfPageToDataUrl } from "@/features/planner/lib/blueprintPdf";
import { validateBlueprintImportFile } from "@/features/planner/editor/blueprintImport";
import { clampBlueprintPdfPage } from "@/features/planner/editor/blueprintPdfSession";
import {
  clampBlueprintScale,
  formatBlueprintScalePercent,
  nudgeBlueprintOffset,
} from "@/features/planner/editor/blueprintTransform";

interface BlueprintPanelProps {
  guestMode?: boolean;
  embedded?: boolean;
}

export function BlueprintPanel({ guestMode = false, embedded = false }: BlueprintPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [pdfSession, setPdfSession] = useState<{
    data: ArrayBuffer;
    pageCount: number;
  } | null>(null);
  const blueprint = usePlannerWorkspaceStore((s) => s.blueprint);
  const setBlueprint = usePlannerWorkspaceStore((s) => s.setBlueprint);
  const resetBlueprint = usePlannerWorkspaceStore((s) => s.resetBlueprint);
  const layerVisible = usePlannerWorkspaceStore((s) => s.layerVisible.underlay);
  const toggleLayer = usePlannerWorkspaceStore((s) => s.toggleLayer);

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (guestMode) return;

      const validation = validateBlueprintImportFile(file);
      if (!validation.ok) {
        if (validation.reason === "too-large") {
          setImportMessage("Blueprint files must be 8 MB or smaller.");
        } else if (validation.reason === "unsupported") {
          setImportMessage("Use PNG, JPG, WebP, or PDF for blueprint underlays.");
        }
        return;
      }
      const selectedFile = file;
      if (!selectedFile) return;

      setImportMessage(null);
      setIsImporting(true);

      const applyBlueprintDataUrl = (
        dataUrl: string,
        options?: {
          message?: string | null;
          sourceKind?: "image" | "pdf";
          sourcePage?: number | null;
          sourcePageCount?: number | null;
        },
      ) => {
        const img = new window.Image();
        img.onload = () => {
          setBlueprint({
            dataUrl,
            sourceKind: options?.sourceKind ?? "image",
            sourcePage: options?.sourcePage ?? null,
            sourcePageCount: options?.sourcePageCount ?? null,
            interactionMode: "idle",
            widthPx: img.naturalWidth,
            heightPx: img.naturalHeight,
            x: 0,
            y: 0,
            scale: 1,
            mmPerUnit: null,
            calibrating: true,
            calibrationPoints: [],
          });
          setImportMessage(options?.message ?? null);
          setIsImporting(false);
        };
        img.onerror = () => {
          setImportMessage("Blueprint image could not be loaded.");
          setIsImporting(false);
        };
        img.src = dataUrl;
      };

      if (validation.kind === "pdf") {
        try {
          const data = await selectedFile.arrayBuffer();
          const pageCount = await getPdfPageCount(data);
          const pageNum = 1;
          const dataUrl = await pdfPageToDataUrl(data, pageNum, 2);
          setPdfSession({ data, pageCount });
          applyBlueprintDataUrl(
            dataUrl,
            {
              sourceKind: "pdf",
              sourcePage: pageNum,
              sourcePageCount: pageCount,
              message:
                pageCount > 1
                  ? `Imported PDF page 1 of ${pageCount} as the blueprint underlay.`
                  : "Imported PDF blueprint underlay.",
            },
          );
        } catch {
          setImportMessage("That PDF blueprint could not be rendered.");
          setIsImporting(false);
        }
        return;
      }

      setPdfSession(null);

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : null;
        if (!dataUrl) {
          setImportMessage("Blueprint image could not be read.");
          setIsImporting(false);
          return;
        }
        applyBlueprintDataUrl(dataUrl, {
          sourceKind: "image",
          sourcePage: null,
          sourcePageCount: null,
          message: "Imported image blueprint underlay.",
        });
      };
      reader.onerror = () => {
        setImportMessage("Blueprint image could not be read.");
        setIsImporting(false);
      };
      reader.readAsDataURL(selectedFile);
    },
    [guestMode, setBlueprint],
  );

  const handleRemoveBlueprint = useCallback(() => {
    setPdfSession(null);
    setImportMessage(null);
    resetBlueprint();
  }, [resetBlueprint]);

  const handlePdfPageChange = useCallback(
    async (nextPageInput: number) => {
      if (!pdfSession) {
        setImportMessage("Reimport the PDF blueprint to switch pages in this session.");
        return;
      }

      const nextPage = clampBlueprintPdfPage(nextPageInput, pdfSession.pageCount);
      setIsImporting(true);
      setImportMessage(null);

      try {
        const dataUrl = await pdfPageToDataUrl(pdfSession.data, nextPage, 2);
        const img = new window.Image();
        img.onload = () => {
          setBlueprint({
            dataUrl,
            sourceKind: "pdf",
            sourcePage: nextPage,
            sourcePageCount: pdfSession.pageCount,
            interactionMode: "idle",
            widthPx: img.naturalWidth,
            heightPx: img.naturalHeight,
            x: 0,
            y: 0,
            scale: 1,
            mmPerUnit: null,
            calibrating: true,
            calibrationPoints: [],
          });
          setImportMessage(`Showing PDF page ${nextPage} of ${pdfSession.pageCount}. Recalibrate after switching pages.`);
          setIsImporting(false);
        };
        img.onerror = () => {
          setImportMessage("That PDF page could not be loaded.");
          setIsImporting(false);
        };
        img.src = dataUrl;
      } catch {
        setImportMessage("That PDF page could not be rendered.");
        setIsImporting(false);
      }
    },
    [pdfSession, setBlueprint],
  );

  return (
    <div className={`flex h-full flex-col overflow-y-auto ${embedded ? "p-3" : "border-b border-soft px-3 py-2"}`}>
      {!embedded && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="typ-label text-muted">Blueprint</span>
        </div>
      )}

      <p className="text-xs leading-relaxed text-soft">
        {guestMode
          ? "Sign in to import a floor plan image as an underlay."
          : "Import a floor plan image or PDF, then calibrate scale for accurate dimensions."}
      </p>

      <div className="mt-3 flex items-center gap-2">
        {!guestMode && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="pw-icon-btn"
            disabled={isImporting}
          >
            {isImporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <ImageIcon className="h-3.5 w-3.5" aria-hidden />
            )}
            {isImporting ? "Importing..." : "Import image or PDF"}
          </button>
        )}
        {blueprint.dataUrl && (
          <button
            type="button"
            onClick={handleRemoveBlueprint}
            className="pw-icon-btn"
            aria-label="Remove blueprint"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf,.pdf"
        className="hidden"
        onChange={handleImport}
      />

      {importMessage ? (
        <div className="mt-3 rounded-xl border border-soft bg-[var(--surface-soft)] px-3 py-2 text-xs text-soft">
          <div className="flex items-start gap-2">
            <FileImage className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <p>{importMessage}</p>
          </div>
        </div>
      ) : null}

      {blueprint.dataUrl && (
        <div className="mt-4 space-y-3 rounded-xl border border-soft bg-[var(--surface-soft)] p-3">
          <label className="pw-layer-row">
            <input
              type="checkbox"
              checked={layerVisible}
              onChange={() => toggleLayer("underlay")}
            />
            Show underlay on canvas
          </label>

          {blueprint.sourceKind === "pdf" && blueprint.sourcePage && blueprint.sourcePageCount ? (
            (() => {
              const currentPage = blueprint.sourcePage;
              const pageCount = blueprint.sourcePageCount;
              return (
                <div className="space-y-2 rounded-xl border border-soft bg-panel px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-strong">
                      PDF page {currentPage} of {pageCount}
                    </span>
                    {pdfSession ? (
                      <span className="text-[11px] text-muted">Session navigation enabled</span>
                    ) : (
                      <span className="text-[11px] text-muted">Reimport to change page</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePdfPageChange(currentPage - 1)}
                      disabled={isImporting || !pdfSession || currentPage <= 1}
                      className="pw-icon-btn justify-center"
                      aria-label="Previous PDF page"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={pageCount}
                      value={currentPage}
                      onChange={(ev) => {
                        const nextValue = Number(ev.target.value);
                        if (!Number.isFinite(nextValue)) return;
                        void handlePdfPageChange(nextValue);
                      }}
                      disabled={isImporting || !pdfSession}
                      className="w-20 rounded-lg border border-soft bg-panel px-2 py-1 text-xs text-strong outline-none focus:border-[var(--color-primary)] disabled:opacity-50"
                      aria-label="PDF page number"
                    />
                    <button
                      type="button"
                      onClick={() => handlePdfPageChange(currentPage + 1)}
                      disabled={isImporting || !pdfSession || currentPage >= pageCount}
                      className="pw-icon-btn justify-center"
                      aria-label="Next PDF page"
                    >
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                </div>
              );
            })()
          ) : null}

          <label className="block text-xs text-muted">
            Opacity
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={blueprint.opacity}
              onChange={(ev) => setBlueprint({ opacity: Number(ev.target.value) })}
              className="mt-1.5 w-full accent-[var(--color-primary)]"
            />
          </label>

          <label className="block text-xs text-muted">
            Underlay scale
            <input
              type="range"
              min={0.25}
              max={4}
              step={0.05}
              value={blueprint.scale}
              onChange={(ev) => setBlueprint({ scale: clampBlueprintScale(Number(ev.target.value)) })}
              className="mt-1.5 w-full accent-[var(--color-primary)]"
            />
            <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-muted">
              <span>{formatBlueprintScalePercent(blueprint.scale)}</span>
              <input
                type="number"
                min={25}
                max={400}
                step={5}
                value={Math.round(blueprint.scale * 100)}
                onChange={(ev) =>
                  setBlueprint({
                    scale: clampBlueprintScale((Number(ev.target.value) || 100) / 100),
                  })
                }
                className="w-20 rounded-lg border border-soft bg-panel px-2 py-1 text-xs text-strong outline-none focus:border-[var(--color-primary)]"
                aria-label="Blueprint scale percent"
              />
            </div>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setBlueprint({ calibrating: true, calibrationPoints: [] })}
              className="pw-icon-btn"
            >
              <Ruler className="h-3.5 w-3.5" aria-hidden />
              Calibrate
            </button>
            <button
              type="button"
              onClick={() =>
                setBlueprint({
                  interactionMode: blueprint.interactionMode === "move" ? "idle" : "move",
                })
              }
              className="pw-icon-btn"
            >
              <Move className="h-3.5 w-3.5" aria-hidden />
              {blueprint.interactionMode === "move" ? "Finish move" : "Move on canvas"}
            </button>
            <input
              type="number"
              min={100}
              step={100}
              value={blueprint.knownDistanceMm}
              onChange={(ev) =>
                setBlueprint({ knownDistanceMm: Number(ev.target.value) || 3000 })
              }
              className="w-24 rounded-lg border border-soft bg-panel px-2 py-1.5 text-xs text-strong outline-none focus:border-[var(--color-primary)]"
              aria-label="Known distance in millimetres"
            />
            <span className="text-xs text-muted">mm</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted">Position</span>
              <button
                type="button"
                onClick={() => setBlueprint({ x: 0, y: 0, scale: 1 })}
                className="pw-icon-btn"
              >
                <Shrink className="h-3.5 w-3.5" aria-hidden />
                Reset transform
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div />
              <button
                type="button"
                onClick={() => setBlueprint(nudgeBlueprintOffset(blueprint, "up"))}
                className="pw-icon-btn justify-center"
                aria-label="Nudge blueprint up"
              >
                <ArrowUp className="h-3.5 w-3.5" aria-hidden />
              </button>
              <div />
              <button
                type="button"
                onClick={() => setBlueprint(nudgeBlueprintOffset(blueprint, "left"))}
                className="pw-icon-btn justify-center"
                aria-label="Nudge blueprint left"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setBlueprint({ x: 0, y: 0 })}
                className="pw-icon-btn justify-center"
                aria-label="Center blueprint offsets"
              >
                0,0
              </button>
              <button
                type="button"
                onClick={() => setBlueprint(nudgeBlueprintOffset(blueprint, "right"))}
                className="pw-icon-btn justify-center"
                aria-label="Nudge blueprint right"
              >
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </button>
              <div />
              <button
                type="button"
                onClick={() => setBlueprint(nudgeBlueprintOffset(blueprint, "down"))}
                className="pw-icon-btn justify-center"
                aria-label="Nudge blueprint down"
              >
                <ArrowDown className="h-3.5 w-3.5" aria-hidden />
              </button>
              <div />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted">
              Offset X
              <input
                type="number"
                value={Math.round(blueprint.x)}
                onChange={(ev) => setBlueprint({ x: Number(ev.target.value) || 0 })}
                className="mt-1 w-full rounded-lg border border-soft bg-panel px-2 py-1.5 text-xs text-strong outline-none focus:border-[var(--color-primary)]"
              />
            </label>
            <label className="text-xs text-muted">
              Offset Y
              <input
                type="number"
                value={Math.round(blueprint.y)}
                onChange={(ev) => setBlueprint({ y: Number(ev.target.value) || 0 })}
                className="mt-1 w-full rounded-lg border border-soft bg-panel px-2 py-1.5 text-xs text-strong outline-none focus:border-[var(--color-primary)]"
              />
            </label>
          </div>

          {blueprint.mmPerUnit && (
            <p className="text-xs text-muted">
              Scale: {blueprint.mmPerUnit.toFixed(2)} mm per canvas unit
              {" · "}
              {(blueprint.mmPerUnit * 100).toFixed(0)} mm per metre on plan
            </p>
          )}
          {blueprint.calibrating && (
            <p className="text-xs font-medium text-[var(--color-primary)]">
              Click two points on the plan whose distance you know.
            </p>
          )}
          {blueprint.interactionMode === "move" && !blueprint.calibrating && (
            <p className="text-xs font-medium text-[var(--color-primary)]">
              Drag directly on the canvas to reposition the blueprint underlay.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
