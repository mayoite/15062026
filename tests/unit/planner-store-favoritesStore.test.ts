import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useFavoritesStore } from "@/features/planner/store/favoritesStore";

describe("favoritesStore", () => {
  beforeEach(() => {
    const store = useFavoritesStore.getState();
    store.clearFavorites();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should hydrate from localStorage", () => {
    localStorage.setItem("planner.favorites", JSON.stringify(["item1", "item2"]));
    
    const { hydrate } = useFavoritesStore.getState();
    hydrate();
    
    expect(useFavoritesStore.getState().favorites).toEqual(["item1", "item2"]);
  });

  it("should add a favorite and persist it", () => {
    const { addFavorite } = useFavoritesStore.getState();
    addFavorite("item1");
    
    expect(useFavoritesStore.getState().favorites).toEqual(["item1"]);
    expect(localStorage.getItem("planner.favorites")).toBe(JSON.stringify(["item1"]));
  });

  it("should not add duplicate favorites", () => {
    const { addFavorite } = useFavoritesStore.getState();
    addFavorite("item1");
    addFavorite("item1");
    
    expect(useFavoritesStore.getState().favorites).toEqual(["item1"]);
  });

  it("should remove a favorite and persist it", () => {
    const { addFavorite, removeFavorite } = useFavoritesStore.getState();
    addFavorite("item1");
    addFavorite("item2");
    
    removeFavorite("item1");
    
    expect(useFavoritesStore.getState().favorites).toEqual(["item2"]);
    expect(localStorage.getItem("planner.favorites")).toBe(JSON.stringify(["item2"]));
  });

  it("should toggle a favorite", () => {
    const { toggleFavorite } = useFavoritesStore.getState();
    
    toggleFavorite("item1");
    expect(useFavoritesStore.getState().favorites).toEqual(["item1"]);
    
    toggleFavorite("item1");
    expect(useFavoritesStore.getState().favorites).toEqual([]);
  });

  it("should correctly identify if an item is favorited", () => {
    const { addFavorite, isFavorite } = useFavoritesStore.getState();
    
    expect(isFavorite("item1")).toBe(false);
    addFavorite("item1");
    expect(isFavorite("item1")).toBe(true);
  });

  it("should return all favorites", () => {
    const { addFavorite, getFavorites } = useFavoritesStore.getState();
    
    addFavorite("item1");
    addFavorite("item2");
    
    expect(getFavorites()).toEqual(["item1", "item2"]);
  });

  it("should clear all favorites", () => {
    const { addFavorite, clearFavorites } = useFavoritesStore.getState();
    
    addFavorite("item1");
    addFavorite("item2");
    
    clearFavorites();
    
    expect(useFavoritesStore.getState().favorites).toEqual([]);
    expect(localStorage.getItem("planner.favorites")).toBe(JSON.stringify([]));
  });

  it("should handle corrupted localStorage gracefully", () => {
    localStorage.setItem("planner.favorites", "corrupted-json{");
    
    const { hydrate } = useFavoritesStore.getState();
    hydrate();
    
    expect(useFavoritesStore.getState().favorites).toEqual([]);
  });
});

