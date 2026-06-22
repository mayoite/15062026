import { describe, it, expect, beforeEach } from "vitest";
import { useAIStore } from "@/features/planner/store/aiStore";
import { furnitureCatalog } from "@/features/planner/store/catalogData";

describe("aiStore", () => {
  beforeEach(() => {
    const store = useAIStore.getState();
    store.clearMessages();
    store.clearGhostItems();
    store.setOpen(true);
    store.setStyle("Modern");
    store.setLoading(false);
  });

  it("should have correct initial state", () => {
    const state = useAIStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.style).toBe("Modern");
    expect(state.messages).toEqual([]);
    expect(state.ghostItems).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it("should toggle open state", () => {
    const { setOpen } = useAIStore.getState();
    setOpen(false);
    expect(useAIStore.getState().isOpen).toBe(false);
    setOpen(true);
    expect(useAIStore.getState().isOpen).toBe(true);
  });

  it("should update style", () => {
    const { setStyle } = useAIStore.getState();
    setStyle("Minimalist");
    expect(useAIStore.getState().style).toBe("Minimalist");
  });

  it("should add and update messages", () => {
    const { addMessage, updateMessage } = useAIStore.getState();
    
    const msgId = addMessage({ role: "user", content: "Hello" });
    
    let state = useAIStore.getState();
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]?.content).toBe("Hello");
    expect(state.messages[0]?.id).toBe(msgId);
    
    updateMessage(msgId, { content: "Updated Hello", isLoading: true });
    
    state = useAIStore.getState();
    expect(state.messages[0]?.content).toBe("Updated Hello");
    expect(state.messages[0]?.isLoading).toBe(true);
  });

  it("should clear messages", () => {
    const { addMessage, clearMessages } = useAIStore.getState();
    addMessage({ role: "user", content: "Hello" });
    expect(useAIStore.getState().messages).toHaveLength(1);
    
    clearMessages();
    expect(useAIStore.getState().messages).toHaveLength(0);
  });

  it("should enrich and set ghost items based on catalog", () => {
    const { setGhostItems } = useAIStore.getState();
    const itemWithCatalog = furnitureCatalog[0];
    
    setGhostItems([
      { id: "ghost1", catalogId: itemWithCatalog?.id || "unknown", name: "Ghost 1", x: 0, y: 0, width: 0, height: 0, rotation: 0, color: "", shape: "" },
      { id: "ghost2", catalogId: "nonexistent", name: "Ghost 2", x: 10, y: 10, width: 0, height: 0, rotation: 0, color: "", shape: "" }
    ]);
    
    const state = useAIStore.getState();
    expect(state.ghostItems).toHaveLength(2);
    
    const g1 = state.ghostItems[0];
    const g2 = state.ghostItems[1];
    
    expect(g1?.color).toBe("var(--surface-panel)");
    expect(g1?.shape).toBe(itemWithCatalog?.shape || "sofa");
    expect(g1?.width).toBe(itemWithCatalog ? Math.round(itemWithCatalog.widthMm / 10) : 50);
    
    expect(g2?.shape).toBe("sofa");
    expect(g2?.width).toBe(50);
  });

  it("should remove ghost items", () => {
    const { setGhostItems, removeGhostItem } = useAIStore.getState();
    setGhostItems([
      { id: "ghost1", catalogId: "unknown", name: "Ghost 1", x: 0, y: 0, width: 0, height: 0, rotation: 0, color: "", shape: "" },
    ]);
    expect(useAIStore.getState().ghostItems).toHaveLength(1);
    
    removeGhostItem("ghost1");
    expect(useAIStore.getState().ghostItems).toHaveLength(0);
  });

  it("should clear ghost items", () => {
    const { setGhostItems, clearGhostItems } = useAIStore.getState();
    setGhostItems([
      { id: "ghost1", catalogId: "unknown", name: "Ghost 1", x: 0, y: 0, width: 0, height: 0, rotation: 0, color: "", shape: "" },
    ]);
    clearGhostItems();
    expect(useAIStore.getState().ghostItems).toHaveLength(0);
  });

  it("should toggle loading state", () => {
    const { setLoading } = useAIStore.getState();
    setLoading(true);
    expect(useAIStore.getState().isLoading).toBe(true);
    setLoading(false);
    expect(useAIStore.getState().isLoading).toBe(false);
  });
});

