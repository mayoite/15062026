"use client";

import { useState, useCallback } from "react";
import { X, FileText, Image, ShoppingCart, Check } from "lucide-react";
import { usePlannerR3FStore } from "../usePlannerR3FStore";
import { buildBoq } from "@/features/planner/shared/boq/buildBoq";
import { boqToQuoteCart } from "@/features/planner/shared/boq/quoteCartBridge";
import { exportBoqToPdf, type PdfBoqRow } from "@/features/planner/shared/export/pdfExport";
import type { CatalogItem } from "@/features/planner/shared/catalog/types";
import { useQuoteCartStore } from "@/stores/useQuoteCartStore";

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-[13px] font-medium text-white shadow-lg animate-[fadeIn_0.2s_ease-out]">
      <Check className="h-4 w-4" />
      {message}
      <button type="button" onClick={onClose} className="ml-2 text-white/70 hover:text-white">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

type ExportAction = "pdf" | "screenshot" | "quote";

const EXPORT_OPTIONS: {
  id: ExportAction;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
}[] = [
  { id: "pdf", icon: FileText, label: "BOQ PDF", desc: "Branded PDF with room info and item table" },
  { id: "screenshot", icon: Image, label: "3D Screenshot", desc: "PNG capture of current 3D view" },
  { id: "quote", icon: ShoppingCart, label: "Add to Quote", desc: "Send items to your quote cart" },
];

export function ExportModal({
  open,
  onClose,
  catalog,
  canvasRef,
  guestMode = false,
}: {
  open: boolean;
  onClose: () => void;
  catalog: CatalogItem[];
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  guestMode?: boolean;
}) {
  const items = usePlannerR3FStore((s) => s.items);
  const room = usePlannerR3FStore((s) => s.room);
  const addCartItem = useQuoteCartStore((s) => s.addItem);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const getBoq = useCallback(() => {
    const catalogMap = new Map(catalog.map((c) => [c.id, c]));
    const placedItems = items.map((i) => ({
      catalogId: i.catalogId,
      name: i.name,
      category: i.category,
      widthCm: i.widthMm / 10,
      depthCm: i.depthMm / 10,
      heightCm: i.heightMm / 10,
    }));
    return buildBoq(placedItems, catalogMap);
  }, [items, catalog]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = async (action: ExportAction) => {
    setBusy(true);
    try {
      const boq = getBoq();
      const layout = {
        projectName: "Planner Layout",
        roomWidthMm: room.widthMm,
        roomDepthMm: room.depthMm,
        unitSystem: "metric" as const,
        generatedAt: new Date().toISOString(),
      };

      switch (action) {

        case "pdf": {
          const rows: PdfBoqRow[] = boq.lineItems.map((li) => ({
            name: li.name,
            category: li.category,
            quantity: li.quantity,
            widthCm: li.dimensions.widthMm / 10,
            depthCm: li.dimensions.depthMm / 10,
            heightCm: li.dimensions.heightMm / 10,
          }));
          await exportBoqToPdf({ layout, rows });
          showToast("BOQ PDF downloaded");
          break;
        }
        case "screenshot": {
          const canvas = canvasRef.current ?? document.querySelector("canvas");
          if (canvas) {
            const dataUrl = (canvas as HTMLCanvasElement).toDataURL("image/png");
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `planner-3d-${Date.now()}.png`;
            link.click();
            showToast("Screenshot saved");
          }
          break;
        }
        case "quote": {
          const cartItems = boqToQuoteCart(boq);
          for (const ci of cartItems) addCartItem(ci);
          showToast(`${cartItems.length} items added to quote cart`);
          break;
        }
      }
    } finally {
      setBusy(false);
    }
  };

  if (!open) return toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null;

  if (guestMode) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl mx-4">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-neutral-900 mb-1">Export disabled</h2>
            <p className="text-[13px] leading-6 text-neutral-600">
              Guest mode keeps the full planner available, but download and quote actions stay off until you sign in.
            </p>
          </div>
        </div>
        {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl mx-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="text-lg font-bold text-neutral-900 mb-1">Export Plan</h2>
          <p className="text-[13px] text-neutral-500 mb-5">
            {items.length} item{items.length !== 1 ? "s" : ""} placed &middot; {(room.widthMm / 1000).toFixed(1)}m &times; {(room.depthMm / 1000).toFixed(1)}m room
          </p>

          <div className="space-y-2">
            {EXPORT_OPTIONS.map(({ id, icon: Icon, label, desc }) => (
              <button
                key={id}
                type="button"
                disabled={busy || (id !== "screenshot" && items.length === 0)}
                onClick={() => handleAction(id)}
                className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 p-3.5 text-left transition hover:border-blue-300 hover:bg-blue-50/50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-neutral-800">{label}</p>
                  <p className="text-[11px] text-neutral-500">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
