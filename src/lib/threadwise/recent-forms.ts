/** Client-side structural memory. Stores no source text, only the shape used. */

const LIMIT = 4;

export const ANALYST_FORM_KEY = "threadwise:analyst:recent-forms";
export const SEMINAR_FORM_KEY = "threadwise:seminar:recent-forms";

export function readRecentForms(key: string, allowed: readonly string[]): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is string => typeof value === "string" && allowed.includes(value))
      .slice(0, LIMIT);
  } catch {
    return [];
  }
}

export function rememberForm(key: string, form: string, allowed: readonly string[]) {
  if (typeof window === "undefined" || !allowed.includes(form)) return;
  const next = [form, ...readRecentForms(key, allowed).filter((value) => value !== form)].slice(0, LIMIT);
  try {
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // A blocked storage API must never stop a read.
  }
}
