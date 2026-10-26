# Threadwise — local development

Threadwise runs locally as a TanStack Start / Vite app. Supabase supplies
accounts and cloud sync; DeepSeek powers all AI features.

## Start locally

1. Install [Bun](https://bun.sh), then run `bun install` in this folder.
2. Copy `.env.example` to `.env` and fill in its values. Existing Supabase
   values can be retained; add your server-only `DEEPSEEK_API_KEY`.
3. Run `bun run dev` and open the local URL Vite prints (usually
   `http://localhost:3000`).

Use `bun run build` for a production build and `bun run preview` to serve it
locally. Never use `VITE_DEEPSEEK_API_KEY`: browser variables are public.

## DeepSeek configuration

The default is `deepseek-chat`. Set `DEEPSEEK_MODEL` to choose a different
DeepSeek chat model. The app calls DeepSeek's OpenAI-compatible
`https://api.deepseek.com/v1` endpoint from server routes only.
