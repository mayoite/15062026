import OpenAI from "openai";

const gradientApiKey =
  process.env.GRADIENT_API_KEY?.trim() ||
  process.env.DO_AI_API_KEY?.trim() ||
  "";

// 🟢 Regular — fast & cheap (Llama 70B)
export const gradientRegular = new OpenAI({
  baseURL: "https://inference.do-ai.run/v1",
  apiKey: gradientApiKey,
});

// 🔴 Higher — smart & powerful (Claude Sonnet)
export const gradientHigher = new OpenAI({
  baseURL: "https://inference.do-ai.run/v1",
  apiKey: gradientApiKey,
});

// Model names
export const MODELS = {
  regular: "llama3.3-70b-instruct",
  higher:  "anthropic-claude-sonnet-4",
  haiku:   "anthropic-claude-haiku-4.5",
  deepseek: "deepseek-r1-distill-llama-70b",
};
