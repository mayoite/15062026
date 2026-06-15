import { create } from "zustand";

const STORAGE_KEY = "planner.favorites";

/**
 * Loads favorites from localStorage.
 * Returns an empty array if no favorites exist or on parse error.
 */
function loadFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Persists favorites to localStorage.
 */
function saveFavorites(favorites: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Silently fail on quota exceeded or other storage errors
  }
}

export interface FavoritesState {
  /** Array of favorited catalog item IDs */
  favorites: string[];

  /**
   * Add a catalog item to favorites.
   * No-op if already favorited.
   */
  addFavorite: (itemId: string) => void;

  /**
   * Remove a catalog item from favorites.
   * No-op if not favorited.
   */
  removeFavorite: (itemId: string) => void;

  /**
   * Toggle the favorite state of a catalog item.
   */
  toggleFavorite: (itemId: string) => void;

  /**
   * Check if a catalog item is favorited.
   */
  isFavorite: (itemId: string) => boolean;

  /**
   * Get all favorited item IDs.
   */
  getFavorites: () => string[];

  /**
   * Clear all favorites.
   */
  clearFavorites: () => void;

  /**
   * Initialize favorites from localStorage.
   * Should be called on app mount.
   */
  hydrate: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],

  addFavorite: (itemId: string) => {
    const { favorites } = get();
    if (favorites.includes(itemId)) return;
    const updated = [...favorites, itemId];
    set({ favorites: updated });
    saveFavorites(updated);
  },

  removeFavorite: (itemId: string) => {
    const { favorites } = get();
    if (!favorites.includes(itemId)) return;
    const updated = favorites.filter((id) => id !== itemId);
    set({ favorites: updated });
    saveFavorites(updated);
  },

  toggleFavorite: (itemId: string) => {
    const { favorites, addFavorite, removeFavorite } = get();
    if (favorites.includes(itemId)) {
      removeFavorite(itemId);
    } else {
      addFavorite(itemId);
    }
  },

  isFavorite: (itemId: string) => {
    return get().favorites.includes(itemId);
  },

  getFavorites: () => {
    return get().favorites;
  },

  clearFavorites: () => {
    set({ favorites: [] });
    saveFavorites([]);
  },

  hydrate: () => {
    const favorites = loadFavorites();
    set({ favorites });
  },
}));
