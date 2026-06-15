"use client";
import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Traps Tab/Shift+Tab focus within a container element while active.
 * Restores focus to the previously focused element when deactivated.
 *
 * @param ref - React ref to the container element
 * @param active - Whether the focus trap is currently active
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * useFocusTrap(containerRef, isOpen);
 * return <div ref={containerRef}>...</div>;
 * ```
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean
): void {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store the currently focused element to restore later
    previousFocusRef.current = document.activeElement as HTMLElement;

    const container = ref.current;
    if (!container) return;

    // Focus the first focusable element in the container
    const timer = requestAnimationFrame(() => {
      const focusable = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      focusable?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      // Shift+Tab on first element -> wrap to last
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
      // Tab on last element -> wrap to first
      else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      cancelAnimationFrame(timer);
      document.removeEventListener("keydown", handleKeyDown, true);
      // Restore focus to the previously focused element
      previousFocusRef.current?.focus();
    };
  }, [ref, active]);
}
