/**
 * Server-side environment.
 *
 * Vite only inlines `VITE_*` variables into `import.meta.env` — it does not put
 * them on `process.env` at runtime — so server code that asked for
 * `process.env.VITE_SUPABASE_URL` got undefined on the deployed runtime and
 * silently failed to reach the database. Read both places, explicitly.
 */
export function serverEnv(name: string): string | undefined {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;

  const fromImportMeta = (import.meta.env as Record<string, string | undefined>)[name];
  if (fromImportMeta) return fromImportMeta;

  // A VITE_-prefixed variable is the same value under a different name.
  const prefixed = (import.meta.env as Record<string, string | undefined>)[`VITE_${name}`];
  if (prefixed) return prefixed;

  return process.env[`VITE_${name}`];
}

export function supabaseServerConfig(): { url: string | undefined; key: string | undefined } {
  return {
    url: serverEnv("SUPABASE_URL"),
    key: serverEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}
