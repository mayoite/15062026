"use client";
import { useState, useMemo } from "react";
import { usePlannerStore } from "@/features/oando-planner/data/plannerStore";
import { useToastStore } from "@/features/oando-planner/data/toastStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AutoArrangeTool({ open, onClose }: Props) {
  const furniture = usePlannerStore((s) => s.furniture);
  const selectedIds = usePlannerStore((s) => s.selectedIds);
  const updateFurnitureBatch = usePlannerStore((s) => s.updateFurnitureBatch);
  const addToast = useToastStore((s) => s.addToast);

  const [columns, setColumns] = useState(4);
  const [spacingX, setSpacingX] = useState(120);
  const [spacingY, setSpacingY] = useState(120);
  const [filterShape, setFilterShape] = useState<string>("all");
  const [startX, setStartX] = useState(100);
  const [startY, setStartY] = useState(100);
  const [useSelection, setUseSelection] = useState(selectedIds.length > 1);

  const hasSelection = selectedIds.length > 1;
  const selectedFurniture = useMemo(() =>
    furniture.filter((f) => selectedIds.includes(f.id)),
    [furniture, selectedIds]
  );

  const baseFurniture = useSelection && hasSelection ? selectedFurniture : furniture;

  const shapes = useMemo(() => {
    const s = new Set(baseFurniture.map((f) => f.shape));
    return Array.from(s).sort();
  }, [baseFurniture]);

  const targetItems = useMemo(() => {
    if (filterShape === "all") return baseFurniture;
    return baseFurniture.filter((f) => f.shape === filterShape);
  }, [baseFurniture, filterShape]);

  if (!open) return null;

  const handleArrange = () => {
    if (targetItems.length === 0) {
      addToast("error", "No items to arrange");
      return;
    }

    const updates = targetItems.map((item, i) => {
      const col = i % columns;
      const row = Math.floor(i / columns);
      return { id: item.id, changes: { x: startX + col * spacingX, y: startY + row * spacingY } };
    });
    updateFurnitureBatch(updates);

    addToast("success", `Arranged ${targetItems.length} items in ${Math.ceil(targetItems.length / columns)} rows`);
    onClose();
  };

  const previewRows = Math.ceil(targetItems.length / columns);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--surface-inverse)] rounded-xl border border-white/10 shadow-2xl w-[420px] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="text-white text-[15px] font-semibold">Auto-Arrange</h2>
            <p className="text-white/40 text-[11px] mt-0.5">
              {hasSelection ? `${selectedFurniture.length} items selected` : "Arrange furniture in a grid pattern"}
            </p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl">&times;</button>
        </div>

        <div className="p-5 space-y-4">
          {hasSelection && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUseSelection(true)}
                className={`flex-1 py-2 rounded-lg text-[11px] transition-colors ${useSelection ? "bg-[var(--color-ocean-boat-blue-600)] text-white" : "bg-white/5 text-white/50"}`}
              >
                Selected ({selectedFurniture.length})
              </button>
              <button
                onClick={() => setUseSelection(false)}
                className={`flex-1 py-2 rounded-lg text-[11px] transition-colors ${!useSelection ? "bg-[var(--color-ocean-boat-blue-600)] text-white" : "bg-white/5 text-white/50"}`}
              >
                All ({furniture.length})
              </button>
            </div>
          )}

          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40 block mb-1.5">Filter by Type</label>
            <select
              value={filterShape}
              onChange={(e) => setFilterShape(e.target.value)}
              className="w-full bg-white/10 text-white text-[12px] px-2.5 py-2 rounded border border-white/10 focus:border-[var(--color-ocean-boat-blue-600)] outline-none cursor-pointer"
            >
              <option value="all">All ({baseFurniture.length})</option>
              {shapes.map((s) => {
                const count = furniture.filter((f) => f.shape === s).length;
                return (
                  <option key={s} value={s}>{s} ({count})</option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Columns</label>
              <input
                type="number"
                min={1}
                max={20}
                value={columns}
                onChange={(e) => setColumns(Math.max(1, Number(e.target.value)))}
                className="w-full bg-white/10 text-white text-[12px] px-2.5 py-2 rounded border border-white/10 focus:border-[var(--color-ocean-boat-blue-600)] outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Rows</label>
              <p className="text-[13px] text-white/60 py-2">{previewRows}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">X Spacing (cm)</label>
              <input
                type="number"
                min={50}
                max={400}
                value={spacingX}
                onChange={(e) => setSpacingX(Number(e.target.value))}
                className="w-full bg-white/10 text-white text-[12px] px-2.5 py-2 rounded border border-white/10 focus:border-[var(--color-ocean-boat-blue-600)] outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Y Spacing (cm)</label>
              <input
                type="number"
                min={50}
                max={400}
                value={spacingY}
                onChange={(e) => setSpacingY(Number(e.target.value))}
                className="w-full bg-white/10 text-white text-[12px] px-2.5 py-2 rounded border border-white/10 focus:border-[var(--color-ocean-boat-blue-600)] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Start X</label>
              <input
                type="number"
                value={startX}
                onChange={(e) => setStartX(Number(e.target.value))}
                className="w-full bg-white/10 text-white text-[12px] px-2.5 py-2 rounded border border-white/10 focus:border-[var(--color-ocean-boat-blue-600)] outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Start Y</label>
              <input
                type="number"
                value={startY}
                onChange={(e) => setStartY(Number(e.target.value))}
                className="w-full bg-white/10 text-white text-[12px] px-2.5 py-2 rounded border border-white/10 focus:border-[var(--color-ocean-boat-blue-600)] outline-none"
              />
            </div>
          </div>

          <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Preview</p>
            <p className="text-[12px] text-white/70">
              {targetItems.length} items → {columns} cols × {previewRows} rows
            </p>
            <p className="text-[10px] text-white/30 mt-1">
              Grid size: {columns * spacingX}cm × {previewRows * spacingY}cm
            </p>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-white/10 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-[12px] text-white/50 bg-white/5 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleArrange}
            disabled={targetItems.length === 0}
            className="flex-1 py-2.5 rounded-lg text-[12px] text-white bg-[var(--color-ocean-boat-blue-600)] hover:bg-[var(--color-ocean-boat-blue-400)] transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Arrange {targetItems.length} Items
          </button>
        </div>
      </div>
    </div>
  );
}
