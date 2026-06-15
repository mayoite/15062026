"use client";
import { useMemo, useState } from "react";
import type { FloorTemplate } from "@/features/planner/store/floorTemplates";
import { floorTemplates } from "@/features/planner/store/floorTemplates";
import { usePlannerStore } from "@/features/planner/store/plannerStore";
import { useToastStore } from "@/features/planner/store/toastStore";
import { useDialogA11y } from "@/features/oando-planner/hooks/useDialogA11y";
import { ROOM_SETUP_STYLES, ROOM_SETUP_TYPES, buildRoomSetupTemplate, type RoomSetupStyle, type RoomSetupType } from "@/features/planner/store/roomSetup";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Optional callback when a template is selected (called before onClose) */
  onSelect?: (template: FloorTemplate) => void;
}

export function TemplatePickerModal({ open, onClose, onSelect }: Props) {
  const loadTemplate = usePlannerStore((s) => s.loadTemplate);
  const setProjectName = usePlannerStore((s) => s.setProjectName);
  const addToast = useToastStore((s) => s.addToast);
  const dialogRef = useDialogA11y(open, onClose);
  const [roomType, setRoomType] = useState<RoomSetupType>("office");
  const [style, setStyle] = useState<RoomSetupStyle>("Modern");
  const [widthM, setWidthM] = useState(6);
  const [depthM, setDepthM] = useState(4);

  const setupTemplate = useMemo(
    () => buildRoomSetupTemplate({ roomType, style, widthM, depthM }),
    [roomType, style, widthM, depthM],
  );

  if (!open) return null;

  const handleSelect = (template: FloorTemplate) => {
    if (usePlannerStore.getState().hasContent() && template.id !== "blank") {
      if (!confirm("This will replace your current design. Continue?")) return;
    }
    loadTemplate(template);
    if (template.id !== "blank") {
      setProjectName(template.name);
    }
    addToast("success", `Template "${template.name}" loaded`);
    onSelect?.(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="template-modal-title" onClick={onClose}>
      <div ref={dialogRef} className="bg-[var(--surface-inverse)] backdrop-blur-xl border border-[var(--color-accent)] rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-[90vw] sm:max-w-[720px] max-h-[90vh] sm:max-h-[85vh] flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[var(--color-accent)]">
          <div>
            <h2 id="template-modal-title" className="text-white text-lg font-semibold">Office Templates</h2>
            <p className="text-white/40 text-sm mt-0.5">Start with a pre-built office layout or blank canvas</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close templates"
            className="w-10 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white flex items-center justify-center transition-all text-lg min-h-[44px] min-w-[44px] border border-white/[0.04]"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-white text-sm font-semibold">Start with room setup</p>
                <p className="text-white/40 text-xs mt-1">Set room type, dimensions, and style before drawing detail.</p>
              </div>
              <button
                onClick={() => handleSelect(setupTemplate)}
                className="rounded-lg bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
              >
                Create Room
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="space-y-1">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">Type</span>
                <select value={roomType} onChange={(e) => setRoomType(e.target.value as RoomSetupType)} className="w-full rounded-lg border border-white/10 bg-white/10 px-2 py-2 text-xs text-white">
                  {ROOM_SETUP_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">Width (m)</span>
                <input type="number" min={1.5} max={60} step={0.5} value={widthM} onChange={(e) => setWidthM(Number(e.target.value))} className="w-full rounded-lg border border-white/10 bg-white/10 px-2 py-2 text-xs text-white" />
              </label>
              <label className="space-y-1">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">Depth (m)</span>
                <input type="number" min={1.5} max={60} step={0.5} value={depthM} onChange={(e) => setDepthM(Number(e.target.value))} className="w-full rounded-lg border border-white/10 bg-white/10 px-2 py-2 text-xs text-white" />
              </label>
              <label className="space-y-1">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">Style</span>
                <select value={style} onChange={(e) => setStyle(e.target.value as RoomSetupStyle)} className="w-full rounded-lg border border-white/10 bg-white/10 px-2 py-2 text-xs text-white">
                  {ROOM_SETUP_STYLES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {floorTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelect(template)}
                className="group p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-[var(--color-accent)]/30 transition-all text-left"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{template.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium group-hover:text-[var(--color-accent)] transition-colors">
                      {template.name}
                    </p>
                    {template.size && (
                      <span className="text-[10px] text-[var(--color-accent)] bg-white/[0.04] px-1.5 py-0.5 rounded-md mt-1 inline-block">
                        {template.size}
                      </span>
                    )}
                    <p className="text-white/40 text-xs mt-1.5 leading-relaxed">
                      {template.description}
                    </p>
                    <div className="flex gap-3 mt-2 text-[10px] text-white/20">
                      {template.walls.length > 0 && <span>{template.walls.length} walls</span>}
                      {template.rooms.length > 0 && <span>{template.rooms.length} rooms</span>}
                      {template.furniture.length > 0 && <span>{template.furniture.length} items</span>}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
