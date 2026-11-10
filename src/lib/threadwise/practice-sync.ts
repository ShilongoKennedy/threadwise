import { supabase } from "@/integrations/supabase/client";
import type { PracticeAttempt, PracticeKind } from "./practice";

async function accessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

const isKind = (value: unknown): value is PracticeKind =>
  value === "falsifier" || value === "steelman" || value === "teach";

/** Best effort: local storage is the fallback if the account or table is absent. */
export async function savePracticeAttempt(attempt: PracticeAttempt): Promise<boolean> {
  const jwt = await accessToken();
  if (!jwt) return false;
  try {
    const response = await fetch("/api/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
      body: JSON.stringify(attempt),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export type RemotePracticeState = {
  attempts: PracticeAttempt[];
  pending: boolean;
};

export async function loadRemotePractice(): Promise<RemotePracticeState> {
  const empty = { attempts: [], pending: true };
  const jwt = await accessToken();
  if (!jwt) return empty;
  try {
    const response = await fetch("/api/practice", {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    });
    if (!response.ok) return empty;
    const body = (await response.json()) as { attempts?: unknown; pending?: unknown };
    if (!Array.isArray(body.attempts)) return empty;
    return {
      attempts: body.attempts.filter(
      (attempt): attempt is PracticeAttempt =>
        Boolean(attempt) &&
        typeof attempt === "object" &&
        typeof (attempt as PracticeAttempt).token === "string" &&
        isKind((attempt as PracticeAttempt).kind) &&
        typeof (attempt as PracticeAttempt).passed === "number" &&
        typeof (attempt as PracticeAttempt).total === "number" &&
        typeof (attempt as PracticeAttempt).at === "string",
      ),
      pending: Boolean(body.pending),
    };
  } catch {
    return empty;
  }
}

/**
 * Pushes attempts made while signed out, or before the table existed, up to the
 * account. Bounded per load so a profile visit cannot stampede the API.
 */
export async function syncMissingPracticeAttempts(
  local: PracticeAttempt[],
  remote: PracticeAttempt[],
): Promise<number> {
  const key = (attempt: PracticeAttempt) =>
    `${attempt.token}|${attempt.kind}|${attempt.at}`;
  const remoteKeys = new Set(remote.map(key));
  const missing = local.filter((attempt) => !remoteKeys.has(key(attempt))).slice(0, 10);
  let synced = 0;
  for (const attempt of missing) {
    if (await savePracticeAttempt(attempt)) synced += 1;
  }
  return synced;
}
