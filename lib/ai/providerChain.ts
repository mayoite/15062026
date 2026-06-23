import OpenAI from "openai";

import { env } from "../env.server";
import { SITE_URL } from "../siteUrl";

export type ServerChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ProviderId = "openrouter";

type OpenRouterProvider = {
  provider: "openrouter";
  model: string;
  apiKey: string;
  baseURL: string;
  defaultHeaders?: Record<string, string>;
};

export type ResolvedProvider = OpenRouterProvider;

type RequestProviderTextOptions = {
  jsonMode?: boolean;
  signal?: AbortSignal;
  stream?: boolean;
  temperature?: number;
  onDelta?: (delta: string) => void;
};

const DEFAULT_OPENROUTER_MODEL = env.OPENROUTER_MODEL || "openrouter/auto";

export function getBedrockMantleBaseUrl(region: string): string {
  return `https://bedrock-mantle.${region}.api.aws/v1`;
}

function createOpenRouterClient(apiKey: string) {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": SITE_URL,
      "X-Title": "One&Only",
    },
  });
}

export function resolveProviderChain(): ResolvedProvider[] {
  const providers: ResolvedProvider[] = [];

  const primaryKey = env.OPENROUTER_API_KEY_PRIMARY?.trim();
  if (primaryKey) {
    providers.push({
      provider: "openrouter",
      apiKey: primaryKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": SITE_URL,
        "X-Title": "One&Only",
      },
      model: DEFAULT_OPENROUTER_MODEL,
    });
  }

  const backupKey = env.OPENROUTER_API_KEY_BACKUP?.trim();
  if (backupKey) {
    providers.push({
      provider: "openrouter",
      apiKey: backupKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": SITE_URL,
        "X-Title": "One&Only",
      },
      model: DEFAULT_OPENROUTER_MODEL,
    });
  }

  return providers;
}

function extractCompletionText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (!part || typeof part !== "object") return "";
      const candidate = part as { text?: string; type?: string };
      return candidate.type === "text" && typeof candidate.text === "string"
        ? candidate.text
        : "";
    })
    .join("");
}

function extractStreamChunkText(chunk: unknown): string {
  if (!chunk || typeof chunk !== "object") return "";
  const choices = (chunk as { choices?: Array<{ delta?: { content?: unknown } }> })
    .choices;
  const content = choices?.[0]?.delta?.content;
  return extractCompletionText(content);
}

async function requestOpenAiCompatibleText(
  provider: OpenRouterProvider,
  messages: ServerChatMessage[],
  options: RequestProviderTextOptions,
): Promise<string> {
  const client = createOpenRouterClient(provider.apiKey);
  const requestBody = {
    model: provider.model,
    messages,
    temperature: options.temperature ?? 0.4,
    ...(options.jsonMode ? { response_format: { type: "json_object" as const } } : {}),
  };

  if (options.stream) {
    const completion = await client.chat.completions.create(
      {
        ...requestBody,
        stream: true,
      },
      {
        signal: options.signal,
      },
    );

    let raw = "";
    for await (const chunk of completion as AsyncIterable<unknown>) {
      const delta = extractStreamChunkText(chunk);
      if (!delta) continue;
      raw += delta;
      options.onDelta?.(delta);
    }
    return raw;
  }

  const completion = await client.chat.completions.create(requestBody, {
    signal: options.signal,
  });
  const content = (completion as { choices?: Array<{ message?: { content?: unknown } }> })
    .choices?.[0]?.message?.content;

  return extractCompletionText(content);
}

export async function requestProviderText(
  provider: ResolvedProvider,
  messages: ServerChatMessage[],
  options: RequestProviderTextOptions = {},
): Promise<string> {
  return requestOpenAiCompatibleText(provider, messages, options);
}
