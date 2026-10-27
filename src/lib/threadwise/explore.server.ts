import { generateText } from "ai";
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
Use only node ids that appear in the graph. Pay attention to epistemic status (challenge assumptions/hypotheses) and the scarcity/difficulty/risk lenses. Be specific and concise; titles under 12 words, body 1–2 sentences, rationale one sentence explaining why it matters.

Return ONLY a valid JSON object matching this exact schema:
{
  "suggestions": [
    {
      "kind": "question" | "experiment" | "connection",
      "title": string,
      "body": string,
      "rationale": string,
      "epistemic": "fact" | "evidence" | "assumption" | "hypothesis" | "unknown",
      "relation": string,
      "anchorId": string,
      "targetId": string | null,
      "hypothesis": string | null,
      "successCriteria": string | null
    }
  ]
}`;

export async function runExplore(input: ExploreInput): Promise<RawSuggestion[]> {
  const provider = createDeepSeekProvider();
  const focus = input.focusId ? `\nFocus especially on node ${input.focusId} and its neighbourhood.` : "";
  
  try {
    const { text } = await generateText({
      model: provider.chat(deepSeekModelName()),
      system: SYSTEM,
      prompt: `Graph:\n${JSON.stringify({ nodes: input.nodes, edges: input.edges })}${focus}\n\nReturn the JSON now.`,
    });

    // 1. Extract JSON by finding the first '{' and last '}'
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      console.error("No JSON braces found in output:", text);
      throw new Error("The AI did not return a JSON object.");
    }

    const jsonString = text.substring(firstBrace, lastBrace + 1);
    
    // 2. Parse JSON safely
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      console.error("JSON Parse Error. Raw string:", jsonString);
      throw new Error("The AI returned invalid JSON syntax.");
    }

    // 3. Sanitize the AI's output (fix common mistakes like spaces in enums)
    if (parsed && Array.isArray(parsed.suggestions)) {
      parsed.suggestions = parsed.suggestions.map((s: any) => {
        // Fix relation (e.g., "needs evidence from" -> "needs_evidence_from")
        let rel = String(s.relation || "").toLowerCase().replace(/ /g, "_");
        if (!RELATIONS.includes(rel as any) || rel === "custom") rel = "leads_to";

        // Fix epistemic
        const ep = String(s.epistemic || "").toLowerCase();
        const validEp = EPISTEMIC.includes(ep as any) ? ep : "unknown";

        return {
          ...s,
          relation: rel,
          epistemic: validEp,
          targetId: s.targetId || null,
          hypothesis: s.hypothesis || null,
          successCriteria: s.successCriteria || null,
          anchorId: String(s.anchorId || ""),
          title: String(s.title || ""),
          body: String(s.body || ""),
          rationale: String(s.rationale || ""),
        };
      });
    }

    // 4. Validate with Zod
    const result = schema.safeParse(parsed);
    if (!result.success) {
      console.error("Zod Validation Error:", result.error.format(), "Raw JSON:", jsonString);
      throw new Error("The AI returned JSON, but it was missing required fields.");
    }

    // 5. Filter out hallucinated IDs
    const ids = new Set(input.nodes.map((n) => n.id));
    const finalSuggestions = (result.data.suggestions as RawSuggestion[]).filter(
      (s) => ids.has(s.anchorId) && (s.kind !== "connection" || (s.targetId && ids.has(s.targetId) && s.targetId !== s.anchorId)),
    );

    if (finalSuggestions.length === 0) {
        console.warn("AI returned suggestions, but they referenced fake IDs.", result.data.suggestions);
    }

    return finalSuggestions;

  } catch (e: any) {
    console.error("explore failed:", e.message);
    
    const status = e?.statusCode || e?.status;
    if (status === 402) throw new Error("DeepSeek API balance is unavailable. Check your account.");
    if (status === 429) throw new Error("Too many requests right now — wait a moment and try again.");
    if (status === 403) throw new Error("AI access is currently blocked for this workspace.");
    
    throw new Error(e.message || "Couldn't get suggestions right now.");
  }
}