import { supabase } from "@/integrations/supabase/client";
export async function authHeaders() {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
  } catch {
    // The local development route may explicitly permit an unauthenticated DeepSeek
    // test. Production always validates this on the server.
    return {};
  }
}
export async function streamTask(body: unknown, onText: (text: string) => void, signal: AbortSignal) {
  const response = await fetch("/api/threadwise", { method: "POST", headers: { "Content-Type": "application/json", ...await authHeaders() }, body: JSON.stringify(body), signal });
  if (!response.ok) { const error = await response.json().catch(() => null); throw new Error(error?.message ?? `Request failed (${response.status}).`); }
  if (!response.body) throw new Error("No response received.");
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let text = "";
  while (true) { const { done, value } = await reader.read(); if (done) break; text += decoder.decode(value, { stream: true }); onText(text); }
  if (!text.trim()) throw new Error("The thinking tool returned no text.");
  if (text.includes("[Request stopped:")) throw new Error(text.slice(text.indexOf("[Request stopped:")).replace(/^\[Request stopped: |\]$/g, ""));
  return text;
}
