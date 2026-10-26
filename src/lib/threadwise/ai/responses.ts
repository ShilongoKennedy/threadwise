import { streamText, type ModelMessage } from "ai";
import { createDeepSeekProvider } from "./deepseek.server";

export function createResponsesCall(
  request: Request,
  config: { baseURL: string; apiKey: string; model: string },
  messages: ModelMessage[],
  instructions?: string,
) {
  void request;
  void config.baseURL;
  void config.apiKey;
  const provider = createDeepSeekProvider();
  const result = streamText({
    model: provider.chat(config.model),
    // AI SDK 6 lacks `instructions`: rename this key to `system` there.
    ...(instructions ? { instructions } : {}),
    messages,
    abortSignal: request.signal,
  });
  return {
    result,
    response: () => result.toUIMessageStreamResponse(),
  };
}
