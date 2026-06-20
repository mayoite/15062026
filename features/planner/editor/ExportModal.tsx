/**
 * ExportModal - Export plan with preset cards and format selection.
 *
 * Three branded presets (Proposal, Technical, Client) and format options
 * (PDF, SVG, PNG, JSON) with download and share-link actions. Preset accent
 * colors come from FOCSS tokens via data-preset CSS, not hardcoded hex.
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  X,
  FileText,
  Ruler,
  Presentation,
  Check,
  Loader2,
  Link2,
  Download,
  Image,
  FileCode,
  AlertCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

import type { ExportPresetId } from "@/features/planner/lib/exportPresets";
import {
  PlannerExportError,
  describeExportScope,
  downloadPlannerBoqPdf,
  downloadPlannerJson,
  downloadPlannerPng,
  downloadPlannerSvg,
  getVectorExportShapeIds,
} from "./exportActions";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  editor?: null;
}

type ExportFormat = "pdf" | "svg" | "png" | "json";

type DownloadState = "idle" | "loading" | "success" | "error";

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

const FORMAT_OPTIONS: {
  id: ExportFormat;
  label: string;
  hint: string;
  icon: typeof FileText;
}[] = [
  { id: "pdf", label: "PDF", hint: "BOQ + plan preview", icon: FileText },
  { id: "svg", label: "SVG", hint: "Vector floor plan", icon: FileCode },
  { id: "png", label: "PNG", hint: "Raster snapshot", icon: Image },
  { id: "json", label: "JSON", hint: "Full session data", icon: Download },
];

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<ExportPresetId>("proposal");
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf");
  const [downloadState, setDownloadState] = useState<DownloadState>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("planner.export");
  const scopeLabel = describeExportScope(null);
  const canExportVectors = getVectorExportShapeIds(null).length > 0;

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

  const clearStatus = useCallback(() => {
    setStatusMessage(null);
    if (downloadState === "error") setDownloadState("idle");
  }, [downloadState]);

  const handleDownload = useCallback(async () => {
    if (downloadState === "loading") return;
    setDownloadState("loading");
    setStatusMessage(null);

    try {
      if (selectedFormat === "json") {
        downloadPlannerJson(null);
      } else if (selectedFormat === "pdf") {
        await downloadPlannerBoqPdf(null, "Workspace Plan", selectedPreset);
      } else if (selectedFormat === "svg") {
        await downloadPlannerSvg(null);
      } else {
        await downloadPlannerPng(null);
      }
      setDownloadState("success");
      setStatusMessage(t("ready", { format: selectedFormat.toUpperCase() }));
      setTimeout(() => {
        setDownloadState("idle");
        setStatusMessage(null);
      }, 2500);
    } catch (error) {
      const message =
        error instanceof PlannerExportError
          ? error.message
          : t("failed");
      setDownloadState("error");
      setStatusMessage(message);
    }
  }, [downloadState, selectedFormat, selectedPreset]);

  const handleCopyLink = useCallback(() => {
    const hash = btoa(JSON.stringify({ preset: selectedPreset, format: selectedFormat, ts: Date.now() }));
    const url = `${window.location.origin}${window.location.pathname}#export=${hash}`;
    void navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, [selectedPreset, selectedFormat]);

  if (!isOpen) return null;

  const downloadLabel =
    downloadState === "loading"
      ? t("exporting")
      : downloadState === "success"
        ? t("downloaded")
        : `${t("downloadPrefix")} ${selectedFormat.toUpperCase()}`;

  const vectorExportBlocked =
    (selectedFormat === "svg" || selectedFormat === "png") && !canExportVectors;

  return (
    <div
      className="pwx-modal-root"
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
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
              {t("title")}
            </h2>
            <p className="pwx-modal-sub">{t("subtitle")}</p>
          </div>
          <button type="button" onClick={onClose} className="pw-icon-btn" aria-label="Close">
            <X size={15} aria-hidden />
          </button>
        </div>

        <div className="pwx-modal-body custom-scrollbar">
          <section className="pwx-export-section" aria-labelledby="export-format-label">
            <div className="pwx-export-section-head">
              <span id="export-format-label" className="typ-label text-muted">{t("formatLabel")}</span>
              <span className="pwx-export-scope">{scopeLabel}</span>
            </div>
            <div className="pwx-format-row" role="group" aria-label="File format">
              {FORMAT_OPTIONS.map(({ id, label, hint, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className="pwx-format-card"
                  data-active={selectedFormat === id}
                  aria-pressed={selectedFormat === id}
                  onClick={() => {
                    setSelectedFormat(id);
                    clearStatus();
                  }}
                >
                  <span className="pwx-format-icon" aria-hidden>
                    <Icon size={14} />
                  </span>
                  <span className="pwx-format-label">{label}</span>
                  <span className="pwx-format-hint">{hint}</span>
                </button>
              ))}
            </div>
          </section>

          {selectedFormat === "pdf" && (
            <section className="pwx-export-section" aria-labelledby="export-preset-label">
              <span id="export-preset-label" className="typ-label text-muted">{t("pdfStyleLabel")}</span>
              <div className="pwx-preset-row" role="group" aria-label="Export preset">
                {PRESET_CARDS.map(({ id, label, description, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    className="pwx-preset-card"
                    data-preset={id}
                    data-active={selectedPreset === id}
                    aria-pressed={selectedPreset === id}
                    onClick={() => {
                      setSelectedPreset(id);
                      clearStatus();
                    }}
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
            </section>
          )}

          {statusMessage && (
            <p
              className="pwx-export-status"
              data-tone={downloadState === "error" ? "error" : downloadState === "success" ? "success" : "info"}
              role="status"
              aria-live="polite"
            >
              {downloadState === "error" && <AlertCircle size={13} aria-hidden />}
              {downloadState === "success" && <Check size={13} aria-hidden />}
              {statusMessage}
            </p>
          )}
        </div>

        <div className="pwx-modal-footer">
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={downloadState === "loading" || vectorExportBlocked}
            className="btn-primary flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm disabled:opacity-70"
          >
            {downloadState === "loading" && <Loader2 size={14} className="animate-spin" aria-hidden />}
            {downloadState === "success" && <Check size={14} aria-hidden />}
            {downloadState === "error" && <AlertCircle size={14} aria-hidden />}
            {downloadLabel}
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="btn-outline flex items-center gap-1.5 px-4 py-2.5 text-sm"
          >
            {linkCopied ? <Check size={14} aria-hidden /> : <Link2 size={14} aria-hidden />}
            {linkCopied ? t("linkCopied") : t("copyLink")}
          </button>
        </div>
      </div>
    </div>
  );
}

export { getExportShapeIds, getSafePngPixelRatio, getVectorExportShapeIds } from "./exportActions";
