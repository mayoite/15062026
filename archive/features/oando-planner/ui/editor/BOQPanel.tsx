"use client";
import { useCallback } from "react";
import { usePlannerStore } from "@/features/oando-planner/data/plannerStore";
import { generateBOQ } from "@/features/oando-planner/lib/export/boqGenerator";
import { useToastStore } from "@/features/oando-planner/data/toastStore";
import { useDialogA11y } from "@/features/oando-planner/hooks/useDialogA11y";

interface Props {
  onClose: () => void;
}

export function BOQPanel({ onClose }: Props) {
  const stableOnClose = useCallback(() => onClose(), [onClose]);
  const dialogRef = useDialogA11y(true, stableOnClose);
  const furniture = usePlannerStore((s) => s.furniture);
  const doors = usePlannerStore((s) => s.doors);
  const windows = usePlannerStore((s) => s.windows);
  const walls = usePlannerStore((s) => s.walls);
  const rooms = usePlannerStore((s) => s.rooms);
  const projectName = usePlannerStore((s) => s.projectName);
  const addToast = useToastStore((s) => s.addToast);

  const boq = generateBOQ(furniture, doors, windows, walls, rooms);

  const handleExportPDF = async () => {
    try {
      const { exportBoqToPdf } = await import("@/features/planner/shared/export/pdfExport");
      
      const rows = boq.categories.flatMap((cat) => 
        cat.items.map((item) => ({
          name: item.name,
          category: cat.category,
          quantity: item.quantity,
          widthCm: item.widthMm / 10,
          depthCm: item.depthMm / 10,
          heightCm: item.heightMm / 10,
          spec: item.sku
        }))
      );

      const layout = {
        projectName: projectName,
        clientName: "",
        preparedBy: "Oando Suite",
        roomWidthMm: 0,
        roomDepthMm: 0,
        generatedAt: new Date().toISOString(),
        unitSystem: "metric" as const,
      };

      await exportBoqToPdf({ layout, rows });
      addToast("success", "BOQ exported as Branded PDF");
    } catch (e) {
      console.error(e);
      addToast("error", "Failed to export BOQ PDF");
    }
  };

  return (
    <div ref={dialogRef} role="dialog" aria-label="Bill of Quantities" className="fixed inset-y-0 right-0 z-[80] w-[320px] bg-[var(--surface-inverse)] border-l border-white/10 flex flex-col shadow-2xl animate-slide-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div>
          <h2 className="text-white text-[13px] font-semibold">Bill of Quantities</h2>
          <p className="text-white/40 text-[10px] mt-0.5">Live inventory of all placed items</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="px-2.5 py-1 rounded text-[11px] bg-[var(--color-ocean-boat-blue-600)]/20 text-[var(--color-ocean-boat-blue-300)] hover:bg-[var(--color-ocean-boat-blue-600)]/30 border border-[var(--color-ocean-boat-blue-600)]/30 transition-colors"
            title="Export BOQ as Branded PDF"
          >
            PDF
          </button>
          <button
            onClick={onClose}
            aria-label="Close Bill of Quantities"
            className="text-white/40 hover:text-white text-lg leading-none transition-colors"
          >
            &times;
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {boq.totalFurnitureItems === 0 && boq.doors === 0 && boq.windows === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
            <div className="text-4xl opacity-30">📦</div>
            <p className="text-white/30 text-[12px]">No items placed yet.</p>
            <p className="text-white/40 text-[11px]">Place furniture, doors, or windows on the canvas to see the Bill of Quantities here.</p>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {boq.categories.map((cat) => (
              <div key={cat.category} className="bg-white/[0.03] rounded-lg overflow-hidden border border-white/5">
                <div className="flex items-center justify-between px-3 py-2 bg-white/5">
                  <span className="text-[11px] font-semibold text-white/80 uppercase tracking-wider">{cat.category}</span>
                  <span className="text-[10px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded">{cat.totalItems}</span>
                </div>
                <div className="divide-y divide-white/5">
                  {cat.items.map((item) => (
                    <div key={`${item.name}-${item.widthCm}-${item.heightCm}`} className="px-3 py-2 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-white/80 truncate">{item.name}</p>
                        <p className="text-[10px] text-white/30">{item.widthCm}×{item.heightCm} cm</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[13px] font-bold text-[var(--color-ocean-boat-blue-300)]">×{item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="bg-[var(--color-dark-midnight-blue-500)]/50 rounded-lg border border-[var(--color-ocean-boat-blue-600)]/20 p-3 space-y-1.5">
              <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-2">Summary</p>
              {[
                { label: "Furniture Items", value: boq.totalFurnitureItems },
                { label: "Unique Types", value: boq.totalUniqueItems },
                { label: "Doors", value: boq.doors },
                { label: "Windows", value: boq.windows },
                { label: "Walls", value: boq.walls },
                { label: "Rooms", value: boq.rooms },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[11px] text-white/50">{label}</span>
                  <span className="text-[11px] font-semibold text-white/80">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
