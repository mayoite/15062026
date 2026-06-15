"use client";

interface EmptyCanvasStateProps {
  onDrawWalls: () => void;
  onUseTemplate: () => void;
  onImportBlueprint: () => void;
}

/**
 * EmptyCanvasState — shown centered on the canvas when there are zero walls
 * AND zero furniture items. Provides quick-start actions.
 */
export function EmptyCanvasState({
  onDrawWalls,
  onUseTemplate,
  onImportBlueprint,
}: EmptyCanvasStateProps) {
  return (
    <div
      className="empty-canvas-state pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-8"
      role="region"
      aria-label="Empty workspace"
    >
      <div className="empty-canvas-state__card pointer-events-auto flex flex-col items-center gap-4 rounded-2xl border border-soft bg-panel px-10 py-12 text-center shadow-xl">
        {/* Icon — simple SVG floorplan outline */}
        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]">
          <svg
            width="36"
            height="36"
            viewBox="0 0 36 36"
            fill="none"
            aria-hidden="true"
            className="text-[var(--color-primary)]"
          >
            <rect x="3" y="3" width="30" height="30" rx="3" stroke="currentColor" strokeWidth="2" />
            <line x1="3" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="2" />
            <line x1="20" y1="3" x2="20" y2="24" stroke="currentColor" strokeWidth="2" />
            <line x1="20" y1="24" x2="33" y2="24" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <h2 className="typ-subsection-title text-lg font-semibold">
          Your workspace is empty
        </h2>
        <p className="max-w-xs text-sm leading-relaxed text-soft">
          Start designing your office layout
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onDrawWalls}
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <line x1="1" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Draw walls
          </button>
          <button
            type="button"
            onClick={onUseTemplate}
            className="btn-outline inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Use template
          </button>
          <button
            type="button"
            onClick={onImportBlueprint}
            className="btn-outline inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M1 10v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Import blueprint
          </button>
        </div>
      </div>
    </div>
  );
}
