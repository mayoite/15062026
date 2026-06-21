/**
 * TemplatePickerModal - One-click layout template application.
 *
 * Card grid with live SVG plan previews, hover lift, focus trap, ESC and
 * backdrop close. Preview geometry mirrors buildTemplateShapes() placement
 * in PlannerWorkspace so cards show what actually lands on the canvas.
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { X, LayoutGrid, Users, ArrowRight, Check } from "lucide-react";
import { LAYOUT_TEMPLATES, type LayoutTemplate } from "@/features/planner/templates/layoutTemplates";
import {
  isCatalogShapeType,
  isRoomCatalogShapeType,
  PlannerCatalogShapeType,
} from "@/features/planner/catalog/shapeTypeRegistry";

// --- Preview geometry (pure, unit-tested) ---

export interface TemplatePreviewRect {
  kind: "room" | "zone" | "furniture";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TemplatePreview {
  /** viewBox width is always 100; height preserves the room aspect ratio. */
  viewBoxHeight: number;
  rects: TemplatePreviewRect[];
}

/** Mirrors the placement rules of buildTemplateShapes() in PlannerWorkspace. */
export function buildTemplatePreview(template: LayoutTemplate): TemplatePreview {
  const roomW = Math.max(template.recommendedRoomSize.minWidth, 900);
  const roomH = Math.max(template.recommendedRoomSize.minHeight, 620);
  const scale = 100 / roomW;
  const viewBoxHeight = roomH * scale;

  const rects: TemplatePreviewRect[] = [
    { kind: "room", x: 0, y: 0, width: 100, height: viewBoxHeight },
  ];

  for (const shape of template.shapes) {
    const kind: TemplatePreviewRect["kind"] = isCatalogShapeType(
      shape.type,
      PlannerCatalogShapeType.zone,
    )
      ? "zone"
      : isRoomCatalogShapeType(shape.type)
        ? "room"
        : "furniture";

    const x = shape.x * 100;
    const y = shape.y * viewBoxHeight;
    const width = Math.min(shape.widthMm * scale, 100 - x);
    const height = Math.min(shape.heightMm * scale, viewBoxHeight - y);
    if (width <= 0 || height <= 0) continue;

    rects.push({ kind, x, y, width, height });
  }

  return { viewBoxHeight, rects };
}

function formatTemplateRoomSize(template: LayoutTemplate): string {
  const widthM = (template.recommendedRoomSize.minWidth / 100).toFixed(1);
  const heightM = (template.recommendedRoomSize.minHeight / 100).toFixed(1);
  return `min ${widthM} x ${heightM} m`;
}

// --- Component ---

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (template: LayoutTemplate) => void;
}

export function TemplatePickerModal({ isOpen, onClose, onApply }: TemplatePickerModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = LAYOUT_TEMPLATES.find((t) => t.id === selectedId);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleApply = useCallback(() => {
    if (selected) {
      onApply(selected);
      onClose();
    }
  }, [selected, onApply, onClose]);

  // Focus trap + Escape to close
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

  if (!isOpen) return null;

  return (
    <div
      className="pwx-modal-root"
      role="dialog"
      aria-modal="true"
      aria-label="Layout templates"
      ref={modalRef}
    >
      <button
        type="button"
        className="pwx-modal-backdrop modal-backdrop-enter"
        onClick={onClose}
        aria-label="Close dialog"
        tabIndex={-1}
      />

      <div className="pwx-modal pwx-modal--lg modal-panel-enter">
        <div className="pwx-modal-header">
          <div>
            <h2 className="pwx-modal-title">
              <LayoutGrid size={16} aria-hidden />
              Layout templates
            </h2>
            <p className="pwx-modal-sub">
              Start from a proven workspace layout — every element stays editable.
            </p>
          </div>
          <button type="button" onClick={onClose} className="pw-icon-btn" aria-label="Close">
            <X size={15} aria-hidden />
          </button>
        </div>

        <div className="pwx-modal-body custom-scrollbar">
          <div className="pwx-template-grid">
            {LAYOUT_TEMPLATES.map((template) => {
              const preview = buildTemplatePreview(template);
              const isActive = selectedId === template.id;

              return (
                <button
                  key={template.id}
                  type="button"
                  className="pwx-template-card"
                  data-active={isActive}
                  aria-pressed={isActive}
                  onClick={() => setSelectedId(template.id)}
                >
                  <span className="pwx-template-check" aria-hidden>
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <svg
                    className="pwx-template-preview"
                    viewBox={`0 0 100 ${preview.viewBoxHeight}`}
                    role="img"
                    aria-label={`${template.name} layout preview`}
                  >
                    {preview.rects.map((rect, index) => (
                      <rect
                        key={index}
                        data-kind={rect.kind}
                        x={rect.x}
                        y={rect.y}
                        width={rect.width}
                        height={rect.height}
                        rx={1}
                        strokeWidth={0.6}
                      />
                    ))}
                  </svg>
                  <h3 className="pwx-template-name">{template.name}</h3>
                  <p className="pwx-template-desc">{template.description}</p>
                  <div className="pwx-template-meta">
                    <span className="pwx-meta-chip">
                      <Users size={10} aria-hidden />
                      {template.totalSeats} seats
                    </span>
                    <span className="pwx-meta-chip">{template.category.replace("-", " ")}</span>
                    <span className="pwx-meta-chip">{formatTemplateRoomSize(template)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pwx-modal-footer">
          <button type="button" onClick={onClose} className="pwx-ghost-btn">
            Skip — start blank
          </button>
          <p className="flex-1 text-center text-[10px] text-soft">
            {selected
              ? `${selected.name} · ${selected.shapes.length} elements`
              : "Pick a template, or skip for a blank canvas"}
          </p>
          <button
            type="button"
            onClick={handleApply}
            disabled={!selected}
            className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs disabled:opacity-40"
          >
            Apply template <ArrowRight size={12} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
