"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme, type Theme } from "@/features/planner/components/WorkspaceThemeProvider";
import { PlannerTooltip } from "@/features/planner/ui/PlannerTooltip";

const OPTIONS: ReadonlyArray<{
  value: Theme;
  label: string;
  hint: string;
  Icon: typeof Sun;
}> = [
  { value: "light", label: "Light", hint: "Bright panels and canvas", Icon: Sun },
  { value: "system", label: "System", hint: "Match your device setting", Icon: Monitor },
  { value: "dark", label: "Dark", hint: "Low-glare midnight workspace", Icon: Moon },
];

export function PlannerThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="pw-theme-toggle" role="radiogroup" aria-label="Color theme">
      {OPTIONS.map(({ value, label, hint, Icon }) => (
        <PlannerTooltip key={value} label={label} hint={hint} side="bottom">
          <button
            type="button"
            role="radio"
            aria-checked={theme === value}
            aria-label={label}
            className="pw-theme-toggle-btn"
            data-active={theme === value}
            onClick={() => setTheme(value)}
          >
            <Icon size={15} strokeWidth={1.75} aria-hidden />
          </button>
        </PlannerTooltip>
      ))}
    </div>
  );
}
