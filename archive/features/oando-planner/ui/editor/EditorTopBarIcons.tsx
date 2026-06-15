import React from "react";

// ── SVG icons (module scope — avoids "Cannot create components during render") ──
export const Ic = {
  Logo: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="5" height="5" rx="0.5"/>
      <rect x="8" y="1" width="5" height="5" rx="0.5"/>
      <rect x="1" y="8" width="5" height="5" rx="0.5"/>
      <rect x="8" y="8" width="5" height="5" rx="0.5"/>
    </svg>
  ),
  Undo: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 5V9h4"/><path d="M12 9a5 5 0 0 0-5-5 5 5 0 0 0-3.5 1.5L2 7"/>
    </svg>
  ),
  Redo: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5V9H8"/><path d="M2 9a5 5 0 0 1 5-5 5 5 0 0 1 3.5 1.5L12 7"/>
    </svg>
  ),
  Templates: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="5" height="5" rx="0.5"/><rect x="8" y="1" width="5" height="5" rx="0.5"/>
      <rect x="1" y="8" width="5" height="5" rx="0.5"/><rect x="8" y="8" width="5" height="5" rx="0.5"/>
    </svg>
  ),
  Projects: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 11V4a1 1 0 0 1 1-1h3l1.5 2H12a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z"/>
    </svg>
  ),
  NewFile: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6z"/>
      <path d="M8 1v5h4M7 8v4M5 10h4"/>
    </svg>
  ),
  Open: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3.5L4.5 6 7 8.5M4.5 6H10"/><circle cx="7" cy="7" r="5.5"/>
    </svg>
  ),
  Save: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 13H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h6.5L12 3.5V12a1 1 0 0 1-1 1z"/>
      <path d="M9 1v3H4V1M4 13V8.5h6V13"/>
    </svg>
  ),
  BOQ: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="12" height="12" rx="1"/>
      <path d="M4 5h6M4 7.5h6M4 10h4"/>
    </svg>
  ),
  Import: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 9V2M4.5 6.5L7 9l2.5-2.5"/><path d="M1 11h12"/>
    </svg>
  ),
  Clusters: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="5" height="5" rx="0.5"/><rect x="8" y="1" width="5" height="5" rx="0.5"/>
      <rect x="1" y="8" width="11" height="5" rx="0.5"/>
    </svg>
  ),
  Arrange: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 7h12M7 1v12M3 3l8 8M11 3l-8 8" opacity="0.4"/><circle cx="7" cy="7" r="2"/>
    </svg>
  ),
  Zones: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="12" height="12" rx="1" strokeDasharray="2.5 1.5"/>
      <rect x="3.5" y="3.5" width="7" height="7" rx="0.5"/>
    </svg>
  ),
  Spacing: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M1 3.5h12M1 10.5h12M3.5 3.5v7M10.5 3.5v7"/>
    </svg>
  ),
  Present: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="2" width="12" height="8" rx="1"/><path d="M7 10v2M4.5 12h5"/>
    </svg>
  ),
  AI: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 1l1.8 3.6L13 5.3l-3 2.9.7 4.1L7 10.1l-3.7 2.2.7-4.1-3-2.9 4.2-.7z"/>
    </svg>
  ),
  Integrations: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M2 12a8 8 0 0 1 8-8M2 12a5 5 0 0 1 5-5"/><circle cx="2.5" cy="11.5" r="1"/>
    </svg>
  ),
  Export: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 1v8M4.5 3.5L7 1l2.5 2.5"/><path d="M1 10v2.5h12V10"/>
    </svg>
  ),
  Shortcut: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="12" height="8" rx="1.5"/>
      <path d="M4 7h6M7 5v4" opacity="0.5"/>
    </svg>
  ),
  Hamburger: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 4.5L6 8l3.5-3.5"/>
    </svg>
  ),
  PDF: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6z"/><path d="M8 1v5h4"/>
      <path d="M4.5 8.5h2a1 1 0 1 1 0 2h-2v-4h2a.8.8 0 1 1 0 1.5" opacity="0.7"/>
    </svg>
  ),
  SVG: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="12" height="12" rx="1"/><path d="M4 8.5c0 1 .7 1.5 1.5 1.5S7 9.5 7 8.5 5.5 7 5.5 6s.5-1.5 1.5-1.5M8.5 5H10l-1.5 4.5L10 9"/>
    </svg>
  ),
  PNG: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="12" height="12" rx="1"/>
      <path d="M1 9.5l3-3 2.5 2.5 2-2 3.5 3.5" opacity="0.7"/>
      <circle cx="10" cy="4.5" r="1.5" opacity="0.7"/>
    </svg>
  ),
  CSV: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="12" height="12" rx="1"/>
      <path d="M1 5h12M1 8.5h12M5 5v7M9 5v7"/>
    </svg>
  ),
  JSON: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h1.5M9.5 2H11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9.5"/>
      <path d="M6 7h2M6 5h2M6 9h1"/>
    </svg>
  ),
  Share: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="3" r="1.5"/><circle cx="11" cy="11" r="1.5"/><circle cx="3" cy="7" r="1.5"/>
      <path d="M4.4 6.2l5.2-2.6M4.4 7.8l5.2 2.6"/>
    </svg>
  ),
  Portal: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="5.5"/><path d="M7 1.5a8 8 0 0 1 0 11M7 1.5a8 8 0 0 0 0 11M1.5 7h11"/>
    </svg>
  ),
  Image: () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="2.5" width="12" height="9" rx="1"/>
      <path d="M1 8.5l3-2.5 2.5 2.5 2-1.5 3.5 3" opacity="0.7"/>
      <circle cx="9.5" cy="5.5" r="1" opacity="0.7"/>
    </svg>
  ),
};

// Thin icon-button component for the top bar
export function TBtn({
  onClick, title, active, disabled = false, children, className = "",
}: {
  onClick?: () => void; title: string; active?: boolean; disabled?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={[
        "planner-topbar__btn",
        active ? "planner-topbar__btn--active" : "",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function Divider() {
  return <div className="planner-topbar__divider" />;
}
