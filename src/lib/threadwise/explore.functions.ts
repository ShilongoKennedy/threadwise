import { generateObject } from "ai";
import { z } from "zod";
import { EPISTEMIC, RELATIONS } from "./model";
import type { ExploreInput, RawSuggestion } from "./explore.types";
import { createDeepSeekProvider, deepSeekModelName } from "./ai/deepseek.server";

const schema = z.object({
  suggestions: z.array(
    z.object({
      kind: z.enum(["question", "experiment", "connection"]),
      title: z.string(),
      body: z.string(),
      rationale: z.string(),
      epistemic: z.enum(EPISTEMIC),
      relation: z.enum(RELATIONS.filter((r) => r !== "custom") as [string, ...string[]]),
      anchorId: z.string(),
      targetId: z.string().nullable(),
      hypothesis: z.string().nullable(),
      successCriteria: z.string().nullable(),
    }),
  ),
});

const SYSTEM = `You are a thinking partner inside Threadwise, a visual canvas where nodes (idea, note, question, experiment, action) are linked by directed relationships.
Read the graph and propose 3–6 high-value suggestions:
- "question": an unresolved question the graph exposes (gaps, hidden assumptions, missing evidence). anchorId = the node it is about; relation is from anchor to the new node (usually needs_evidence_from or leads_to). targetId null.
- "experiment": a cheap, concrete test of a hypothesis or assumption. Fill hypothesis and successCriteria. anchorId = node being tested; relation usually leads_to or needs_evidence_from. targetId null.
- "connection": a meaningful link between two EXISTING nodes that are not yet connected. anchorId = source id, targetId = target id, relation = semantic label. title = a short phrase naming the link.
Use only node ids that appear in the graph. Pay attention to epistemic status (challenge assumptions/hypotheses) and the scarcity/difficulty/risk lenses. Be specific and concise; titles under 12 words, body 1–2 sentences, rationale one sentence explaining why it matters.`;

export async function runExplore(input: ExploreInput): Promise<RawSuggestion[]> {
  const provider = createDeepSeekProvider();
  const focus = input.focusId ? `\nFocus especially on node ${input.focusId} and its neighbourhood.` : "";
  
  try {
    // generateObject is much more reliable than streamText for strict JSON
    const { object } = await generateObject({
      model: provider.chat(deepSeekModelName()),
      schema: schema,
      system: SYSTEM, // <--- Changed from 'instructions' to 'system'
      prompt: `Graph:\n${JSON.stringify({ nodes: input.nodes, edges: input.edges })}${focus}`,
    });

    const ids = new Set(input.nodes.map((n) => n.id));
    return (object.suggestions as RawSuggestion[]).filter(
      (s) => ids.has(s.anchorId) && (s.kind !== "connection" || (s.targetId && ids.has(s.targetId) && s.targetId !== s.anchorId)),
    );
  } catch (e: any) {
    // Log the exact error to Vercel so we can see it if it fails again
    console.error("explore failed:", e);
    
    const status = e?.statusCode || e?.status;
    if (status === 402) throw new Error("DeepSeek API balance is unavailable. Check your account.");
    if (status === 429) throw new Error("Too many requests right now — wait a moment and try again.");
    if (status === 403) throw new Error("AI access is currently blocked for this workspace.");
    
    if (e.name === "AI_NoObjectGeneratedError" || e.name === "AI_TypeValidationError") {
      throw new Error("The AI returned an unreadable answer. Please try again.");
    }
    
    // This will surface the actual error to the UI so you can see what's wrong
    throw new Error(e.message || "Couldn't get suggestions right now.");
  }
}