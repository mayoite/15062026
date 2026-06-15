"use client";
import { useDialogA11y } from "@/features/oando-planner/hooks/useDialogA11y";

interface Props {
  open: boolean;
  onClose: () => void;
}

const groups = [
  {
    title: "Tools",
    shortcuts: [
      { key: "V", label: "Select tool" },
      { key: "H", label: "Pan tool" },
      { key: "W", label: "Wall tool" },
      { key: "R", label: "Room tool" },
      { key: "D", label: "Door tool" },
      { key: "N", label: "Window tool" },
      { key: "F", label: "Furniture tool" },
      { key: "Z", label: "Zone tool" },
      { key: "X", label: "Eraser / Delete tool" },
      { key: "M", label: "Measure tool" },
    ],
  },
  {
    title: "Canvas",
    shortcuts: [
      { key: "Space + Drag", label: "Pan canvas" },
      { key: "Scroll", label: "Zoom in/out" },
      { key: "G", label: "Toggle grid" },
      { key: "Escape", label: "Cancel drawing / Deselect" },
    ],
  },
  {
    title: "Editing",
    shortcuts: [
      { key: "Ctrl+S", label: "Save project" },
      { key: "Ctrl+Z", label: "Undo" },
      { key: "Ctrl+Shift+Z", label: "Redo" },
      { key: "Ctrl+C", label: "Copy selected" },
      { key: "Ctrl+V", label: "Paste" },
      { key: "Ctrl+D", label: "Duplicate selected" },
      { key: "Ctrl+A", label: "Select all" },
      { key: "Delete", label: "Delete selected item" },
      { key: "Backspace", label: "Delete selected item" },
    ],
  },
  {
    title: "Other",
    shortcuts: [
      { key: "?", label: "Show keyboard shortcuts" },
      { key: "Ctrl+I", label: "Open AI assistant" },
    ],
  },
];

export function KeyboardShortcutsModal({ open, onClose }: Props) {
  const dialogRef = useDialogA11y(open, onClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="shortcuts-modal-title" onClick={onClose}>
      <div ref={dialogRef} className="bg-[var(--surface-inverse)] backdrop-blur-xl border border-[var(--color-accent)] rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-[90vw] sm:max-w-[480px] max-h-[90vh] sm:max-h-[80vh] flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[var(--color-accent)]">
          <h2 id="shortcuts-modal-title" className="text-white text-lg font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
            className="w-10 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white flex items-center justify-center transition-all text-lg min-h-[44px] min-w-[44px] border border-white/[0.04]"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs uppercase tracking-wider text-[var(--color-accent)] mb-2 font-semibold">{group.title}</h3>
              <div className="space-y-1">
                {group.shortcuts.map((s) => (
                  <div key={s.key} className="flex items-center justify-between py-1.5">
                    <span className="text-white/60 text-sm">{s.label}</span>
                    <kbd className="text-[11px] bg-white/[0.06] text-white/50 px-2 py-0.5 rounded-md border border-white/[0.08] font-mono">
                      {s.key}
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

