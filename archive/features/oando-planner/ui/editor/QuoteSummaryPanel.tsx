"use client";

import { useCallback, useMemo } from "react";
import { usePlannerStore } from "@/features/oando-planner/data/plannerStore";
import { generateBOQ } from "@/features/oando-planner/lib/export/boqGenerator";
import { generateQuote, type QuoteResult } from "@/features/oando-planner/lib/quoteEngine";
import { getQuoteMode } from "@/features/oando-planner/lib/quoteConfig";
import { submitQuote } from "@/features/oando-planner/lib/quoteSubmission";
import { useToastStore } from "@/features/oando-planner/data/toastStore";
import { useDialogA11y } from "@/features/oando-planner/hooks/useDialogA11y";
import { categoryLabels } from "@/features/oando-planner/data/catalogData";
import { appendSnapshot } from "@/features/oando-planner/data/versionStore";
import { buildPlannerVersionDocument } from "@/features/oando-planner/lib/plannerSavedProjectVersions";
import { getProjectIdFromKey, getSavedPlanByKey } from "@/features/oando-planner/lib/projectIndex";

interface Props {
  onClose: () => void;
}

export function QuoteSummaryPanel({ onClose }: Props) {
  const stableOnClose = useCallback(() => onClose(), [onClose]);
  const dialogRef = useDialogA11y(true, stableOnClose);
  const furniture = usePlannerStore((s) => s.furniture);
  const doors = usePlannerStore((s) => s.doors);
  const windows = usePlannerStore((s) => s.windows);
  const walls = usePlannerStore((s) => s.walls);
  const rooms = usePlannerStore((s) => s.rooms);
  const projectName = usePlannerStore((s) => s.projectName);
  const currentProjectKey = usePlannerStore((s) => s.currentProjectKey);
  const isDirty = usePlannerStore((s) => s.isDirty);
  const saveProject = usePlannerStore((s) => s.saveProject);
  const measurements = usePlannerStore((s) => s.measurements);
  const zones = usePlannerStore((s) => s.zones);
  const clientName = getSavedPlanByKey(currentProjectKey ?? "")?.clientName ?? "";
  const addToast = useToastStore((s) => s.addToast);

  const quoteMode = getQuoteMode();
  const boq = useMemo(
    () => generateBOQ(furniture, doors, windows, walls, rooms),
    [furniture, doors, windows, walls, rooms]
  );
  const quote: QuoteResult = useMemo(
    () => generateQuote(boq, quoteMode),
    [boq, quoteMode]
  );

  const handleSubmitQuote = () => {
    if (!currentProjectKey) {
      saveProject();
      addToast("info", "Save the project once before submitting a quote.");
      return;
    }

    if (isDirty) {
      saveProject();
    }

    const planId = getProjectIdFromKey(currentProjectKey);

    try {
      appendSnapshot(
        planId,
        buildPlannerVersionDocument(planId, {
          projectName,
          clientName,
          walls,
          rooms,
          furniture,
          doors,
          windows,
          measurements,
          zones,
          savedAt: new Date().toISOString(),
        }),
        "save",
        quoteMode === "request" ? "Quote request handoff" : "Quote checkpoint",
      );

      submitQuote(projectName, planId, quote, {
        clientName,
        itemCount: quote.lineItems.reduce((sum, item) => sum + item.quantity, 0),
      });

      if (quoteMode === "request") {
        addToast("success", "Quote request submitted. The team will respond with pricing.");
      } else {
        addToast("success", "Quote saved successfully.");
      }
    } catch {
      addToast("error", "Failed to submit quote. Please try again.");
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Group line items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof quote.lineItems> = {};
    for (const item of quote.lineItems) {
      const key = item.category;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }, [quote]);

  const reviewReadiness = useMemo(() => {
    const blockers: string[] = [];
    if (rooms.length === 0) blockers.push("Add at least one room");
    if (zones.length === 0) blockers.push("Add zones for review");
    if (measurements.length === 0) blockers.push("Capture key measurements");
    if (!currentProjectKey) blockers.push("Save this plan before handoff");

    return blockers;
  }, [currentProjectKey, measurements.length, rooms.length, zones.length]);

  if (furniture.length === 0) {
    return (
      <div
        ref={dialogRef}
        role="dialog"
        aria-label="Quote Summary"
        className="fixed inset-y-0 right-0 z-80 w-[380px] bg-[var(--surface-inverse)] border-l border-white/10 flex flex-col shadow-2xl animate-slide-in"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-white text-[13px] font-semibold">Quote Summary</h2>
          <button
            onClick={onClose}
            aria-label="Close Quote Summary"
            className="text-white/40 hover:text-white text-lg leading-none transition-colors"
          >
            &times;
          </button>
        </div>
        <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
          <div className="text-4xl opacity-30">💰</div>
          <p className="text-white/30 text-[12px]">
            No furniture placed yet.
          </p>
          <p className="text-white/40 text-[11px]">
            Add items from the catalog to generate a quote with pricing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-label="Quote Summary"
      className="fixed inset-y-0 right-0 z-80 w-[380px] bg-[var(--surface-inverse)] border-l border-white/10 flex flex-col shadow-2xl animate-slide-in"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div>
          <h2 className="text-white text-[13px] font-semibold">Quote Summary</h2>
          <p className="text-white/40 text-[10px] mt-0.5">
            {quoteMode === "auto" ? "⚡ Auto-Quote" : "📋 Request Quote"}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close Quote Summary"
          className="text-white/40 hover:text-white text-lg leading-none transition-colors"
        >
          &times;
        </button>
      </div>

      {/* Line items grouped by category */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-3">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div
              key={category}
              className="bg-white/3 rounded-lg overflow-hidden border border-white/5"
            >
              <div className="flex items-center justify-between px-3 py-2 bg-white/5">
                <span className="text-[11px] font-semibold text-white/80 uppercase tracking-wider">
                  {categoryLabels[category as keyof typeof categoryLabels] ?? category}
                </span>
                <span className="text-[10px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                  {items.reduce((sum, i) => sum + i.quantity, 0)} items
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {items.map((item, idx) => (
                  <div
                    key={`${item.productName}-${idx}`}
                    className="px-3 py-2 flex items-center gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-white/80 truncate">
                        {item.productName}
                      </p>
                      <p className="text-[10px] text-white/30">
                        {item.widthMm}×{item.depthMm}×{item.heightMm}mm
                        {item.sku && ` · ${item.sku}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[12px] font-medium text-white/60">
                        ×{item.quantity}
                      </span>
                    </div>
                    <div className="text-right shrink-0 min-w-[70px]">
                      {item.unitPriceInr !== null ? (
                        <div>
                          <p className="text-[11px] text-white/50">
                            {formatPrice(item.unitPriceInr)} ea
                          </p>
                          <p className="text-[12px] font-semibold text-emerald-400">
                            {formatPrice(item.lineTotal ?? 0)}
                          </p>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Pricing Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer: Totals + submit */}
      <div className="border-t border-white/10 p-4 space-y-3">
        <div className="bg-white/5 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/50">Portal handoff</span>
            <span className={`text-[11px] font-medium ${reviewReadiness.length === 0 ? "text-emerald-400" : "text-amber-300"}`}>
              {reviewReadiness.length === 0 ? "Ready" : `${reviewReadiness.length} gap${reviewReadiness.length === 1 ? "" : "s"}`}
            </span>
          </div>
          {reviewReadiness.length > 0 ? (
            <div className="space-y-1">
              {reviewReadiness.slice(0, 3).map((item) => (
                <p key={item} className="text-[10px] text-white/35">{item}</p>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-white/35">
              This quote will be attached to a saved planner checkpoint for portal and admin review.
            </p>
          )}
        </div>

        {/* Total summary */}
        <div className="bg-white/5 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/50">Items</span>
            <span className="text-[11px] font-medium text-white/80">
              {quote.lineItems.reduce((sum, li) => sum + li.quantity, 0)}
            </span>
          </div>
          {quote.hasPendingItems && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-amber-400/70">Pricing Pending</span>
              <span className="text-[11px] font-medium text-amber-400">
                {quote.pendingCount} item{quote.pendingCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1 border-t border-white/10">
            <span className="text-[12px] font-semibold text-white/80">
              {quote.hasPendingItems ? "Subtotal (priced items)" : "Grand Total"}
            </span>
            <span className="text-[14px] font-bold text-emerald-400">
              {formatPrice(quote.pricedTotal)}
            </span>
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmitQuote}
          className="w-full py-2.5 rounded-lg text-[13px] font-semibold transition-all bg-[var(--color-accent)] hover:brightness-110 text-white shadow-md"
        >
          {quoteMode === "request"
            ? currentProjectKey ? "Submit for Pricing" : "Save Then Submit"
            : currentProjectKey ? "Save Quote" : "Save Then Quote"}
        </button>

        {quoteMode === "request" && (
          <p className="text-[10px] text-white/30 text-center">
            BOQ will be sent to the One&Only team for manual pricing
          </p>
        )}
      </div>
    </div>
  );
}
