# Threadwise — Spatial Intelligence OS

Threadwise runs locally as a TanStack Start / Vite app. Supabase supplies
accounts and cloud sync; DeepSeek, Gemini, and OpenAI power all AI features.

## The Architecture
Threadwise is an AI-powered intelligence machine consisting of:
1. **The Discourse Lab (Reading Room):** Ingests documents/URLs and uses AI to perform forensic linguistics, find logical fallacies, run Cross-Source synthesis, and identify "Blind Spots" (The Dog That Didn't Bark).
2. **The Canvas (War Room):** A React Flow spatial graph. It handles smart-wiring (auto-connecting insights), semantic auto-layout (`intelligentTidy`), and AI Red Teaming. Sources are anchored as "Dossier" nodes, and blind spots as dashed "Omission" nodes.
3. **Briefing Mode:** A cinematic presentation tool that glides the camera across the canvas, dimming the background and showing the active node's intelligence in a frosted-glass side panel.

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

## AI Configuration

The default is `deepseek-chat`. Set `DEEPSEEK_MODEL` to choose a different
DeepSeek chat model. The app calls DeepSeek's OpenAI-compatible
`https://api.deepseek.com/v1` endpoint from server routes only. 
Gemini and OpenAI are used for specific multi-model consensus and cross-source tasks.

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
