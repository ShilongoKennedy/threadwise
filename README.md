# Threadwise — local development

Threadwise runs locally as a TanStack Start / Vite app. Supabase supplies
accounts and cloud sync; DeepSeek powers all AI features.

## Start locally

1. Install [Bun](https://bun.sh), then run `bun install` in this folder.
2. Copy `.env.example` to `.env.local` and fill in its values. Add your
   server-only `DEEPSEEK_API_KEY`. To test AI before setting up accounts, set
   `ALLOW_LOCAL_AI_UNAUTHENTICATED=true`; it works only on localhost and must
   never be deployed.
3. Run `bun run dev` and open the local URL Vite prints (usually
   `http://localhost:3000`).

Use `bun run build` for a production build and `bun run preview` to serve it
locally. Never use `VITE_DEEPSEEK_API_KEY`: browser variables are public.

## DeepSeek configuration

The default is `deepseek-chat`. Set `DEEPSEEK_MODEL` to choose a different
DeepSeek chat model. The app calls DeepSeek's OpenAI-compatible
`https://api.deepseek.com/v1` endpoint from server routes only.

## Google sign-in and cloud sync

Threadwise uses Supabase for accounts and cloud sync. Create a Supabase project,
then add its Project URL and publishable key (`VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY`) to Vercel and `.env.local`. In Supabase, enable **Authentication → Providers →
Google**, supply Google OAuth client credentials, and add
`http://127.0.0.1:3000/auth/callback` (and
`http://localhost:3000/auth/callback`) to the allowed redirect URLs. Add your
production callback too, for example
`https://threadwise-beta.vercel.app/auth/callback`. The app now uses Supabase's
Google OAuth directly; it does not require
Lovable, GitHub, or Vercel to run locally.
