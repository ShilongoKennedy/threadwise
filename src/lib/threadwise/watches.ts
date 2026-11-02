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
  scope: "personal" | "suggested";
  origin: string | null;
};

export async function listWatches(): Promise<Watch[]> {
  const { data, error } = await supabase
    .from("claim_watches")
    .select("id, claim, due_date, source_url, status, resolution, checked_at, scope, origin")
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
    .select("id, claim, due_date, source_url, status, resolution, checked_at, scope, origin")
    .single();
  if (error) throw error;
  return data as Watch;
}

/** Keeps an agent suggestion as one of your own claims. */
export async function claimWatch(id: string): Promise<void> {
  const { error } = await supabase.rpc("claim_suggested_watch", { watch_id: id });
  if (error) throw error;
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
    .select("id, claim, due_date, source_url, status, resolution, checked_at, scope, origin")
    .eq("scope", "personal")
    .neq("status", "pending")
    .gte("checked_at", since)
    .order("checked_at", { ascending: false })
    .limit(6);
  if (error) throw error;
  return (data as Watch[]) ?? [];
}

/**
 * Verifies a single watch against today's article, on demand. Same model, same
 * sources as the daily run — this is the manual trigger, not a different check.
 */
export async function checkWatchNow(
  id: string,
): Promise<{ status: Watch["status"]; note: string; source: string }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const response = await fetch("/api/check-watch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ watchId: id }),
  });
  const payload = (await response.json().catch(() => null)) as
    | { status: Watch["status"]; note: string; source: string; message?: string }
    | null;
  if (!response.ok) throw new Error(payload?.message ?? "The check could not be completed.");
  return {
    status: payload?.status ?? "inconclusive",
    note: payload?.note ?? "",
    source: payload?.source ?? "",
  };
}
