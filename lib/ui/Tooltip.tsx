"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

interface TooltipProps {
  /** The content to show in the tooltip */
  content: ReactNode;
  /** The element that triggers the tooltip */
  children: ReactNode;
  /** Tooltip position relative to trigger */
  position?: "top" | "bottom" | "left" | "right";
  /** Delay before showing (ms) */
  delay?: number;
  /** Whether tooltip is a rich card vs plain text */
  variant?: "default" | "rich";
}

export function Tooltip({
  content,
  children,
  position = "top",
  delay = 400,
  variant = "default",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {isVisible && (
        <span
          role="tooltip"
          className={`absolute z-[100] pointer-events-none ${positionClasses[position]} ${
            variant === "rich"
              ? "w-64 rounded-lg border p-3 shadow-lg"
              : "max-w-xs rounded px-2 py-1 text-xs"
          }`}
          style={{
            background: variant === "rich" ? "var(--surface-page, #fff)" : "var(--surface-inverse, #1a1a1a)",
            color: variant === "rich" ? "var(--text-body, #333)" : "var(--text-inverse, #fff)",
            borderColor: variant === "rich" ? "var(--border-soft, #e5e5e5)" : "transparent",
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}

/** Contextual help tooltip with a "?" trigger */
export function HelpTip({
  content,
  position = "top",
}: {
  content: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <Tooltip content={content} position={position} variant="rich" delay={200}>
      <button
        type="button"
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold leading-none border"
        style={{
          borderColor: "var(--border-soft, #e5e5e5)",
          color: "var(--text-muted, #666)",
          background: "var(--surface-soft, #f9f9f7)",
        }}
        aria-label="Help"
      >
        ?
      </button>
    </Tooltip>
  );
}
