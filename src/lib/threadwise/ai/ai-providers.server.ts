import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";

/** 
 * Centralized provider factory.
 * This allows us to switch between models instantly without rewriting API logic.
 */

export function getModel(provider: "deepseek" | "gemini" | "openai" | "anthropic", modelOverride?: string) {
  switch (provider) {
    case "gemini": {
      const apiKey = process.env["GEMINI_API_KEY"] || process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
      if (!apiKey) throw new Error("Gemini API key is missing. Add GEMINI_API_KEY to .env.");
      const google = createGoogleGenerativeAI({ apiKey });
      return google(modelOverride || "gemini-3.8-flash");
    }
    
    case "anthropic": {
      const apiKey = process.env["ANTHROPIC_API_KEY"];
      if (!apiKey) throw new Error("Anthropic API key is missing. Add ANTHROPIC_API_KEY to .env.");
      const anthropic = createAnthropic({ apiKey });
      return anthropic(modelOverride || "claude-3-5-sonnet-20240620");
    }

    case "openai": {
      const apiKey = process.env["OPENAI_API_KEY"];
      if (!apiKey) throw new Error("OpenAI API key is missing. Add OPENAI_API_KEY to .env.");
      const openai = createOpenAI({ apiKey });
      return openai(modelOverride || "gpt-4o");
    }

    case "deepseek":
    default: {
      const apiKey = process.env["DEEPSEEK_API_KEY"];
      if (!apiKey) throw new Error("DeepSeek API key is missing. Add DEEPSEEK_API_KEY to .env.");
      const deepseek = createOpenAI({ baseURL: "https://api.deepseek.com/v1", apiKey });
      return deepseek(modelOverride || "deepseek-chat");
    }
  }
}

/**
 * Safely extracts JSON from a potentially messy AI text response.
 * This works across ALL models, regardless of whether they support native JSON schemas.
 */
export function extractJson<T>(text: string): T {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("The AI did not return a valid JSON object.");
  }
  
  const jsonString = text.substring(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error("JSON Parse Error on string:", jsonString);
    throw new Error("The AI returned malformed JSON. Please try again.");
  }
}