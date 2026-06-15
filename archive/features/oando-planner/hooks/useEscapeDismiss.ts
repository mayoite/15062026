"use client";
import { useEffect } from "react";

/**
 * Registers an Escape key listener that calls the provided callback when pressed.
 * The listener is only active when `active` is true.
 *
 * @param onDismiss - Callback to invoke when Escape is pressed
 * @param active - Whether the listener is currently active (default: true)
 *
 * @example
 * ```tsx
 * useEscapeDismiss(() => setIsOpen(false), isOpen);
 * ```
 */
export function useEscapeDismiss(
  onDismiss: () => void,
  active: boolean = true
): void {
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onDismiss();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [onDismiss, active]);
}
