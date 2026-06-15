"use client";
import { useEffect, useState } from "react";
import { usePlannerStore } from "@/features/oando-planner/data/plannerStore";
import { FurnitureCatalog } from "./FurnitureCatalog";
import { PropertiesPanel } from "./PropertiesPanel";

export function RightPanel({ readOnly = false }: { readOnly?: boolean }) {
  const tool = usePlannerStore((s) => s.tool);
  const selectedId = usePlannerStore((s) => s.selectedId);
  const walls = usePlannerStore((s) => s.walls);
  const rooms = usePlannerStore((s) => s.rooms);
  const furniture = usePlannerStore((s) => s.furniture);
  const doors = usePlannerStore((s) => s.doors);
  const windows = usePlannerStore((s) => s.windows);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [tabletCatalogOpen, setTabletCatalogOpen] = useState(false);

  const hasSelected = selectedId !== null && (
    walls.some((w) => w.id === selectedId) ||
    rooms.some((r) => r.id === selectedId) ||
    furniture.some((f) => f.id === selectedId) ||
    doors.some((d) => d.id === selectedId) ||
    windows.some((w) => w.id === selectedId)
  );
  const showProperties = hasSelected;
  const showCatalog = tool === "furniture" && !showProperties;
  const isVisible = !readOnly && (showProperties || showCatalog);

  useEffect(() => {
    if (!isVisible) {
// eslint-disable-next-line react-hooks/set-state-in-effect
      setBottomSheetOpen(false);
      setTabletCatalogOpen(false);
      return;
    }

    if (typeof window === "undefined") return;

    if (window.innerWidth < 768) {
      setBottomSheetOpen(true);
      return;
    }

    if (window.innerWidth < 1024) {
      if (showProperties) {
        setBottomSheetOpen(true);
        setTabletCatalogOpen(false);
      } else if (showCatalog) {
        setTabletCatalogOpen(true);
        setBottomSheetOpen(false);
      }
    }
  }, [isVisible, showCatalog, showProperties]);

  return (
    <>
      {/* ── MOBILE (< 768px): floating button + bottom sheet for both catalog & properties ── */}
      {isVisible && (
        <button
          onClick={() => setBottomSheetOpen(!bottomSheetOpen)}
          className="md:hidden fixed bottom-[68px] right-4 z-30 w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-blue-600 text-white shadow-xl shadow-blue-900/20 flex items-center justify-center text-lg transition-transform hover:scale-105 active:scale-95"
          aria-label={bottomSheetOpen ? "Close panel" : showProperties ? "Open Properties" : "Open Furniture Catalog"}
          aria-expanded={bottomSheetOpen}
        >
          {showProperties ? "⚙" : "🛋️"}
        </button>
      )}

      {bottomSheetOpen && isVisible && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setBottomSheetOpen(false)}
        />
      )}

      {isVisible && (
        <div
          className={`
            md:hidden fixed bottom-[60px] left-0 right-0 z-50
            rounded-t-2xl overflow-hidden
            transition-transform duration-300 ease-out
            ${bottomSheetOpen ? "translate-y-0" : "translate-y-full"}
          `}
          style={{ maxHeight: "80vh" }}
        >
          <div className="h-full flex flex-col bg-slate-900/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
            <div className="flex justify-center pt-2.5 pb-1.5 cursor-pointer" onClick={() => setBottomSheetOpen(false)}>
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center justify-between px-4 pb-2 border-b border-white/10">
              <h3 className="text-white text-sm font-semibold">
                {showProperties ? "Properties" : "Furniture Catalog"}
              </h3>
              <button
                onClick={() => setBottomSheetOpen(false)}
                aria-label="Close panel"
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 flex items-center justify-center text-lg min-h-[44px]"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {showProperties ? <PropertiesPanel /> : <FurnitureCatalog readOnly={readOnly} />}
            </div>
          </div>
        </div>
      )}

      {/* ── TABLET (768px–1024px): catalog = collapsible side panel, properties = bottom sheet ── */}

      {/* Tablet: properties bottom sheet (same as mobile) */}
      {showProperties && (
        <button
          onClick={() => setBottomSheetOpen(!bottomSheetOpen)}
          className="hidden md:flex lg:hidden fixed bottom-4 right-4 z-30 w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-blue-600 text-white shadow-xl shadow-blue-900/20 items-center justify-center text-lg transition-transform hover:scale-105 active:scale-95"
          aria-label={bottomSheetOpen ? "Close properties" : "Open Properties"}
          aria-expanded={bottomSheetOpen}
        >
          ⚙
        </button>
      )}

      {bottomSheetOpen && showProperties && (
        <div
          className="hidden md:block lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setBottomSheetOpen(false)}
        />
      )}

      {showProperties && (
        <div
          className={`
            hidden md:flex lg:hidden flex-col
            fixed bottom-0 left-0 right-0 z-50
            rounded-t-2xl overflow-hidden
            transition-transform duration-300 ease-out
            ${bottomSheetOpen ? "translate-y-0" : "translate-y-full"}
          `}
          style={{ maxHeight: "70vh" }}
        >
          <div className="h-full flex flex-col bg-slate-900/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
            <div className="flex justify-center pt-2.5 pb-1.5 cursor-pointer" onClick={() => setBottomSheetOpen(false)}>
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center justify-between px-4 pb-2 border-b border-white/10">
              <h3 className="text-white text-sm font-semibold">Properties</h3>
              <button
                onClick={() => setBottomSheetOpen(false)}
                aria-label="Close properties"
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 flex items-center justify-center text-lg min-h-[44px]"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PropertiesPanel />
            </div>
          </div>
        </div>
      )}

      {/* Tablet: catalog = collapsible slide-in side panel */}
      {showCatalog && (
        <button
          onClick={() => setTabletCatalogOpen(!tabletCatalogOpen)}
          className="hidden md:flex lg:hidden fixed top-1/2 -translate-y-1/2 right-0 z-30 w-7 h-20 rounded-l-xl bg-gradient-to-b from-[var(--color-primary)] to-blue-600 text-white shadow-xl shadow-blue-900/20 items-center justify-center transition-transform hover:-translate-x-1"
          aria-label="Toggle Furniture Catalog"
          aria-expanded={tabletCatalogOpen}
        >
          <span className="text-sm">{tabletCatalogOpen ? "›" : "‹"}</span>
        </button>
      )}

      {tabletCatalogOpen && showCatalog && (
        <div
          className="hidden md:block lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setTabletCatalogOpen(false)}
        />
      )}

      {showCatalog && (
        <div
          className={`
            hidden md:flex lg:hidden flex-col
            fixed top-[48px] right-0 bottom-0 z-50
            w-[280px] bg-slate-900/95 backdrop-blur-2xl border-l border-white/10 shadow-[-8px_0_32px_rgba(0,0,0,0.5)]
            transition-transform duration-300 ease-out
            ${tabletCatalogOpen ? "translate-x-0" : "translate-x-full"}
          `}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-white text-sm font-semibold">Furniture Catalog</h3>
            <button
              onClick={() => setTabletCatalogOpen(false)}
              aria-label="Close furniture catalog"
              className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 flex items-center justify-center text-lg min-h-[44px]"
            >
              &times;
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
              <FurnitureCatalog readOnly={readOnly} />
          </div>
        </div>
      )}

      {/* ── DESKTOP (>= 1024px): always-visible sidebar ── */}
      <div
        className={`
          ${isVisible ? "" : "hidden"}
          hidden lg:block
          w-[280px] shrink-0
          overflow-y-auto
        `}
      >
        {showProperties ? <PropertiesPanel /> : <FurnitureCatalog readOnly={readOnly} />}
      </div>
    </>
  );
}
