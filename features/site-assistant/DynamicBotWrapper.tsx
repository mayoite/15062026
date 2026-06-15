"use client";

import dynamic from "next/dynamic";

const UnifiedAssistant = dynamic(() =>
  import("@/features/site-assistant/UnifiedAssistant").then((m) => ({
    default: m.UnifiedAssistant,
  })), { ssr: false });

export default function DynamicBotWrapper() {
  return <UnifiedAssistant />;
}
