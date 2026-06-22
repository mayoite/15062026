"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useFloorplan } from "./context/FloorplanContext";


export function FabricCanvasContextMenu() {
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    contextMenu,
    closeContextMenu,
    selections,
    roomEdit,
    endEditRoom,
    clone,
    copy,
    paste,
    deleteSelection,
    performOperation,
  } = useFloorplan();

  useEffect(() => {
    if (!contextMenu) return;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button === 2) return;
      if (!menuRef.current?.contains(event.target as Node)) {
        closeContextMenu();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeContextMenu();
    };
    const onScroll = () => closeContextMenu();

    const attachTimer = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown);
    }, 0);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      window.clearTimeout(attachTimer);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [closeContextMenu, contextMenu]);

  if (!contextMenu || typeof document === "undefined") return null;


  const hasSelection = selections.length > 0 || Boolean(contextMenu.target);

  const run = (action: () => void) => {
    action();
    closeContextMenu();
  };

  const menu = (
    <div
      ref={menuRef}
      className="fcw-context-menu"
      role="menu"
      style={{ left: contextMenu.clientX, top: contextMenu.clientY }}
    >
      {roomEdit ? (
        <>
          <button
            type="button"
            role="menuitem"
            className="fcw-context-menu__item"
            onClick={() => run(() => endEditRoom())}
          >
            End room edit
          </button>
          <div className="fcw-context-menu__divider" role="separator" />
          <button
            type="button"
            role="menuitem"
            className="fcw-context-menu__item fcw-context-menu__item--danger"
            disabled={!hasSelection}
            onClick={() => run(() => deleteSelection())}
          >
            Delete
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            role="menuitem"
            className="fcw-context-menu__item"
            onClick={() => run(() => performOperation("COPY"))}
          >
            Copy
          </button>
          <button type="button" role="menuitem" className="fcw-context-menu__item" onClick={() => run(() => paste())}>
            Paste
          </button>
          <button
            type="button"
            role="menuitem"
            className="fcw-context-menu__item"
            disabled={!hasSelection}
            onClick={() => run(() => clone())}
          >
            Duplicate
          </button>
          <button
            type="button"
            role="menuitem"
            className="fcw-context-menu__item fcw-context-menu__item--danger"
            disabled={!hasSelection}
            onClick={() => run(() => deleteSelection())}
          >
            Delete
          </button>
          <div className="fcw-context-menu__divider" role="separator" />
          <button
            type="button"
            role="menuitem"
            className="fcw-context-menu__item"
            disabled={!hasSelection}
            onClick={() => run(() => copy())}
          >
            Copy selection
          </button>
        </>
      )}
    </div>
  );

  return createPortal(menu, document.body);
}