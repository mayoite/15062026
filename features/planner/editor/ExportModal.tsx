/**
 * ExportModal - Export plan with preset cards and format selection.
 *
 * Three branded presets (Proposal, Technical, Client) and format options
 * (PDF, SVG, PNG, JSON) with download and share-link actions. Preset accent
 * colors come from FOCSS tokens via data-preset CSS, not hardcoded hex.
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { X, FileText, Ruler, Presentation, Check, Loader2, Link2, Download } from "lucide-react";
import type { Editor } from "tldraw";

import type { ExportPresetId } from "@/features/planner/lib/exportPresets";
import { downloadPlannerBoqPdf, downloadPlannerJson } from "./exportActions";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
}

type ExportFormat = "pdf" | "svg" | "png" | "json";

type DownloadState = "idle" | "loading" | "success";

const PRESET_CARDS: {
  id: ExportPresetId;
  label: string;
  description: string;
  icon: typeof FileText;
}[] = [
  {
    id: "proposal",
    label: "Proposal",
    description: "Branded layout with logo for pitches",
    icon: FileText,
  },
  {
    id: "technical",
    label: "Technical",
    description: "Monochrome with dimensions and labels",
    icon: Ruler,
  },
  {
    id: "client-presentation",
    label: "Client",
    description: "Clean visual for client presentations",
    icon: Presentation,
  },
];

const FORMAT_OPTIONS: { id: ExportFormat; label: string }[] = [
  { id: "pdf", label: "PDF" },
  { id: "svg", label: "SVG" },
  { id: "png", label: "PNG" },
  { id: "json", label: "JSON" },
];

export function ExportModal({ isOpen, onClose, editor }: ExportModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<ExportPresetId>("proposal");
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf");
  const [downloadState, setDownloadState] = useState<DownloadState>("idle");
  const [linkCopied, setLinkCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap + Escape
  useEffect(() => {
    if (!isOpen) return;
    const modal = modalRef.current;
    if (!modal) return;

    const firstFocusable = modal.querySelector<HTMLElement>("button, [tabindex]");
    firstFocusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;

      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleDownload = useCallback(async () => {
    if (downloadState === "loading") return;
    setDownloadState("loading");

    try {
      if (selectedFormat === "json") {
        downloadPlannerJson(editor);
      } else if (selectedFormat === "pdf") {
        await downloadPlannerBoqPdf(editor, "Workspace Plan", selectedPreset);
      } else {
        // SVG/PNG: use tldraw built-in export
        const ids = editor.getCurrentPageShapeIds();
        if (ids.size > 0) {
          const svgEl = await (editor as unknown as { getSvg(ids: unknown[]): Promise<SVGElement | null> }).getSvg([...ids]);
          if (svgEl) {
            const svgString = new XMLSerializer().serializeToString(svgEl);
            if (selectedFormat === "svg") {
              const blob = new Blob([svgString], { type: "image/svg+xml" });
              triggerDownload(blob, "workspace-plan.svg");
            } else {
              // PNG via canvas
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              const img = new Image();
              await new Promise<void>((resolve, reject) => {
                img.onload = () => {
                  canvas.width = img.naturalWidth;
                  canvas.height = img.naturalHeight;
                  ctx?.drawImage(img, 0, 0);
                  resolve();
                };
                img.onerror = reject;
                img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
              });
              const pngBlob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
              if (pngBlob) triggerDownload(pngBlob, "workspace-plan.png");
            }
          }
        }
      }
      setDownloadState("success");
      setTimeout(() => setDownloadState("idle"), 2000);
    } catch {
      setDownloadState("idle");
    }
  }, [editor, selectedFormat, selectedPreset, downloadState]);

  const handleCopyLink = useCallback(() => {
    const hash = btoa(JSON.stringify({ preset: selectedPreset, format: selectedFormat, ts: Date.now() }));
    const url = `${window.location.origin}${window.location.pathname}#export=${hash}`;
    void navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, [selectedPreset, selectedFormat]);

  if (!isOpen) return null;

  return (
    <div
      className="pwx-modal-root"
      role="dialog"
      aria-modal="true"
      aria-label="Export your plan"
      ref={modalRef}
    >
      <button
        type="button"
        className="pwx-modal-backdrop modal-backdrop-enter"
        onClick={onClose}
        aria-label="Close dialog"
        tabIndex={-1}
      />

      <div className="pwx-modal pwx-modal--md modal-panel-enter">
        <div className="pwx-modal-header">
          <div>
            <h2 className="pwx-modal-title">
              <Download size={16} aria-hidden />
              Export your plan
            </h2>
            <p className="pwx-modal-sub">Pick a style preset and file format.</p>
          </div>
          <button type="button" onClick={onClose} className="pw-icon-btn" aria-label="Close">
            <X size={15} aria-hidden />
          </button>
        </div>

        <div className="pwx-modal-body custom-scrollbar">
          <div className="pwx-preset-row" role="group" aria-label="Export preset">
            {PRESET_CARDS.map(({ id, label, description, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="pwx-preset-card"
                data-preset={id}
                data-active={selectedPreset === id}
                aria-pressed={selectedPreset === id}
                onClick={() => setSelectedPreset(id)}
              >
                <span className="pwx-preset-bar" aria-hidden />
                <span className="pwx-preset-name">
                  <Icon size={13} aria-hidden />
                  {label}
                </span>
                <p className="pwx-preset-desc">{description}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="typ-label text-muted">Format</span>
            <div className="pw-segment" role="group" aria-label="File format">
              {FORMAT_OPTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className="pw-segment-btn"
                  data-active={selectedFormat === id}
                  aria-pressed={selectedFormat === id}
                  onClick={() => setSelectedFormat(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pwx-modal-footer">
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={downloadState === "loading"}
            className="btn-primary flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm disabled:opacity-70"
          >
            {downloadState === "loading" && <Loader2 size={14} className="animate-spin" aria-hidden />}
            {downloadState === "success" && <Check size={14} aria-hidden />}
            {downloadState === "idle" && "Download"}
            {downloadState === "loading" && "Exporting…"}
            {downloadState === "success" && "Downloaded!"}
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="btn-outline flex items-center gap-1.5 px-4 py-2.5 text-sm"
          >
            {linkCopied ? <Check size={14} aria-hidden /> : <Link2 size={14} aria-hidden />}
            {linkCopied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
