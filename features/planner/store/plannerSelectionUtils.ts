import type {
  ClipboardEntry,
  DoorItem,
  FurnitureItem,
  PlannerState,
  Room,
  Wall,
  WindowItem,
} from "./plannerStore";

export function getSelectedItemTypeFromState(
  state: PlannerState
): "wall" | "room" | "furniture" | "door" | "window" | null {
  if (!state.selectedId) return null;
  if (state.walls.find((wall) => wall.id === state.selectedId)) return "wall";
  if (state.rooms.find((room) => room.id === state.selectedId)) return "room";
  if (state.furniture.find((item) => item.id === state.selectedId)) return "furniture";
  if (state.doors.find((door) => door.id === state.selectedId)) return "door";
  if (state.windows.find((window) => window.id === state.selectedId)) return "window";
  return null;
}

export function getSelectedItemFromState(
  state: PlannerState
): Wall | Room | FurnitureItem | DoorItem | WindowItem | null {
  if (!state.selectedId) return null;
  return (
    state.walls.find((wall) => wall.id === state.selectedId) ||
    state.rooms.find((room) => room.id === state.selectedId) ||
    state.furniture.find((item) => item.id === state.selectedId) ||
    state.doors.find((door) => door.id === state.selectedId) ||
    state.windows.find((window) => window.id === state.selectedId) ||
    null
  );
}

export function getClipboardEntryFromState(state: PlannerState): ClipboardEntry | null {
  if (!state.selectedId) return null;

  const furnitureItem = state.furniture.find((item) => item.id === state.selectedId);
  if (furnitureItem) {
    return { type: "furniture", data: { ...furnitureItem } };
  }

  const doorItem = state.doors.find((item) => item.id === state.selectedId);
  if (doorItem) {
    return { type: "door", data: { ...doorItem } };
  }

  const windowItem = state.windows.find((item) => item.id === state.selectedId);
  if (windowItem) {
    return { type: "window", data: { ...windowItem } };
  }

  return null;
}

export function getSelectAllTargetId(state: PlannerState): string | null {
  if (state.furniture.length > 0) return state.furniture[state.furniture.length - 1].id;
  if (state.doors.length > 0) return state.doors[state.doors.length - 1].id;
  if (state.windows.length > 0) return state.windows[state.windows.length - 1].id;
  if (state.walls.length > 0) return state.walls[state.walls.length - 1].id;
  return null;
}

export function buildPastedClipboardEntry(
  clipboard: ClipboardEntry,
  generateId: () => string,
  offset = 20
): ClipboardEntry {
  if (clipboard.type === "furniture") {
    const item = clipboard.data as FurnitureItem;
    return {
      type: "furniture",
      data: { ...item, id: generateId(), x: item.x + offset, y: item.y + offset },
    };
  }

  if (clipboard.type === "door") {
    const item = clipboard.data as DoorItem;
    return {
      type: "door",
      data: { ...item, id: generateId(), x: item.x + offset, y: item.y + offset },
    };
  }

  const item = clipboard.data as WindowItem;
  return {
    type: "window",
    data: { ...item, id: generateId(), x: item.x + offset, y: item.y + offset },
  };
}

export function buildPasteStatePatch(
  pasted: ClipboardEntry
): Pick<PlannerState, "furniture" | "doors" | "windows" | "selectedId" | "isDirty"> {
  if (pasted.type === "furniture") {
    const newItem = pasted.data;
    return {
      furniture: [newItem],
      doors: [],
      windows: [],
      selectedId: newItem.id,
      isDirty: true,
    };
  }

  if (pasted.type === "door") {
    const newItem = pasted.data;
    return {
      furniture: [],
      doors: [newItem],
      windows: [],
      selectedId: newItem.id,
      isDirty: true,
    };
  }

  const newItem = pasted.data;
  return {
    furniture: [],
    doors: [],
    windows: [newItem],
    selectedId: newItem.id,
    isDirty: true,
  };
}
