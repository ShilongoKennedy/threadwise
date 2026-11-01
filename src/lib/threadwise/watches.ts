import { supabase } from "@/integrations/supabase/client";

/**
 * A watch is a dated claim: something a report says will happen on a given day.
 * The calendar surfaces it on that day; the news agent checks it when it falls due.
 */
export type Watch = {
  id: string;
  claim: string;
  due_date: string;
  source_url: string | null;
  status: "pending" | "confirmed" | "contradicted" | "inconclusive";
  resolution: string | null;
  checked_at: string | null;
};

export async function listWatches(): Promise<Watch[]> {
  const { data, error } = await supabase
    .from("claim_watches")
    .select("id, claim, due_date, source_url, status, resolution, checked_at")
    .order("due_date", { ascending: true })
    .limit(400);
  if (error) throw error;
  return (data as Watch[]) ?? [];
}

export async function addWatch(input: {
  claim: string;
  dueDate: string;
  sourceUrl?: string;
}): Promise<Watch> {
  const claim = input.claim.trim();
  if (!claim) throw new Error("A watch needs a claim to check.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)) throw new Error("Pick the day it should be checked.");

  const { data, error } = await supabase
    .from("claim_watches")
    .insert({
      claim,
      due_date: input.dueDate,
      source_url: input.sourceUrl?.trim() || null,
    })
    .select("id, claim, due_date, source_url, status, resolution, checked_at")
    .single();
  if (error) throw error;
  return data as Watch;
}

export async function removeWatch(id: string): Promise<void> {
  const { error } = await supabase.from("claim_watches").delete().eq("id", id);
  if (error) throw error;
}

export const WATCH_LABEL: Record<Watch["status"], string> = {
  pending: "Open",
  confirmed: "Confirmed",
  contradicted: "Contradicted",
  inconclusive: "Unclear",
};

/** Due today or overdue and still unresolved. */
export function dueWatches(watches: Watch[], today = new Date()): Watch[] {
  const iso = today.toISOString().slice(0, 10);
  return watches.filter((w) => w.status === "pending" && w.due_date <= iso);
}

/** Recently settled watches, newest first — the accountability record. */
export async function listResolvedWatches(days = 14): Promise<Watch[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("claim_watches")
    .select("id, claim, due_date, source_url, status, resolution, checked_at")
    .neq("status", "pending")
    .gte("checked_at", since)
    .order("checked_at", { ascending: false })
    .limit(6);
  if (error) throw error;
  return (data as Watch[]) ?? [];
}
