import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { rateLimit } from "@/lib/rateLimit";
import {
  requestProviderText,
  resolveProviderChain,
  type ServerChatMessage,
} from "@/lib/ai/providerChain";

type AiAssistMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function isAiAssistMessage(value: unknown): value is AiAssistMessage {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.content === "string" &&
    (candidate.role === "system" ||
      candidate.role === "user" ||
      candidate.role === "assistant")
  );
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const limitRes = await rateLimit(`ai-assist:${ip}`, 15, 60_000);
    if (!limitRes.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "X-RateLimit-Reset": limitRes.reset.toString() } },
      );
    }

    const providers = resolveProviderChain();
    if (providers.length === 0) {
      return NextResponse.json(
        {
          error:
            "Missing AI provider credentials. Configure GOOGLE_API_KEY, NOVA_ACT_API_KEY/AWS_BEARER_TOKEN_BEDROCK, or OPENROUTER_API_KEY.",
        },
        { status: 500 },
      );
    }

    const payload = (await req.json()) as { messages?: unknown };
    const messages = Array.isArray(payload.messages)
      ? payload.messages.filter(isAiAssistMessage)
      : [];

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 },
      );
    }

    let lastError: unknown = null;
    for (const provider of providers) {
      try {
        const content = await requestProviderText(
          provider,
          messages as ServerChatMessage[],
          { jsonMode: true },
        );
        return NextResponse.json({
          content,
          provider: provider.provider,
          model: provider.model,
        });
      } catch (error) {
        lastError = error;
        console.error(`[ai-assist] ${provider.provider} error:`, error);
      }
    }

    const message =
      lastError instanceof Error
        ? lastError.message
        : "Failed to call AI service";
    return NextResponse.json({ error: message }, { status: 500 });
  } catch (error: unknown) {
    console.error("AI Assist Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to call AI service";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
