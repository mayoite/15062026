import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

import { env } from "../env.server";
import { SITE_URL } from "../siteUrl";

export type ServerChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ProviderId = "google" | "openai" | "aws-nova" | "openrouter";

type GoogleProvider = {
  provider: "google";
  model: string;
  apiKey: string;
};

type OpenAiCompatibleProvider = {
  provider: "openai" | "aws-nova" | "openrouter";
  model: string;
  apiKey: string;
  baseURL: string;
  defaultHeaders?: Record<string, string>;
};

export type ResolvedProvider = GoogleProvider | OpenAiCompatibleProvider;

type RequestProviderTextOptions = {
  jsonMode?: boolean;
  signal?: AbortSignal;
  stream?: boolean;
  temperature?: number;
  onDelta?: (delta: string) => void;
};

const DEFAULT_GOOGLE_MODEL = env.GOOGLE_MODEL || "gemini-2.0-flash-lite";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_NOVA_MODEL = env.AWS_NOVA_MODEL || "us.amazon.nova-lite-v1:0";
const DEFAULT_BEDROCK_REGION = env.AWS_BEDROCK_REGION || "us-east-1";
const DEFAULT_OPENROUTER_MODEL = env.OPENROUTER_MODEL || "openrouter/auto";

export function getBedrockMantleBaseUrl(
  region = DEFAULT_BEDROCK_REGION,
): string {
  return `https://bedrock-mantle.${region}.api.aws/v1`;
}

function resolveGoogleApiKey(): string | undefined {
  return env.GOOGLE_API_KEY?.trim() || env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
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

function createBedrockNovaClient(apiKey: string, region = DEFAULT_BEDROCK_REGION) {
  return new OpenAI({
    baseURL: getBedrockMantleBaseUrl(region),
    apiKey,
  });
}

export function resolveProviderChain(): ResolvedProvider[] {
  const providers: ResolvedProvider[] = [];

  const googleKey = resolveGoogleApiKey();
  if (googleKey) {
    providers.push({
      provider: "google",
      apiKey: googleKey,
      model: DEFAULT_GOOGLE_MODEL,
    });
  }

  const openAiKey = env.OPENAI_API_KEY?.trim();
  if (openAiKey) {
    providers.push({
      provider: "openai",
      apiKey: openAiKey,
      baseURL: "https://api.openai.com/v1",
      model: DEFAULT_OPENAI_MODEL,
    });
  }

  // Amazon Bedrock accepts bearer-style API keys. Preserve NOVA_ACT_API_KEY
  // as a local alias because that is the key already present in .env.local.
  const novaKey =
    env.AWS_BEARER_TOKEN_BEDROCK?.trim() ||
    env.NOVA_ACT_API_KEY?.trim();
  if (novaKey) {
    providers.push({
      provider: "aws-nova",
      apiKey: novaKey,
      baseURL: getBedrockMantleBaseUrl(DEFAULT_BEDROCK_REGION),
      model: DEFAULT_NOVA_MODEL,
    });
  }

  const openRouterKey = env.OPENROUTER_API_KEY?.trim();
  if (openRouterKey) {
    providers.push({
      provider: "openrouter",
      apiKey: openRouterKey,
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

async function requestGoogleText(
  provider: GoogleProvider,
  messages: ServerChatMessage[],
  options: RequestProviderTextOptions,
): Promise<string> {
  const systemInstruction =
    messages.find((message) => message.role === "system")?.content || "";

  const history = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

  const currentMessage = history.pop();
  if (!currentMessage || currentMessage.role !== "user") {
    throw new Error("Last message must be from user");
  }

  const genAI = new GoogleGenerativeAI(provider.apiKey);
  const model = genAI.getGenerativeModel({
    model: provider.model,
    systemInstruction,
    generationConfig: options.jsonMode
      ? { responseMimeType: "application/json" }
      : undefined,
  });

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(currentMessage.parts[0].text);
  const response = await result.response;
  const text = response.text();

  if (options.stream && text) {
    options.onDelta?.(text);
  }

  return text;
}

async function requestOpenAiCompatibleText(
  provider: OpenAiCompatibleProvider,
  messages: ServerChatMessage[],
  options: RequestProviderTextOptions,
): Promise<string> {
  const client =
    provider.provider === "openrouter"
      ? createOpenRouterClient(provider.apiKey)
      : provider.provider === "openai"
        ? new OpenAI({ apiKey: provider.apiKey })
        : createBedrockNovaClient(provider.apiKey, DEFAULT_BEDROCK_REGION);
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
  if (provider.provider === "google") {
    return requestGoogleText(provider, messages, options);
  }

  return requestOpenAiCompatibleText(provider, messages, options);
}
