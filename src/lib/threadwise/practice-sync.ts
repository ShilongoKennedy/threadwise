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

export async function loadRemotePractice(): Promise<PracticeAttempt[]> {
  const jwt = await accessToken();
  if (!jwt) return [];
  try {
    const response = await fetch("/api/practice", {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    });
    if (!response.ok) return [];
    const body = (await response.json()) as { attempts?: unknown };
    if (!Array.isArray(body.attempts)) return [];
    return body.attempts.filter(
      (attempt): attempt is PracticeAttempt =>
        Boolean(attempt) &&
        typeof attempt === "object" &&
        typeof (attempt as PracticeAttempt).token === "string" &&
        isKind((attempt as PracticeAttempt).kind) &&
        typeof (attempt as PracticeAttempt).passed === "number" &&
        typeof (attempt as PracticeAttempt).total === "number" &&
        typeof (attempt as PracticeAttempt).at === "string",
    );
  } catch {
    return [];
  }
}
