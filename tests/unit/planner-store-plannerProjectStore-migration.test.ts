import { describe, expect, it, vi } from "vitest";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      const value = store.get(key);
      return value === undefined ? null : value;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe("plannerProjectStore migration", () => {
  it("logs quota errors when migration persistence fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const storage = createMemoryStorage();
    storage.setItem("planner_projects", JSON.stringify(["legacy-project-key"]));
    storage.setItem(
      "legacy-project-key",
      JSON.stringify({ projectName: "Legacy", walls: [], rooms: [], furniture: [] }),
    );
    const quotaError = Object.create(DOMException.prototype) as DOMException & { code: number };
    quotaError.message = "Storage quota exceeded";
    quotaError.name = "QuotaExceededError";
    quotaError.code = 22;
    vi.spyOn(storage, "setItem").mockImplementation(() => {
      throw quotaError;
    });

    Object.defineProperty(window, "localStorage", {
      value: storage,
      configurable: true,
      writable: true,
    });

    vi.resetModules();
    await import("@/features/planner/store/plannerProjectStore");

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Storage full"));
    consoleSpy.mockRestore();
  });
});
