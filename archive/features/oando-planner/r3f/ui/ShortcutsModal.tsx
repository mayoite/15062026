"use client";

import { X } from "lucide-react";

const SHORTCUT_GROUPS: { group: string; shortcuts: { key: string; desc: string }[] }[] = [
  {
    group: "Transform",
    shortcuts: [
      { key: "G", desc: "Toggle Move mode" },
      { key: "R", desc: "Toggle Rotate mode" },
    ],
  },
  {
    group: "View",
    shortcuts: [
      { key: "S", desc: "Toggle Snap" },
      { key: "W", desc: "Toggle Walls" },
    ],
  },
  {
    group: "Camera",
    shortcuts: [
      { key: "1", desc: "3D Orbit view" },
      { key: "2", desc: "Top-down view" },
      { key: "3", desc: "Walk-through mode" },
    ],
  },
  {
    group: "Edit",
    shortcuts: [
      { key: "Ctrl+Z", desc: "Undo" },
      { key: "Ctrl+Y", desc: "Redo" },
      { key: "Ctrl+D", desc: "Duplicate selected" },
      { key: "Del / Backspace", desc: "Delete selected" },
      { key: "Escape", desc: "Deselect / exit walk" },
      { key: "Shift+Click", desc: "Multi-select" },
    ],
  },
  {
    group: "General",
    shortcuts: [
      { key: "?", desc: "Show shortcuts" },
    ],
  },
];

export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl mx-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-bold text-neutral-900 mb-4">Keyboard Shortcuts</h2>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {SHORTCUT_GROUPS.map(({ group, shortcuts }) => (
            <div key={group}>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                {group}
              </h3>
              <div className="space-y-1.5">
                {shortcuts.map(({ key, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-[12px] text-neutral-600">{desc}</span>
                    <kbd className="rounded bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[11px] font-mono font-medium text-neutral-700">
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
