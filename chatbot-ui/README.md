# Chatbot UI + RAG Server

Single repository that contains a Vite React UI (`src/`) and an Express server (`server.js`) that proxies chat requests to OpenAI and an optional ChromaDB-backed RAG workflow.

The repo intentionally keeps local development ergonomics (`vite dev` + local Express) while supporting deployment as a single Render Web Service that serves the compiled UI and API from the same process.

## Environment variables

Copy `.env.example` to `.env` for local use and fill in real values:

```
cp .env.example .env
```

Only variables prefixed with `VITE_` are exposed to the browser build; the rest stay server-side. Core fields:

- `OPENAI_API_KEY` (required) – API key Render will store securely.
- `OPENAI_MODEL` (optional) – fallback OpenAI chat model (defaults to `gpt-4o-mini`).
- `ENABLE_RAG` – set to `false` to skip ChromaDB lookups.
- `CHROMA_*` – host/port/path/SSL flags for your Chroma instance. Leave pointed to `localhost:8000` for local experimentation.
- `VITE_API_BASE_URL` – optional override for the UI to reach a remote API. When unset it uses `http://localhost:5001` during development and same-origin requests in production.

## Local development workflow

1. Install dependencies once: `npm install`
2. Start the API/RAG server: `npm start` (loads `.env` via `dotenv/config` and hosts on `PORT` or `5001`).
3. In a second terminal run the Vite dev server: `npm run dev`
4. The UI calls `http://localhost:5001/chat` unless `VITE_API_BASE_URL` is set; this keeps your local setup working even while a hosted copy is running elsewhere.

## Render deployment checklist

1. Push this repo to GitHub; create a new **Web Service** in Render and connect the repo.
2. Set the **Build Command** to `npm install && npm run build`. This builds the Vite UI into `dist/` before the server boots.
3. Set the **Start Command** to `npm start`. Express now serves both API routes and the compiled UI from `dist/`.
4. Add environment variables in the Render dashboard:
   - `OPENAI_API_KEY`, `OPENAI_MODEL`, `ENABLE_RAG`
   - Any `CHROMA_*` overrides that point to a reachable Chroma deployment
   - Optionally `VITE_API_BASE_URL` if your API lives on a different Render service
5. Render injects `PORT`; `server.js` already honors it, so no extra configuration is needed.

### Developing locally while hosted

- Keep your `.env` with local values; Render never sees this file because `.env` is git-ignored.
- When you need to test against the remote Render API from your local UI, set `VITE_API_BASE_URL` in a `.env.local` to the production URL (e.g. `https://your-app.onrender.com`). Remove or change it to go back to the local server.
- The server respects `ENABLE_RAG=false`, letting you hack on the UI or OpenAI prompts even if Chroma is unavailable outside your network.

With these steps you can continue shipping locally and only redeploy to Render when you're ready.
