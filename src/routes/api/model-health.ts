import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { getModel } from "@/lib/threadwise/ai/ai-providers.server";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

type Provider = "deepseek" | "openai" | "anthropic" | "gemini";

/**
 * GET /api/model-health — which model keys actually answer on this deployment.
 * Secret-gated with CRON_SECRET so it cannot be used to burn credits.
 */
export const Route = createFileRoute("/api/model-health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["CRON_SECRET"];
        const authorization = request.headers.get("authorization") ?? "";
        if (!secret || authorization !== `Bearer ${secret}`) {
          return json({ error: "Not found." }, 404);
        }

        const checks: { provider: Provider; model: string }[] = [];
        if (process.env["DEEPSEEK_API_KEY"]) {
          checks.push({ provider: "deepseek", model: "deepseek-chat" });
        }
        if (process.env["OPENAI_API_KEY"]) {
          checks.push({ provider: "openai", model: "gpt-6.1-sol" });
        }
        if (process.env["ANTHROPIC_API_KEY"]) {
          const models = [
            process.env["ANTHROPIC_MODEL"],
            "claude-3-5-sonnet-latest",
            "claude-sonnet-4-5",
            "claude-3-5-sonnet-20240620",
          ].filter((model): model is string => Boolean(model));
          for (const model of [...new Set(models)]) {
            checks.push({ provider: "anthropic", model });
          }
        }
        if (process.env["GEMINI_API_KEY"] || process.env["GOOGLE_GENERATIVE_AI_API_KEY"]) {
          checks.push({ provider: "gemini", model: "gemini-3.8-flash" });
        }

        const results = await Promise.all(
          checks.map(async ({ provider, model }) => {
            const started = Date.now();
            try {
              const { text } = await generateText({
                model: getModel(provider, model),
                prompt: "Reply with exactly: OK",
                maxOutputTokens: 10,
                maxRetries: 0,
                abortSignal: AbortSignal.timeout(15_000),
              });
              return {
                provider,
                model,
                ok: true,
                ms: Date.now() - started,
                text: text.trim().slice(0, 20),
              };
            } catch (error) {
              return {
                provider,
                model,
                ok: false,
                ms: Date.now() - started,
                error: (error instanceof Error ? error.message : String(error)).slice(0, 180),
              };
            }
          }),
        );

        return json({ checks: results }, 200);
      },
    },
  },
});
