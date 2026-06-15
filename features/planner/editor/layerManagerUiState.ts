import {
  LAYER_MANAGER_CATEGORIES,
  type LayerManagerCategory,
} from "@/features/planner/editor/layerManagerEntries";

export interface LayerManagerUiState {
  activeCategory: LayerManagerCategory;
  query: string;
  collapsedGroups: Record<string, boolean>;
}

export const LAYER_MANAGER_UI_STATE_KEY = "planner.layer-manager.ui-state";

export const DEFAULT_LAYER_MANAGER_UI_STATE: LayerManagerUiState = {
  activeCategory: "all",
  query: "",
  collapsedGroups: {},
};

export function normalizeLayerManagerUiState(
  value: unknown,
): LayerManagerUiState {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_LAYER_MANAGER_UI_STATE };
  }

  const record = value as Record<string, unknown>;
  const activeCategory = LAYER_MANAGER_CATEGORIES.includes(
    record.activeCategory as LayerManagerCategory,
  )
    ? (record.activeCategory as LayerManagerCategory)
    : DEFAULT_LAYER_MANAGER_UI_STATE.activeCategory;

  const query =
    typeof record.query === "string"
      ? record.query
      : DEFAULT_LAYER_MANAGER_UI_STATE.query;

  const collapsedGroups =
    record.collapsedGroups && typeof record.collapsedGroups === "object"
      ? (Object.fromEntries(
          Object.entries(record.collapsedGroups as Record<string, unknown>).filter(
            ([, groupValue]) => typeof groupValue === "boolean",
          ),
        ) as Record<string, boolean>)
      : {};

  return {
    activeCategory,
    query,
    collapsedGroups,
  };
}

export function loadLayerManagerUiStateFromStorage(): LayerManagerUiState {
  if (typeof window === "undefined") {
    return { ...DEFAULT_LAYER_MANAGER_UI_STATE };
  }

  try {
    const raw = window.localStorage.getItem(LAYER_MANAGER_UI_STATE_KEY);
    if (!raw) {
      return { ...DEFAULT_LAYER_MANAGER_UI_STATE };
    }

    return normalizeLayerManagerUiState(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_LAYER_MANAGER_UI_STATE };
  }
}
