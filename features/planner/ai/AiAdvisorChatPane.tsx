"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles, Wand2 } from "lucide-react";


import type { PlannerProjectMetadata } from "@/features/planner/onboarding/projectSetup";

import {
  AI_ADVISOR_PLANNER_ID,
  buildAdvisorChatWelcome,
  buildChatSuggestionChips,
} from "./aiAdvisorConfig";
import { extractCanvasPlacements } from "./extractCanvasPlacements";

type ChatRole = "user" | "assistant" | "system";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
  suggestion?: LayoutSuggestion;
};

type LayoutSuggestion = {
  type: "placement" | "rearrange" | "template";
  description: string;
  actionLabel: string;
};

export type AiAdvisorChatPaneProps = {
  editor?: null;
  projectMetadata: PlannerProjectMetadata | null;
  onApplySuggestion?: (suggestion: LayoutSuggestion) => void;
};

function createMessageId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function createWelcomeMessage(projectMetadata: PlannerProjectMetadata | null): ChatMessage {
  return {
    id: "welcome",
    role: "system",
    content: buildAdvisorChatWelcome(projectMetadata),
    timestamp: 0,
  };
}

export function AiAdvisorChatPane({
  editor,
  projectMetadata,
  onApplySuggestion,
}: AiAdvisorChatPaneProps) {
  const suggestionChips = buildChatSuggestionChips(projectMetadata);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createWelcomeMessage(projectMetadata),
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMessage: ChatMessage = {
        id: createMessageId("user"),
        role: "user",
        content: trimmed,
        timestamp: 0,
      };

      let outbound: ChatMessage[] = [];
      setMessages((prev) => {
        outbound = [...prev, userMessage];
        return outbound;
      });
      setInput("");
      setIsLoading(true);

      try {
        const placementCount = editor ? extractCanvasPlacements(editor).length : 0;
        const response = await fetch("/api/planner/ai-advisor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "chat",
            messages: outbound
              .filter((message) => message.role !== "system")
              .map((message) => ({ role: message.role, content: message.content })),
            context: {
              planner: AI_ADVISOR_PLANNER_ID,
              currentShapeCount: placementCount,
              seatCount: projectMetadata?.seatTarget,
              purpose: projectMetadata?.primaryPurpose,
              floorAreaSqFt: projectMetadata?.floorAreaSqFt,
              projectName: projectMetadata?.projectName,
            },
          }),
        });

        if (!response.ok) throw new Error("AI request failed");

        const data = (await response.json()) as {
          content?: string;
          suggestion?: LayoutSuggestion;
        };

        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId("assistant"),
            role: "assistant",
            content: data.content || "I couldn't process that request. Try rephrasing?",
            timestamp: 0,
            suggestion: data.suggestion,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId("error"),
            role: "assistant",
            content: "Sorry, I'm having trouble connecting. Please try again in a moment.",
            timestamp: 0,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [editor, isLoading, projectMetadata, setInput, setIsLoading, setMessages],
  );

  const showChips = messages.length <= 1 && !isLoading;

  return (
    <div className="pw-ai-chat" role="tabpanel">
      <p className="pw-ai-drawer-lead">
        Ask follow-up questions about spacing, zones, or meeting rooms. Suggestions use your project
        setup and current canvas.
      </p>

      <div className="pw-ai-chat-stream custom-scrollbar" aria-live="polite">
        {messages.map((msg) => (
          <div key={msg.id} className="pw-ai-chat-row" data-role={msg.role}>
            <div
              className={`pw-ai-chat-bubble ${
                msg.role === "user"
                  ? "pw-ai-chat-bubble--user"
                  : msg.role === "system"
                    ? "pw-ai-chat-bubble--system"
                    : "pw-ai-chat-bubble--assistant"
              }`}
            >
              <p>{msg.content}</p>
              {msg.suggestion ? (
                <button
                  type="button"
                  className="pw-ai-chat-apply"
                  onClick={() => onApplySuggestion?.(msg.suggestion as LayoutSuggestion)}
                >
                  <Wand2 size={12} aria-hidden />
                  {msg.suggestion.actionLabel}
                </button>
              ) : null}
            </div>
          </div>
        ))}

        {isLoading ? (
          <div className="pw-ai-chat-row" data-role="assistant">
            <div className="pw-ai-chat-bubble pw-ai-chat-bubble--assistant" aria-label="Advisor is typing">
              <span className="pw-ai-chat-typing" aria-hidden>
                <span className="pw-ai-chat-typing-dot" />
                <span className="pw-ai-chat-typing-dot" />
                <span className="pw-ai-chat-typing-dot" />
              </span>
            </div>
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      {showChips ? (
        <div className="pw-ai-chat-chips" aria-label="Suggested prompts">
          {suggestionChips.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="pw-ai-chat-chip"
              onClick={() => void send(suggestion)}
            >
              <Sparkles size={10} aria-hidden />
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}

      <div className="pw-ai-chat-inputbar">
        <input
          type="text"
          className="pw-ai-chat-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && void send(input)}
          placeholder="Describe your layout needs…"
          disabled={isLoading}
          aria-label="Chat message input"
        />
        <button
          type="button"
          className="pw-ai-chat-send"
          onClick={() => void send(input)}
          disabled={!input.trim() || isLoading}
          aria-label="Send message"
        >
          {isLoading ? <Loader2 size={13} className="pw-ai-spin" aria-hidden /> : <Send size={13} aria-hidden />}
        </button>
      </div>
    </div>
  );
}