# Chatbot UI + RAG Server

Single repository that contains a Vite React UI (`src/`) and an Express server (`server.js`) that proxies chat requests to OpenAI and an optional ChromaDB-backed RAG workflow.

The repo intentionally keeps local development ergonomics (`vite dev` + local Express) while supporting deployment as a single Render Web Service that serves the compiled UI and API from the same process.

## Environment variables

Copy `.env.example` to `.env` for local use and fill in real values:

```bash
cp .env.example .env
```

Only variables prefixed with `VITE_` are exposed to the browser build; the rest stay server-side. Core fields:

- `OPENAI_API_KEY` (required) – API key Render will store securely.
- `OPENAI_MODEL` (optional) – fallback OpenAI chat model (defaults to `gpt-4o-mini`).
- `OPENAI_REALTIME_MODEL` (optional) – Realtime voice model for `/api/realtime/session` (defaults to `gpt-realtime`).
- `OPENAI_REALTIME_TRANSCRIBE_MODEL` (optional) – input transcription model for voice sessions (defaults to `gpt-4o-mini-transcribe`).
- `ENABLE_RAG` – set to `false` to skip ChromaDB lookups.
- `CHROMA_*` – host/port/path/SSL flags for your Chroma instance. Leave pointed to `localhost:8000` for local experimentation.
- `VITE_API_BASE_URL` – optional override for the UI to reach a remote API. When unset it uses `http://localhost:5001` during development and same-origin requests in production.

## Sales roleplay backend

The backend now supports configurable customer personas for sales practice, including OpenAI Realtime voice session creation.

Authenticated endpoints:

- `GET /api/personas` – list built-in personas plus the signed-in user’s custom personas
- `GET /api/personas/:personaId` – load one persona
- `POST /api/personas` – create a custom persona
- `PATCH /api/personas/:personaId` – update a custom persona
- `DELETE /api/personas/:personaId` – delete a custom persona
- `POST /api/realtime/session` – mint a short-lived OpenAI Realtime client secret configured for a selected persona

`POST /chat` also accepts an optional `personaId`. When present, the model roleplays as that customer persona instead of using the coaching preset flow.

Example persona create payload:

```json
{
  "name": "Luxury Buyer With Time Pressure",
  "description": "Values premium quality but needs a fast decision.",
  "scenario": "Buying a full mattress setup before weekend guests arrive.",
  "industry": "bedding sales",
  "productFocus": "mattresses and adjustable bases",
  "difficulty": "hard",
  "voice": "marin",
  "temperature": 0.75,
  "speakingStyle": "Direct, polished, and impatient with vague answers.",
  "personalityTraits": ["high standards", "busy", "image-conscious"],
  "objections": ["delivery window", "premium price", "comfort guarantee"],
  "hiddenGoal": "Wants confidence the premium option is genuinely worth it."
}
```

Example realtime session request:

```json
{
  "personaId": "skeptical-homeowner",
  "businessName": "Reid Home Furnishings",
  "salesObjective": "Practice discovery and objection handling on a kitchen package",
  "voice": "cedar",
  "speed": 1,
  "expiresAfterSeconds": 600
}
```

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
