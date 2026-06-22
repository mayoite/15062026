import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AI_ASSISTANT_WELCOME_MESSAGE } from "@/lib/site-data/assistant";

vi.mock("next/dynamic", async () => {
  const { UnifiedAssistant } = await import("@/features/site-assistant/UnifiedAssistant");
  return {
    default: () => UnifiedAssistant,
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/lib/consent", () => ({
  hasConsentChoice: () => true,
}));

import DynamicBotWrapper from "@/features/site-assistant/DynamicBotWrapper";

describe("DynamicBotWrapper", () => {
  it("renders the lazily loaded unified assistant", () => {
    render(<DynamicBotWrapper />);

    expect(screen.getByRole("button", { name: /open ai chatbot/i })).toBeInTheDocument();
  });

  it("loads assistant content when the chatbot is opened", () => {
    render(<DynamicBotWrapper />);

    fireEvent.click(screen.getByRole("button", { name: /open ai chatbot/i }));

    expect(screen.getByText(AI_ASSISTANT_WELCOME_MESSAGE)).toBeInTheDocument();
  });
});