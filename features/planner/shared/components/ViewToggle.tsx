"use client";

import { useState, useEffect, useCallback } from "react";
import { PenTool, Box } from "lucide-react";

type View = "2d" | "3d";

interface ViewToggleProps {
  activeView: View;
  onToggle: (view: View) => void;
}

export function ViewToggle({ activeView, onToggle }: ViewToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="View mode"
      className="flex h-9 items-center border-b border-[color:var(--border-soft)]"
    >
      <button
        role="tab"
        aria-selected={activeView === "2d"}
        onClick={() => onToggle("2d")}
        className={`relative flex h-full items-center gap-1.5 px-4 text-xs font-medium transition-colors ${
          activeView === "2d" ? "text-strong" : "text-muted"
        }`}
      >
        <PenTool size={13} />
        2D Plan
        {activeView === "2d" && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[color:var(--color-primary)]" />
        )}
      </button>
      <button
        role="tab"
        aria-selected={activeView === "3d"}
        onClick={() => onToggle("3d")}
        className={`relative flex h-full items-center gap-1.5 px-4 text-xs font-medium transition-colors ${
          activeView === "3d" ? "text-strong" : "text-muted"
        }`}
      >
        <Box size={13} />
        3D View
        {activeView === "3d" && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[color:var(--color-primary)]" />
        )}
      </button>
    </div>
  );
}

export function useViewToggle() {
  const [activeView, setActiveView] = useState<View>("2d");

  const toggle = useCallback(() => {
    setActiveView((v) => (v === "2d" ? "3d" : "2d"));
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Tab" && e.ctrlKey) {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [toggle]);

  return { activeView, setActiveView, toggle };
}