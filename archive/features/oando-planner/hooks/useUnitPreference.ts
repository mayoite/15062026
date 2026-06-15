/**
 * useUnitPreference Hook
 *
 * React hook for accessing and updating the user's unit preference.
 * Provides reactive state that updates when the preference changes.
 *
 * @see design.md - hooks section
 * @validates REQ-25 (Unit preference)
 */

"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  type Unit,
  getUserUnit,
  setUserUnit,
  formatMeasurement,
  fromMm,
  toMm,
  getAvailableUnits,
  getUnitLabel,
  getUnitShortLabel,
} from "../lib/units";

// Event name for cross-component synchronization
const UNIT_CHANGE_EVENT = "planner:unit-preference-changed";

// Subscribers for external store pattern
let listeners: Array<() => void> = [];

function subscribe(listener: () => void): () => void {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function emitChange(): void {
  // Notify all subscribers
  for (const listener of listeners) {
    listener();
  }
  // Also dispatch a custom event for cross-tab/window sync
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(UNIT_CHANGE_EVENT));
  }
}

function getSnapshot(): Unit {
  return getUserUnit();
}

function getServerSnapshot(): Unit {
  return "cm"; // Default for SSR
}

export interface UseUnitPreferenceReturn {
  /** Current unit preference */
  unit: Unit;
  /** Update the unit preference */
  setUnit: (unit: Unit) => void;
  /** Format a mm value using the current unit preference */
  format: (mm: number) => string;
  /** Convert from mm to current unit */
  fromMm: (mm: number) => number;
  /** Convert to mm from current unit */
  toMm: (value: number) => number;
  /** All available units */
  availableUnits: readonly Unit[];
  /** Get label for a unit */
  getLabel: (unit: Unit) => string;
  /** Get short label for a unit */
  getShortLabel: (unit: Unit) => string;
}

/**
 * Hook for managing user unit preference
 *
 * @example
 * ```tsx
 * function MeasurementDisplay({ valueMm }: { valueMm: number }) {
 *   const { format, unit, setUnit, availableUnits } = useUnitPreference();
 *
 *   return (
 *     <div>
 *       <span>{format(valueMm)}</span>
 *       <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
 *         {availableUnits.map((u) => (
 *           <option key={u} value={u}>{u}</option>
 *         ))}
 *       </select>
 *     </div>
 *   );
 * }
 * ```
 */
export function useUnitPreference(): UseUnitPreferenceReturn {
  // Use useSyncExternalStore for consistent state across components
  const unit = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Listen for storage events (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "planner.unit") {
        emitChange();
      }
    };

    const handleCustomEvent = () => {
      // Force re-render when custom event is dispatched
      emitChange();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(UNIT_CHANGE_EVENT, handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(UNIT_CHANGE_EVENT, handleCustomEvent);
    };
  }, []);

  const setUnit = useCallback((newUnit: Unit) => {
    setUserUnit(newUnit);
    emitChange();
  }, []);

  const format = useCallback(
    (mm: number) => formatMeasurement(mm, unit),
    [unit]
  );

  const convertFromMm = useCallback(
    (mm: number) => fromMm(mm, unit),
    [unit]
  );

  const convertToMm = useCallback(
    (value: number) => toMm(value, unit),
    [unit]
  );

  return {
    unit,
    setUnit,
    format,
    fromMm: convertFromMm,
    toMm: convertToMm,
    availableUnits: getAvailableUnits(),
    getLabel: getUnitLabel,
    getShortLabel: getUnitShortLabel,
  };
}

export type { Unit };
