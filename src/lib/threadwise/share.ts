import { supabase } from "@/integrations/supabase/client";
import type { TEdge, TNode } from "./store";

/**
 * A share is a frozen copy of one canvas — not a live view. It keeps working
 * after the canvas is edited or deleted, which is what a citation needs to do.
 */
export type SharedCanvas = {
  title: string;
  published_at: string;
  nodes: {
    id: string;
    kind: string;
    title: string;
    body: string;
    epistemic: string;
    meta: Record<string, string>;
  }[];
  edges: { source: string; target: string; relation: string; label: string }[];
};

export function snapshotCanvas(title: string, nodes: TNode[], edges: TEdge[]): SharedCanvas {
  return {
    title,
    published_at: new Date().toISOString(),
    nodes: nodes.map((node) => ({
      id: node.id,
      kind: node.data.kind,
      title: node.data.title ?? "",
      body: node.data.body ?? "",
      epistemic: node.data.epistemic,
      meta: Object.fromEntries(
        Object.entries(node.data.meta ?? {}).filter(
          ([key, value]) =>
            typeof value === "string" && value.length > 0 && ["source", "sourceUrl", "dueDate"].includes(key),
        ),
      ) as Record<string, string>,
    })),
    edges: edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      relation: edge.data?.relation ?? "leads_to",
      label: edge.data?.customLabel ?? "",
    })),
  };
}

export async function publishShare(title: string, payload: SharedCanvas): Promise<string> {
  const { data, error } = await supabase
    .from("canvas_shares")
    .insert({ title, payload: payload as never })
    .select("token")
    .single();
  if (error) throw error;
  return (data as { token: string }).token;
}

export async function fetchShare(token: string): Promise<SharedCanvas | null> {
  const { data, error } = await supabase
    .from("canvas_shares")
    .select("title, payload, created_at")
    .eq("token", token)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as { title: string; payload: SharedCanvas; created_at: string };
  return { ...row.payload, title: row.title };
}
