"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import type { GhostItem } from "@/features/oando-planner/data/aiStore";
import { useAIStore } from "@/features/oando-planner/data/aiStore";
import { usePlannerStore } from "@/features/oando-planner/data/plannerStore";
import type { StylePreset, AIFurniturePlacement } from "@/features/oando-planner/lib/aiService";
import { callAI, autoFurnishRoom, analyzeSpace } from "@/features/oando-planner/lib/aiService";
import { summarizeRejectedAIActions, validateAIActions } from "@/features/oando-planner/lib/aiActionGuard";
import { furnitureCatalog } from "@/features/oando-planner/data/catalogData";
import { v4 as uuid } from "uuid";

const STYLE_PRESETS: StylePreset[] = ["Modern", "Traditional", "Minimalist"];

const QUICK_ACTIONS = [
  { label: "Auto-furnish selected room", icon: "✨", action: "auto-furnish" },
  { label: "Analyze space", icon: "🔍", action: "analyze" },
  { label: "Will this fit?", icon: "📏", action: "fit-check" },
  { label: "Suggest living room layout", icon: "🛋️", action: "suggest-living" },
  { label: "Add lighting & decor", icon: "💡", action: "suggest-decor" },
];

function placementsToGhostItems(placements: AIFurniturePlacement[]): GhostItem[] {
  return placements.map((p) => {
    const cat = furnitureCatalog.find((c) => c.id === p.catalogId);
    return {
      id: uuid(),
      catalogId: p.catalogId,
      name: p.name || cat?.name || p.catalogId,
      x: p.x,
      y: p.y,
      width: p.width || (cat ? Math.round(cat.widthMm / 10) : 50),
      height: p.height || (cat ? Math.round(cat.depthMm / 10) : 50),
      rotation: p.rotation || 0,
      color: p.color || "var(--color-accent)",
      shape: p.shape || cat?.shape || "sofa",
    };
  });
}

export function AIAssistantPanel({ guestMode = false }: { guestMode?: boolean }) {
  const { isOpen, style, setStyle, messages, addMessage, updateMessage, clearMessages, ghostItems, setGhostItems, clearGhostItems, isLoading, setLoading } = useAIStore();
  const { rooms, furniture, selectedId, addFurniture, updateFurniture, deleteItem, pushSnapshot } = usePlannerStore();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const processedExternalMessageIdRef = useRef<string | null>(null);

  const selectedRoom = rooms.find((r) => r.id === selectedId) || null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const getRoomContext = useCallback(() => ({
    rooms,
    furniture,
    selectedRoomId: selectedId,
  }), [rooms, furniture, selectedId]);

  const acceptAllGhosts = useCallback(() => {
    if (ghostItems.length === 0) return;
    if (guestMode) {
      addMessage({ role: "assistant", content: "Guest mode is suggest-only. Sign in to apply AI furniture placements to the plan." });
      return;
    }
    pushSnapshot();
    for (const ghost of ghostItems) {
      const cat = furnitureCatalog.find((c) => c.id === ghost.catalogId);
      if (!cat) continue;
      addFurniture({
        catalogId: ghost.catalogId,
        name: ghost.name,
        x: ghost.x,
        y: ghost.y,
        width: ghost.width,
        height: ghost.height,
        rotation: ghost.rotation,
        color: ghost.color,
        shape: ghost.shape,
      });
    }
    clearGhostItems();
    addMessage({ role: "assistant", content: `✓ Placed ${ghostItems.length} furniture item${ghostItems.length !== 1 ? "s" : ""} on the canvas.` });
  }, [ghostItems, guestMode, pushSnapshot, addFurniture, clearGhostItems, addMessage]);

  const dismissAllGhosts = useCallback(() => {
    clearGhostItems();
    addMessage({ role: "assistant", content: "Dismissed all suggested placements." });
  }, [clearGhostItems, addMessage]);

  const acceptSingleGhost = useCallback((ghostId: string) => {
    const ghost = ghostItems.find((g) => g.id === ghostId);
    if (!ghost) return;
    if (guestMode) {
      addMessage({ role: "assistant", content: "Guest mode is suggest-only. Sign in to apply AI furniture placements to the plan." });
      return;
    }
    pushSnapshot();
    const cat = furnitureCatalog.find((c) => c.id === ghost.catalogId);
    if (cat) {
      addFurniture({
        catalogId: ghost.catalogId,
        name: ghost.name,
        x: ghost.x,
        y: ghost.y,
        width: ghost.width,
        height: ghost.height,
        rotation: ghost.rotation,
        color: ghost.color,
        shape: ghost.shape,
      });
    }
    useAIStore.getState().removeGhostItem(ghostId);
  }, [ghostItems, guestMode, pushSnapshot, addFurniture, addMessage]);

  const requestAIResponse = useCallback(async (text: string, history: Array<{ role: "user" | "assistant"; content: string }>) => {
    const loadingId = addMessage({ role: "assistant", content: "", isLoading: true });
    setLoading(true);

    abortRef.current = new AbortController();

    try {
      const result = await callAI(
        text,
        history,
        getRoomContext(),
        style,
        abortRef.current.signal
      );

      const hasGhosts = result.placements && result.placements.length > 0;
      if (hasGhosts) {
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const ghosts = placementsToGhostItems(result.placements!);
        setGhostItems(ghosts);
      }

      const validatedActions = validateAIActions(result.actions, {
        validCatalogIds: new Set(furnitureCatalog.map((item) => item.id)),
        validFurnitureIds: new Set(furniture.map((item) => item.id)),
      });

      if (result.actions && result.actions.length > 0 && !guestMode) {
        if (validatedActions.validActions.length > 0) {
          pushSnapshot();
        }
        for (const action of validatedActions.validActions) {
          if (action.type === "add" && action.catalogId) {
            const cat = furnitureCatalog.find((c) => c.id === action.catalogId);
            if (cat) {
              addFurniture({
                catalogId: cat.id,
                name: cat.name,
                x: action.x ?? 200,
                y: action.y ?? 200,
                width: Math.round(cat.widthMm / 10),
                height: Math.round(cat.depthMm / 10),
                rotation: action.rotation ?? 0,
                color: "var(--color-accent)",
                shape: cat.shape,
              });
            }
          } else if (action.type === "move" && action.furnitureId) {
            updateFurniture(action.furnitureId, {
              ...(action.x !== undefined ? { x: action.x } : {}),
              ...(action.y !== undefined ? { y: action.y } : {}),
              ...(action.rotation !== undefined ? { rotation: action.rotation } : {}),
            });
          } else if (action.type === "remove" && action.furnitureId) {
            deleteItem(action.furnitureId);
          }
        }
      }

      const rejectionSummary = summarizeRejectedAIActions(validatedActions.rejectedActions);
      const guestActionSummary =
        guestMode && validatedActions.validActions.length > 0
          ? `Guest mode is suggest-only. ${validatedActions.validActions.length} AI action suggestion${validatedActions.validActions.length === 1 ? " was" : "s were"} not applied.`
          : null;
      const responseMessage = [result.message, rejectionSummary, guestActionSummary]
        .filter(Boolean)
        .join("\n\n");

      updateMessage(loadingId, {
        content: responseMessage,
        isLoading: false,
        warnings: result.warnings,
        placements: hasGhosts ? result.placements : undefined,
      });
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === "AbortError") {
        updateMessage(loadingId, { content: "Request cancelled.", isLoading: false });
      } else {
        updateMessage(loadingId, {
          content: `Sorry, I couldn't connect to the AI service. ${error.message || "Please try again."}`,
          isLoading: false,
          isError: true,
        });
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [style, getRoomContext, addMessage, updateMessage, setLoading, setGhostItems, pushSnapshot, addFurniture, updateFurniture, deleteItem, guestMode, furniture]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setInput("");
    addMessage({ role: "user", content: trimmed });
    const history = messages
      .filter((m) => !m.isLoading && !m.isError)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    await requestAIResponse(trimmed, history);
  }, [isLoading, messages, addMessage, requestAIResponse]);

  useEffect(() => {
    if (!isOpen || isLoading || messages.length === 0) return;

    const latestMessage = messages[messages.length - 1];
    if (
      latestMessage.role !== "user" ||
      latestMessage.isLoading ||
      latestMessage.isError ||
      processedExternalMessageIdRef.current === latestMessage.id
    ) {
      return;
    }

    processedExternalMessageIdRef.current = latestMessage.id;
    const history = messages
      .slice(0, -1)
      .filter((m) => !m.isLoading && !m.isError)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    void requestAIResponse(latestMessage.content, history);
  }, [isOpen, isLoading, messages, requestAIResponse]);

  const handleAutoFurnish = useCallback(async () => {
    if (!selectedRoom) {
      addMessage({ role: "assistant", content: "Please select a room first (click on a room in the canvas), then use Auto-furnish." });
      return;
    }

    addMessage({ role: "user", content: `Auto-furnish the ${selectedRoom.name}` });
    const loadingId = addMessage({ role: "assistant", content: "", isLoading: true });
    setLoading(true);

    abortRef.current = new AbortController();

    try {
      const roomFurniture = furniture;
      const result = await autoFurnishRoom(selectedRoom, roomFurniture, style, abortRef.current.signal);

      if (result.placements && result.placements.length > 0) {
        const ghosts = placementsToGhostItems(result.placements);
        setGhostItems(ghosts);
      }

      updateMessage(loadingId, {
        content: result.message,
        isLoading: false,
        warnings: result.warnings,
        placements: result.placements,
      });
    } catch (err: unknown) {
      const error = err as Error;
      updateMessage(loadingId, {
        content: error.name === "AbortError" ? "Request cancelled." : `Error: ${error.message || "Please try again."}`,
        isLoading: false,
        isError: error.name !== "AbortError",
      });
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [selectedRoom, furniture, style, addMessage, updateMessage, setLoading, setGhostItems]);

  const handleAnalyze = useCallback(async () => {
    addMessage({ role: "user", content: "Analyze my space for issues" });
    const loadingId = addMessage({ role: "assistant", content: "", isLoading: true });
    setLoading(true);

    abortRef.current = new AbortController();

    try {
      const result = await analyzeSpace(getRoomContext(), style, abortRef.current.signal);
      updateMessage(loadingId, {
        content: result.message,
        isLoading: false,
        warnings: result.warnings,
      });
    } catch (err: unknown) {
      const error = err as Error;
      updateMessage(loadingId, {
        content: error.name === "AbortError" ? "Cancelled." : `Error: ${error.message}`,
        isLoading: false,
        isError: error.name !== "AbortError",
      });
    } finally {
      setLoading(false);
    }
  }, [getRoomContext, style, addMessage, updateMessage, setLoading]);

  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case "auto-furnish":
        handleAutoFurnish();
        break;
      case "analyze":
        handleAnalyze();
        break;
      case "fit-check":
        sendMessage("Will this layout fit comfortably in the current room? Check clearance, circulation, and overcrowding risks.");
        break;
      case "suggest-living":
        sendMessage("Suggest a complete living room layout with seating, coffee table, and entertainment setup");
        break;
      case "suggest-decor":
        sendMessage("What lighting fixtures and decorative items should I add to improve the space?");
        break;
    }
  }, [handleAutoFurnish, handleAnalyze, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-12 left-2 right-2 rounded-lg border border-white/10 flex flex-col z-30 shadow-2xl overflow-hidden" style={{ background: "var(--surface-inverse)", maxHeight: "40vh" }}>
      <div className="flex items-center px-4 py-2 border-b border-white/10 shrink-0 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">✨</span>
          <span style={{ color: "var(--text-inverse)" }} className="font-semibold text-[13px]">AI</span>
        </div>

        {/* Style presets inline */}
        <div className="flex items-center gap-1">
          {STYLE_PRESETS.map((s) => (
            <button
              key={s}
              onClick={() => setStyle(s)}
              className="px-2 py-0.5 rounded text-[11px] transition-colors"
              style={{
                background: style === s ? "var(--color-primary)" : "var(--overlay-inverse-06)",
                color: style === s ? "var(--text-inverse)" : "var(--color-dark-midnight-blue-100)",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {selectedRoom && (
          <span className="text-[11px] flex items-center gap-1.5" style={{ color: "var(--color-dark-midnight-blue-200)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-primary)" }} />
            {selectedRoom.name}
          </span>
        )}

        <div className="flex-1" />

        <button
          onClick={clearMessages}
          title="Clear conversation"
          className="text-[11px] px-2 py-0.5 rounded transition-colors"
          style={{ color: "var(--color-dark-midnight-blue-200)" }}
        >
          Clear
        </button>
      </div>

      {ghostItems.length > 0 && (
        <div className="mx-4 mt-3 bg-[var(--color-ocean-boat-blue-600)]/20 border border-[var(--color-ocean-boat-blue-600)]/40 rounded-lg p-3 shrink-0">
          <p className="text-[12px] text-[var(--color-ocean-boat-blue-300)] font-medium mb-2">
            ✨ {ghostItems.length} item{ghostItems.length !== 1 ? "s" : ""} previewed on canvas
          </p>
          <div className="flex gap-2">
              {!guestMode && (
                <button
                  onClick={acceptAllGhosts}
                  className="flex-1 bg-[var(--color-ocean-boat-blue-600)] text-white text-[12px] py-1.5 rounded hover:bg-[var(--color-ocean-boat-blue-400)] transition-colors"
                >
                  Accept All
                </button>
              )}
            <button
              onClick={dismissAllGhosts}
              className="flex-1 bg-white/10 text-white/70 text-[12px] py-1.5 rounded hover:bg-white/20 transition-colors"
            >
              Dismiss All
            </button>
          </div>
          <div className="mt-2 space-y-1 max-h-[100px] overflow-y-auto">
            {ghostItems.map((g) => (
              <div key={g.id} className="flex items-center justify-between text-[11px] text-white/60">
                <span>{g.name}</span>
                <div className="flex gap-1">
                  {!guestMode && (
                    <button
                      onClick={() => acceptSingleGhost(g.id)}
                      className="text-emerald-400 hover:text-emerald-300 px-1"
                      title="Accept"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    onClick={() => useAIStore.getState().removeGhostItem(g.id)}
                    className="text-red-400 hover:text-red-300 px-1"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {messages.length === 0 && (
        <div className="px-4 py-3 shrink-0">
          <p className="text-[11px] text-white/40 mb-2 uppercase tracking-wider">Quick actions</p>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa.action}
                onClick={() => handleQuickAction(qa.action)}
                disabled={isLoading}
                className="text-left bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 text-[11px] text-white/70 hover:text-white transition-colors disabled:opacity-50"
              >
                <span className="block text-base mb-1">{qa.icon}</span>
                {qa.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 pb-3 pt-2 border-t border-white/10 shrink-0">
        <div className="relative flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Ask AI... e.g. "Add a desk near the window"'
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-white/10 text-[13px] px-3 py-2 rounded-lg border border-white/10 focus:border-[var(--color-primary)] outline-none resize-none placeholder:text-white/30 disabled:opacity-50"
            style={{ color: "var(--text-inverse)" }}
          />
          {isLoading ? (
            <button
              onClick={handleCancel}
              className="w-9 h-9 self-end rounded-lg flex items-center justify-center text-[12px] shrink-0"
              style={{ background: "color-mix(in srgb, var(--color-accent) 20%, transparent)", color: "var(--color-accent)" }}
              title="Cancel"
            >
              ✕
            </button>
          ) : (
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="w-9 h-9 self-end rounded-lg flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shrink-0 transition-colors"
              style={{ background: "var(--color-primary)", color: "var(--text-inverse)" }}
              title="Send (Enter)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: {
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
  message: import("../../data/aiStore").ChatMessage;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[280px] rounded-xl px-3 py-2 text-[13px] ${
          isUser
            ? "bg-[var(--color-ocean-boat-blue-600)] text-white rounded-br-sm"
            : message.isError
            ? "bg-red-900/30 text-red-300 border border-red-800/30 rounded-bl-sm"
            : "bg-white/10 text-white/90 rounded-bl-sm"
        }`}
      >
        {message.isLoading ? (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span className="text-white/40 text-[11px]">Thinking...</span>
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>

            {message.warnings && message.warnings.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {message.warnings.map((w, i) => (
                  <div
                    key={i}
                    className={`text-[11px] rounded-lg px-2 py-1.5 border ${
                      w.severity === "error"
                        ? "bg-red-900/30 border-red-800/40 text-red-300"
                        : "bg-amber-900/30 border-amber-800/40 text-amber-300"
                    }`}
                  >
                    <span className="mr-1">{w.severity === "error" ? "🚫" : "⚠️"}</span>
                    {w.message}
                  </div>
                ))}
              </div>
            )}

            {message.placements && message.placements.length > 0 && (
              <p className="mt-1.5 text-[11px] text-white/50 italic">
                {message.placements.length} item{message.placements.length !== 1 ? "s" : ""} previewed on canvas
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
