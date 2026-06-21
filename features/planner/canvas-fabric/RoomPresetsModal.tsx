"use client";

import { useEffect, useRef } from "react";
import { LayoutGrid, X } from "lucide-react";
import { FURNISHINGS } from "./models/furnishings";

function formatMillimeters(inches: number) {
  return `${Math.round(inches * 25.4).toLocaleString()} mm`;
}

type RoomPreset = (typeof FURNISHINGS.rooms)[number];

interface RoomPresetsModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (room: RoomPreset) => void;
}

export function RoomPresetsModal({ open, onClose, onApply }: RoomPresetsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="pwx-modal-root frp-modal-root"
      role="dialog"
      aria-modal="true"
      aria-label="Room presets"
      ref={modalRef}
    >
      <button
        type="button"
        className="pwx-modal-backdrop modal-backdrop-enter"
        onClick={onClose}
        aria-label="Close dialog"
        tabIndex={-1}
      />

      <div className="pwx-modal pwx-modal--md modal-panel-enter frp-modal">
        <div className="pwx-modal-header">
          <div>
            <h2 className="pwx-modal-title">
              <LayoutGrid size={16} aria-hidden />
              Room presets
            </h2>
            <p className="pwx-modal-sub">
              Choose a starting room shell. You can edit walls and layout after applying.
            </p>
          </div>
          <button type="button" onClick={onClose} className="pw-icon-btn" aria-label="Close">
            <X size={15} aria-hidden />
          </button>
        </div>

        <div className="pwx-modal-body custom-scrollbar">
          <ul className="frp-preset-list">
            {FURNISHINGS.rooms.map((room) => (
              <li key={room.title}>
                <button
                  type="button"
                  className="frp-preset-card"
                  onClick={() => {
                    onApply(room);
                    onClose();
                  }}
                >
                  <span className="frp-preset-card__title">{room.title}</span>
                  <span className="frp-preset-card__meta">
                    {formatMillimeters(room.width)} × {formatMillimeters(room.height)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="pwx-modal-footer">
          <button type="button" className="pwx-ghost-btn" onClick={onClose}>
            Start blank
          </button>
        </div>
      </div>
    </div>
  );
}

/** Legacy auto-open shell chooser. Blank canvas now starts directly in workspace guidance. */
export function RoomPresetsOnOpen() {
  return null;
}
