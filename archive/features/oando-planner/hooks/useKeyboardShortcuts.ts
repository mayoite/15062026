"use client";
import { useEffect } from "react";
import { usePlannerStore } from "../data/plannerStore";

export function useKeyboardShortcuts(readOnly = false) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      const store = usePlannerStore.getState();
      const isCtrl = e.ctrlKey || e.metaKey;

      if (readOnly) {
        if (e.key.toLowerCase() === "escape") {
          store.cancelDrawing();
        }
        return;
      }

      if (isCtrl && e.key.toLowerCase() === "z" && e.shiftKey) {
        e.preventDefault();
        store.redo();
        return;
      }
      if (isCtrl && e.key.toLowerCase() === "z") {
        e.preventDefault();
        store.undo();
        return;
      }
      if (isCtrl && e.key.toLowerCase() === "y") {
        e.preventDefault();
        store.redo();
        return;
      }
      if (isCtrl && e.key.toLowerCase() === "c") {
        e.preventDefault();
        store.copySelected();
        return;
      }
      if (isCtrl && e.key.toLowerCase() === "v") {
        e.preventDefault();
        store.paste();
        return;
      }
      if (isCtrl && e.key.toLowerCase() === "d") {
        e.preventDefault();
        store.duplicateSelected();
        return;
      }

      if (isCtrl && e.key.toLowerCase() === "a") {
        e.preventDefault();
        store.selectAll();
        return;
      }

      if (isCtrl) return;

      switch (e.key.toLowerCase()) {
        case "v":
          store.setTool("select");
          break;
        case "h":
          store.setTool("pan");
          break;
        case "w":
          store.setTool("wall");
          break;
        case "r":
          store.setTool("room");
          break;
        case "d":
          store.setTool("door");
          break;
        case "n":
          store.setTool("window");
          break;
        case "f":
          store.setTool("furniture");
          break;
        case "x":
          store.setTool("eraser");
          break;
        case "m":
          store.setTool("measure");
          break;
        case "z":
          store.setTool("zone");
          break;
        case "g":
          store.toggleGrid();
          break;
        case "delete":
        case "backspace":
          if (store.selectedId) {
            store.deleteItem(store.selectedId);
          }
          break;
        case "escape":
          store.cancelDrawing();
          store.setTool("select");
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [readOnly]);
}
