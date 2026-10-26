import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { brokeredPreviewStorage } from "./previewAuthStorage";

/**
 * Browser-only Supabase client.
 *
 * Vite replaces these public variables in the browser bundle at build time.
 * Do not use process.env here: this module is imported by client components and
 * a server-created singleton could otherwise be reused during hydration.
 */
const browserUrl = import.meta.env.VITE_SUPABASE_URL;
const browserKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

let browserClient: SupabaseClient<Database> | undefined;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (typeof window === "undefined") {
    throw new Error("The browser Supabase client was requested during server rendering.");
  }
  if (!browserUrl || !browserKey) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  if (!browserClient) {
    browserClient = createClient<Database>(browserUrl, browserKey, {
      auth: {
        storage: brokeredPreviewStorage(),
        persistSession: true,
        autoRefreshToken: true,
        // The explicit /auth/callback route exchanges the OAuth response.
        detectSessionInUrl: false,
      },
    });
  }
  return browserClient;
}

/** Backwards-compatible lazy proxy for existing browser-only call sites. */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, property, receiver) {
    return Reflect.get(getSupabaseClient(), property, receiver);
  },
});

