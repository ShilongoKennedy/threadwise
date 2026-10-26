import { createOpenAI } from "@ai-sdk/openai";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";

/** Server-only provider. Never expose DEEPSEEK_API_KEY through a VITE_ variable. */
export function createDeepSeekProvider() {
  const apiKey = process.env["DEEPSEEK_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured. Add DEEPSEEK_API_KEY to .env.");
  return createOpenAI({ baseURL: DEEPSEEK_BASE_URL, apiKey });
}

export function deepSeekModelName() {
  return process.env["DEEPSEEK_MODEL"]?.trim() || DEFAULT_DEEPSEEK_MODEL;
}
