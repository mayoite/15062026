"use client";

import type { ReactElement, ReactNode } from "react";

export type PlannerTooltipSide = "top" | "right" | "bottom" | "left";

interface PlannerTooltipProps {
  label: string;
  hint?: string;
  shortcut?: string;
  side?: PlannerTooltipSide;
  disabled?: boolean;
  children: ReactElement;
}

export function PlannerTooltip({
  label,
  hint,
  shortcut,
  side = "right",
  disabled = false,
  children,
}: PlannerTooltipProps) {
  if (disabled) return children;

  return (
    <span className="pw-tooltip" data-side={side}>
      {children}
      <span className="pw-tooltip-bubble" role="tooltip">
        <span className="pw-tooltip-row">
          <span className="pw-tooltip-label">{label}</span>
          {shortcut ? <kbd className="pw-tooltip-kbd">{shortcut}</kbd> : null}
        </span>
        {hint ? <span className="pw-tooltip-hint">{hint}</span> : null}
      </span>
    </span>
  );
}

export function PlannerIconButton({
  label,
  hint,
  shortcut,
  tooltipSide,
  className = "pw-icon-btn",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  hint?: string;
  shortcut?: string;
  tooltipSide?: PlannerTooltipSide;
  children: ReactNode;
}) {
  return (
    <PlannerTooltip label={label} hint={hint} shortcut={shortcut} side={tooltipSide}>
      <button type="button" className={className} aria-label={label} {...props}>
        {children}
      </button>
    </PlannerTooltip>
  );
}
