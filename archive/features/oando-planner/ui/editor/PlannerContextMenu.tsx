"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useEditor } from "tldraw";
import { ContextMenu } from "./ContextMenu";

/** Long-press duration in milliseconds for touch devices */
const LONG_PRESS_DURATION = 500;

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  targetId: string | null;
  previouslyFocusedElement: Element | null;
}

/**
 * PlannerContextMenu - Wrapper component that integrates the ContextMenu with tldraw.
 * 
 * This component:
 * - Listens for right-click events on the tldraw canvas
 * - Listens for long-press events on touch devices (500ms)
 * - Gets the shape under the pointer from tldraw
 * - Shows the ContextMenu at the appropriate position
 * - Uses useEscapeDismiss for keyboard accessibility
 * 
 * Mount this component inside the <Tldraw> provider to access the editor.
 */
export function PlannerContextMenu({ readOnly = false }: { readOnly?: boolean }) {
  const editor = useEditor();
  const [menuState, setMenuState] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    targetId: null,
    previouslyFocusedElement: null,
  });

  // Refs for long-press handling
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  /**
   * Get the shape ID under the given screen coordinates.
   * Strips the "shape:" prefix to get the plain UUID used by the Zustand store.
   */
  const getShapeIdAtPoint = useCallback((screenX: number, screenY: number): string | null => {
    if (!editor) return null;

    // Convert screen coordinates to page coordinates
    const pagePoint = editor.screenToPage({ x: screenX, y: screenY });
    
    // Get the shape at the point
    const shapeAtPoint = editor.getShapeAtPoint(pagePoint, {
      hitInside: true,
      margin: 0,
    });

    if (shapeAtPoint) {
      // Strip the "shape:" prefix to get the plain UUID
      const id = shapeAtPoint.id;
      return id.startsWith("shape:") ? id.slice(6) : id;
    }

    return null;
  }, [editor]);

  /**
   * Open the context menu at the given position with the given target shape.
   */
  const openContextMenu = useCallback((x: number, y: number, targetId: string | null) => {
    setMenuState({
      isOpen: true,
      x,
      y,
      targetId,
      previouslyFocusedElement: document.activeElement,
    });
  }, []);

  /**
   * Close the context menu.
   */
  const closeContextMenu = useCallback(() => {
    setMenuState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  /**
   * Clear the long-press timer.
   */
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
  }, []);

  // Handle right-click (contextmenu) events
  useEffect(() => {
    if (!editor) return;

    const container = editor.getContainer();
    if (!container) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const targetId = getShapeIdAtPoint(e.clientX, e.clientY);
      openContextMenu(e.clientX, e.clientY, targetId);
    };

    container.addEventListener("contextmenu", handleContextMenu);

    return () => {
      container.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [editor, getShapeIdAtPoint, openContextMenu]);

  // Handle long-press for touch devices
  useEffect(() => {
    if (!editor) return;

    const container = editor.getContainer();
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only handle single-finger touches
      if (e.touches.length !== 1) {
        clearLongPressTimer();
        return;
      }

      const touch = e.touches[0];
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

      // Start the long-press timer
      longPressTimerRef.current = setTimeout(() => {
        if (touchStartPosRef.current) {
          const targetId = getShapeIdAtPoint(touchStartPosRef.current.x, touchStartPosRef.current.y);
          openContextMenu(touchStartPosRef.current.x, touchStartPosRef.current.y, targetId);
          
          // Prevent the default touch behavior after long-press
          e.preventDefault();
        }
        clearLongPressTimer();
      }, LONG_PRESS_DURATION);
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Cancel long-press if the finger moves too much
      if (touchStartPosRef.current && e.touches.length === 1) {
        const touch = e.touches[0];
        const dx = touch.clientX - touchStartPosRef.current.x;
        const dy = touch.clientY - touchStartPosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Cancel if moved more than 10 pixels
        if (distance > 10) {
          clearLongPressTimer();
        }
      }
    };

    const handleTouchEnd = () => {
      clearLongPressTimer();
    };

    const handleTouchCancel = () => {
      clearLongPressTimer();
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchCancel);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchCancel);
      clearLongPressTimer();
    };
  }, [editor, getShapeIdAtPoint, openContextMenu, clearLongPressTimer]);

  // Close context menu when clicking elsewhere on the canvas
  useEffect(() => {
    if (!editor || !menuState.isOpen) return;

    const container = editor.getContainer();
    if (!container) return;

    const handlePointerDown = (e: PointerEvent) => {
      // The ContextMenu component handles its own click-outside logic,
      // but we also close when clicking on the canvas
      const target = e.target as HTMLElement;
      if (container.contains(target)) {
        // Check if the click is on the canvas (not on the context menu)
        const contextMenuEl = document.querySelector('[role="menu"][aria-label="Context menu"]');
        if (!contextMenuEl?.contains(target)) {
          closeContextMenu();
        }
      }
    };

    // Use a small delay to avoid closing immediately after opening
    const timeoutId = setTimeout(() => {
      container.addEventListener("pointerdown", handlePointerDown);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      container.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [editor, menuState.isOpen, closeContextMenu]);

  if (!menuState.isOpen) {
    return null;
  }

  return (
    <ContextMenu
      x={menuState.x}
      y={menuState.y}
      targetId={menuState.targetId}
      onClose={closeContextMenu}
      previouslyFocusedElement={menuState.previouslyFocusedElement}
      readOnly={readOnly}
    />
  );
}
