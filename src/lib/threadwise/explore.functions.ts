import { createServerFn } from "@tanstack/react-start";
import type { ExploreInput } from "./explore.types";

export const exploreGraph = createServerFn({ method: "POST" })
  .inputValidator((d: ExploreInput) => {
    if (!Array.isArray(d?.nodes) || d.nodes.length === 0) throw new Error("Add a few nodes first.");
    if (d.nodes.length > 200) throw new Error("Graph too large to explore at once.");
    return d;
  })
  .handler(async ({ data }) => {
    const { runExplore } = await import("./explore.server");
    try {
      return { suggestions: await runExplore(data), error: null as string | null };
    } catch (e) {
      return { suggestions: [], error: (e as Error).message };
    }
  });
