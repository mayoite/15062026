"use client";

import { Bot } from "lucide-react";

export function OpenAssistantButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("oando-assistant:open"))}
      className={className}
    >
      <Bot className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
