/**
 * AiAdvisorChat — legacy floating drawer wrapper.
 * Prefer `AiAdvisorChatPane` embedded in `AIAssistDrawer` for the unified planner shell.
 */

"use client";

import { MessageSquare, X, Sparkles } from "lucide-react";

import { AiAdvisorChatPane } from "./AiAdvisorChatPane";

interface LayoutSuggestion {
  type: "placement" | "rearrange" | "template";
  description: string;
  actionLabel: string;
}

interface AiAdvisorChatProps {
  onApplySuggestion?: (suggestion: LayoutSuggestion) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AiAdvisorChat({ onApplySuggestion, isOpen = false, onClose }: AiAdvisorChatProps) {
  if (!isOpen) return null;

  return (
    <div
      className="pw-drawer pw-ai-floating-chat fixed bottom-4 right-4 z-50 flex h-[480px] w-80 flex-col rounded-xl"
      role="dialog"
      aria-label="AI Layout Advisor"
    >
      <div className="pw-drawer-header flex items-center justify-between px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="pw-ai-chat-avatar" aria-hidden>
            <Sparkles size={13} />
          </span>
          <div>
            <h3 className="text-sm font-semibold leading-tight text-[color:var(--text-strong)]">
              AI Advisor
            </h3>
            <p className="text-[10px] leading-tight text-[color:var(--text-muted)]">
              Layout suggestions on demand
            </p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="pw-icon-btn" aria-label="Close advisor">
          <X size={14} aria-hidden />
        </button>
      </div>

      <AiAdvisorChatPane
        editor={null}
        projectMetadata={null}
        onApplySuggestion={onApplySuggestion}
      />
    </div>
  );
}

export function AiAdvisorTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      data-coach="ai-advisor"
      onClick={onClick}
      className="pw-fab"
      aria-label="Open AI Layout Advisor"
    >
      <MessageSquare size={18} />
    </button>
  );
}