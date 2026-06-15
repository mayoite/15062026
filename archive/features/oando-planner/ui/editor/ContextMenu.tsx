"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePlannerStore } from "@/features/oando-planner/data/plannerStore";
import { useToastStore } from "@/features/oando-planner/data/toastStore";
import { useEscapeDismiss } from "@/features/oando-planner/hooks/useEscapeDismiss";

interface Props {
  x: number;
  y: number;
  targetId: string | null;
  onClose: () => void;
  onZoomToFit?: () => void;
  onFurnishRoom?: (roomId: string) => void;
  previouslyFocusedElement?: Element | null;
  readOnly?: boolean;
}

interface MenuItem {
  label: string;
  shortcut?: string;
  action: () => void;
  danger?: boolean;
  divider?: boolean;
}

export function ContextMenu({
  x,
  y,
  targetId,
  onClose,
  onZoomToFit,
  onFurnishRoom,
  previouslyFocusedElement,
  readOnly = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const canMutate = !readOnly;

  const deleteItem = usePlannerStore((s) => s.deleteItem);
  const duplicateSelected = usePlannerStore((s) => s.duplicateSelected);
  const copySelected = usePlannerStore((s) => s.copySelected);
  const paste = usePlannerStore((s) => s.paste);
  const clipboard = usePlannerStore((s) => s.clipboard);
  const setSelected = usePlannerStore((s) => s.setSelected);
  const toggleGrid = usePlannerStore((s) => s.toggleGrid);
  const showGrid = usePlannerStore((s) => s.showGrid);
  const updateDoor = usePlannerStore((s) => s.updateDoor);
  const updateWindow = usePlannerStore((s) => s.updateWindow);
  const updateFurniture = usePlannerStore((s) => s.updateFurniture);
  const updateWall = usePlannerStore((s) => s.updateWall);
  const bringToFront = usePlannerStore((s) => s.bringToFront);
  const sendToBack = usePlannerStore((s) => s.sendToBack);
  const selectAll = usePlannerStore((s) => s.selectAll);
  const walls = usePlannerStore((s) => s.walls);
  const doors = usePlannerStore((s) => s.doors);
  const windows = usePlannerStore((s) => s.windows);
  const furniture = usePlannerStore((s) => s.furniture);
  const rooms = usePlannerStore((s) => s.rooms);
  const addToast = useToastStore((s) => s.addToast);

  const handleClose = useCallback(() => {
    onClose();
    if (previouslyFocusedElement && previouslyFocusedElement instanceof HTMLElement) {
      previouslyFocusedElement.focus();
    }
  }, [onClose, previouslyFocusedElement]);

  useEscapeDismiss(handleClose, true);

  useEffect(() => {
    firstButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    window.addEventListener("mousedown", handler);
    window.addEventListener("touchstart", handler);
    return () => {
      window.removeEventListener("mousedown", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, [handleClose]);

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (rect.right > vw) ref.current.style.left = `${x - rect.width}px`;
    if (rect.bottom > vh) ref.current.style.top = `${y - rect.height}px`;
  }, [x, y]);

  const isItemTarget =
    targetId &&
    (furniture.some((f) => f.id === targetId) ||
      doors.some((d) => d.id === targetId) ||
      windows.some((w) => w.id === targetId));
  const isWallTarget = targetId && walls.some((w) => w.id === targetId);
  const hasAnyItems =
    furniture.length > 0 || doors.length > 0 || windows.length > 0 || walls.length > 0;

  const menuItems: MenuItem[] = [];

  if (targetId && isItemTarget) {
    const door = doors.find((d) => d.id === targetId);
    const win = windows.find((w) => w.id === targetId);
    const furn = furniture.find((f) => f.id === targetId);

    menuItems.push({ label: "Properties", action: () => setSelected(targetId) });

    if (canMutate) {
      menuItems.push({
        label: "Duplicate",
        shortcut: "Ctrl+D",
        action: () => {
          setSelected(targetId);
          setTimeout(() => duplicateSelected(), 0);
        },
        divider: true,
      });
      menuItems.push({
        label: "Copy",
        shortcut: "Ctrl+C",
        action: () => {
          setSelected(targetId);
          setTimeout(() => copySelected(), 0);
        },
      });
    }

    if (canMutate && (furn || door || win)) {
      const currentRotation = furn ? furn.rotation : door ? door.rotation : win?.rotation ?? 0;
      menuItems.push({
        label: "Rotate 90°",
        action: () => {
          const newRot = (currentRotation + 90) % 360;
          if (furn) updateFurniture(targetId, { rotation: newRot });
          else if (door) updateDoor(targetId, { rotation: newRot });
          else if (win) updateWindow(targetId, { rotation: newRot });
        },
      });
      menuItems.push({
        label: "Bring to Front",
        action: () => {
          bringToFront(targetId);
          addToast("info", "Brought to front");
        },
      });
      menuItems.push({
        label: "Send to Back",
        action: () => {
          sendToBack(targetId);
          addToast("info", "Sent to back");
        },
      });
    }

    if (canMutate && door) {
      const currentSwing = door.swing || "right";
      const nextSwing =
        currentSwing === "right" ? "left" : currentSwing === "left" ? "double" : "right";
      menuItems.push({
        label: `Swing: ${currentSwing} -> ${nextSwing}`,
        action: () => updateDoor(targetId, { swing: nextSwing }),
      });
    }

    if (canMutate && win) {
      const currentStyle = win.style || "double";
      const nextStyle =
        currentStyle === "single"
          ? "double"
          : currentStyle === "double"
            ? "sliding"
            : "single";
      menuItems.push({
        label: `Style: ${currentStyle} -> ${nextStyle}`,
        action: () => updateWindow(targetId, { style: nextStyle }),
      });
    }

    if (canMutate) {
      menuItems.push({ label: "", action: () => {}, divider: true });
      menuItems.push({
        label: "Delete",
        shortcut: "Del",
        action: () => deleteItem(targetId),
        danger: true,
      });
    }
  } else if (targetId && isWallTarget) {
    menuItems.push({ label: "Properties", action: () => setSelected(targetId) });
    const wall = walls.find((w) => w.id === targetId);
    if (canMutate && wall) {
      const nextThickness = wall.thickness >= 16 ? 6 : wall.thickness + 2;
      menuItems.push({
        label: `Thickness: ${wall.thickness}px -> ${nextThickness}px`,
        action: () => updateWall(targetId, { thickness: nextThickness }),
      });
    }
    if (canMutate) {
      menuItems.push({
        label: "Delete Wall",
        shortcut: "Del",
        action: () => deleteItem(targetId),
        danger: true,
      });
    }
  } else {
    if (canMutate && clipboard) {
      menuItems.push({
        label: "Paste",
        shortcut: "Ctrl+V",
        action: () => paste(),
      });
    }
    if (canMutate && hasAnyItems) {
      menuItems.push({
        label: "Select All",
        shortcut: "Ctrl+A",
        action: () => selectAll(),
      });
    }
    menuItems.push({ label: showGrid ? "Hide Grid" : "Show Grid", shortcut: "G", action: toggleGrid });
    if (canMutate && onZoomToFit) {
      menuItems.push({ label: "Zoom to Fit", action: () => onZoomToFit() });
    }
    if (canMutate && rooms.length > 0 && onFurnishRoom) {
      menuItems.push({ label: "", action: () => {}, divider: true });
      rooms.forEach((room) => {
        menuItems.push({
          label: `Furnish "${room.name}"`,
          action: () => onFurnishRoom(room.id),
        });
      });
    }
  }

  if (menuItems.length === 0) return null;

  return (
    <div
      ref={ref}
      className="fixed bg-[var(--surface-inverse)] backdrop-blur-xl border border-[var(--color-accent)] rounded-xl shadow-2xl py-1 z-[9999] min-w-[200px]"
      style={{ left: x, top: y }}
      onContextMenu={(e) => e.preventDefault()}
      role="menu"
      aria-label="Context menu"
    >
      {menuItems.map((item, i) => {
        if (item.divider && !item.label) {
          return <div key={i} className="h-px bg-[var(--color-accent)]/10 my-1" role="separator" />;
        }
        const isFirstButton = menuItems.findIndex((m) => m.label) === i;
        return (
          <button
            key={i}
            ref={isFirstButton ? firstButtonRef : undefined}
            onClick={() => {
              item.action();
              handleClose();
            }}
            role="menuitem"
            className={`w-full text-left px-3 py-2.5 md:py-1.5 text-[12px] flex items-center justify-between gap-4 transition-colors min-h-[44px] md:min-h-0 rounded-lg mx-0 ${
              item.danger
                ? "text-red-400 hover:bg-red-500/10 active:bg-red-500/10"
                : "text-white/75 hover:bg-white/[0.06] hover:text-white active:bg-white/[0.06]"
            }`}
          >
            <span>{item.label}</span>
            {item.shortcut && <span className="text-[10px] text-white/25">{item.shortcut}</span>}
          </button>
        );
      })}
    </div>
  );
}
