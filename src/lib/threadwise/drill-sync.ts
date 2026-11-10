import { supabase } from "@/integrations/supabase/client";
import type { Drill, DrillCompletion } from "./practice";

export type RemoteDrillState = {
  drill: Drill | null;
  history: DrillCompletion[];
  pending: boolean;
};

async function accessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

const isKind = (value: unknown): value is Drill["kind"] =>
  value === "falsifier" || value === "steelman" || value === "teach";

/** Best effort: local storage is the fallback when the table or account is absent. */
export async function loadRemoteDrillState(week: string): Promise<RemoteDrillState> {
  const jwt = await accessToken();
  if (!jwt) return { drill: null, history: [], pending: true };
  try {
    const response = await fetch(`/api/drill?week=${encodeURIComponent(week)}`, {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    });
    if (!response.ok) return { drill: null, history: [], pending: true };
    const body = (await response.json()) as {
      drill?: unknown;
      history?: unknown;
      pending?: unknown;
    };
    const raw = body.drill as Partial<Drill> | null | undefined;
    const drill =
      raw &&
      typeof raw.week === "string" &&
      typeof raw.token === "string" &&
      isKind(raw.kind)
        ? {
            week: raw.week,
            kind: raw.kind,
            token: raw.token,
            title: typeof raw.title === "string" ? raw.title : "",
            reason: typeof raw.reason === "string" ? raw.reason : "",
            ...(typeof raw.completedAt === "string" ? { completedAt: raw.completedAt } : {}),
          }
        : null;
    const history = Array.isArray(body.history)
      ? body.history.filter(
          (item): item is DrillCompletion =>
            Boolean(item) &&
            typeof item === "object" &&
            typeof (item as DrillCompletion).week === "string" &&
            isKind((item as DrillCompletion).kind) &&
            typeof (item as DrillCompletion).token === "string" &&
            typeof (item as DrillCompletion).completedAt === "string",
        )
      : [];
    return { drill, history, pending: Boolean(body.pending) };
  } catch {
    return { drill: null, history: [], pending: true };
  }
}

export async function saveRemoteDrill(drill: Drill): Promise<boolean> {
  const jwt = await accessToken();
  if (!jwt) return false;
  try {
    const response = await fetch("/api/drill", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({
        week: drill.week,
        kind: drill.kind,
        token: drill.token,
        title: drill.title,
        reason: drill.reason,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function completeRemoteDrill(drill: Drill): Promise<boolean> {
  const jwt = await accessToken();
  if (!jwt) return false;
  try {
    // Pin first in case this device completed before the pin reached the account.
    await saveRemoteDrill(drill);
    const response = await fetch("/api/drill", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ week: drill.week }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Old completions made while signed out are pushed up so the account's drill
 * history is complete. Current-week work is handled by the drill itself.
 */
export async function syncMissingDrillHistory(
  local: DrillCompletion[],
  remote: DrillCompletion[],
): Promise<number> {
  const remoteWeeks = new Set(remote.map((item) => item.week));
  const missing = local
    .filter((item) => !remoteWeeks.has(item.week))
    .slice(-10);
  let synced = 0;
  for (const item of missing) {
    const drill: Drill = {
      week: item.week,
      kind: item.kind,
      token: item.token,
      title: "Practice drill",
      reason: "Completed before sync",
      completedAt: item.completedAt,
    };
    await saveRemoteDrill(drill);
    if (await completeRemoteDrill(drill)) synced += 1;
  }
  return synced;
}
