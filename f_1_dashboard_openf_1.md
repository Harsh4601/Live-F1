# F1 Live Dashboard — Build Guide (OpenF1)

A friendly, step-by-step guide to build a **live Formula 1 racing dashboard** using the OpenF1 API. This is tailored for "vibe coding" in Cursor (or any developer environment). Build a real-time web dashboard first, then optionally convert parts into macOS menu-bar app or widgets.

---

## Quick tl;dr

- Use OpenF1 as the live data source.
- Start with a web dashboard (Next.js + React). It can poll or use WebSockets from a lightweight backend.
- Backend (Node.js/Express) polls OpenF1 (every 1–3 seconds), normalizes data, caches results, and serves it to frontends via a small REST API + WebSocket/SSE.
- Frontend displays live leaderboard, lap times, gaps, sector info, tyre/pit status.
- Deploy backend to a small runner (free tier possible) and frontend to Vercel/Netlify.

---

## What you'll get at the end

- A live-updating leaderboard with driver positions, lap number, gaps, fastest lap, tyre info and pit stops.
- Clean API endpoints you control (so widget or menu apps can fetch snapshots).
- A public URL you can share.

---

## Prerequisites

- Node.js (v16+ recommended)
- npm or yarn
- Basic React familiarity
- Optional: git, a GitHub account
- Optional: Cursor account for vibe-coding

---

## Architecture (high-level)

```
OpenF1 API (third-party live feed)
           ↓ (poll every 1–3s)
Backend (Node.js)
  • cache
  • transform/normalize
  • serve REST endpoints
  • push via WebSocket / SSE
           ↓
Frontend (Next.js / React)
  • subscribes via WebSocket or polls REST
  • renders leaderboard, charts
           ↓
Optional: macOS menu-bar app or widget pulls from your backend
```

Notes:
- Use the backend cache to avoid any sudden spikes or rate-limit issues.
- WebSocket or Server-Sent Events (SSE) gives best real-time UX.

---

## Project layout (recommended)

```
f1-live-tracker/
  backend/
    package.json
    server.js
    openf1.js
  frontend/
    package.json
    next.config.js
    pages/
      index.js
    components/
      Leaderboard.js
      RaceHeader.js
  README.md
```

---

## Backend — the responsibilities

- Poll OpenF1 endpoints for the active session (practice/qualifying/sprint/race).
- Normalize fields: driver id, abbreviation, lap, gap, sector times, tyre compound, pit status.
- Keep a small in-memory cache (and optionally Redis for persistence).
- Expose two interfaces:
  - REST snapshot endpoints (e.g., `/api/session`, `/api/positions`) for widgets and simple clients.
  - WebSocket (or SSE) channel to push deltas for real-time dashboards.

### Why a backend?
- Shields frontends from flaky third-party endpoints.
- Allows you to do data transformations and add rate limiting, logging.
- Makes it simple to add auth or analytics later.

---

## Backend: Example (Node.js + Express + ws)

Install:

```bash
mkdir backend && cd backend
npm init -y
npm i express node-fetch ws
```

Create `openf1.js` — a tiny client wrapping the OpenF1 endpoints. (Replace the sample endpoints with the exact OpenF1 endpoints you prefer.)

```js
// openf1.js
const fetch = require('node-fetch');

// Example wrapper — tweak endpoint paths to match the OpenF1 instance you use
const BASE = 'https://api.openf1.org/v1';

async function fetchSession() {
  const res = await fetch(`${BASE}/session`);
  return res.json();
}

async function fetchPositions(sessionKey) {
  const res = await fetch(`${BASE}/position?session_key=${sessionKey}`);
  return res.json();
}

module.exports = { fetchSession, fetchPositions };
```

Create `server.js`:

```js
// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { fetchSession, fetchPositions } = require('./openf1');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let cache = {
  session: null,
  positions: null,
  lastUpdated: null,
};

const POLL_MS = process.env.POLL_MS ? Number(process.env.POLL_MS) : 2000;

async function poll() {
  try {
    const session = await fetchSession();
    // pick a session key from session data — this depends on returned format
    const sessionKey = session && session.current ? session.current.key : 'latest';

    const positions = await fetchPositions(sessionKey);

    cache = {
      session,
      positions,
      lastUpdated: Date.now(),
    };

    // broadcast to WebSocket clients
    const payload = JSON.stringify({ type: 'update', data: cache });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(payload);
    });
  } catch (err) {
    console.error('poll error', err);
  }
}

setInterval(poll, POLL_MS);
poll();

app.get('/api/session', (req, res) => {
  res.json({ ok: true, ...cache });
});

server.listen(process.env.PORT || 3001, () => {
  console.log('Backend listening on port', process.env.PORT || 3001);
});
```

Notes:
- `node-fetch` is used; you can use native `fetch` in newer Node versions.
- Adjust `fetchSession` / `fetchPositions` to the actual OpenF1 schema you encounter.
- For production and many users, replace in-memory cache with Redis or similar.

---

## Frontend — Next.js (React) + WebSocket

Create a Next app (inside `frontend/`):

```bash
npx create-next-app@latest frontend
cd frontend
npm i swr
```

### Simple live subscription component (hooks + WebSocket)

Create `components/useLiveF1.js`:

```js
import { useEffect, useState, useRef } from 'react';

export default function useLiveF1(wsUrl) {
  const [state, setState] = useState({ session: null, positions: null });
  const wsRef = useRef(null);

  useEffect(() => {
    wsRef.current = new WebSocket(wsUrl);
    wsRef.current.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'update') setState(msg.data);
      } catch (e) {
        console.error('invalid ws payload', e);
      }
    };

    wsRef.current.onopen = () => console.log('WS connected');
    wsRef.current.onclose = () => console.log('WS closed');

    return () => {
      wsRef.current && wsRef.current.close();
    };
  }, [wsUrl]);

  return state;
}
```

Create `components/Leaderboard.js`:

```js
export default function Leaderboard({ positions }) {
  if (!positions || !positions.drivers) return <div>Waiting for data…</div>;

  return (
    <div className="leaderboard">
      <ol>
        {positions.drivers.map((d) => (
          <li key={d.id}>
            <strong>{d.pos}. {d.shortName}</strong>
            <div>Gap: {d.gap}</div>
            <div>Lap: {d.lap}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

Use the hook in `pages/index.js`:

```js
import dynamic from 'next/dynamic';
import useLiveF1 from '../components/useLiveF1';
import Leaderboard from '../components/Leaderboard';

export default function Home() {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
  const { positions, session } = useLiveF1(wsUrl);

  return (
    <main>
      <h1>F1 Live Tracker</h1>
      <div>Session: {session ? session.name : '—' }</div>
      <Leaderboard positions={positions} />
    </main>
  );
}
```

Notes:
- For simple setups you can poll the backend using `fetch` or `useSWR` instead of WebSocket.
- Keep UI updates lightweight — only re-render changed parts.

---

## Handling different sessions (P1/P2/P3/Quali/Sprint/Race)

- `session` data from OpenF1 usually includes a session type and status. Use that to label the UI.
- Make the frontend show the active session and allow users to switch to previous session data (historical) if the API has it.

Example: `session.name` might be `FP1`, `Qualifying`, `Sprint`, `Race`.

---

## Rate limiting and polite polling

- Poll every 1–3 seconds for live racing data; 2 seconds is a reasonable baseline.
- Implement exponential backoff on repeated failures.
- Respect any `Retry-After` or rate limit headers if returned by the OpenF1 provider.

---

## Caching strategy

- In-memory cache is fine for personal projects.
- For production: Redis to share cache across multiple instances.
- Keep the last successful payload and timestamp, and serve that immediately to new clients.

---

## Deploying for free (quick)

- Frontend: deploy to Vercel or Netlify (Next.js works well on Vercel).
- Backend: deploy to Render (free tier), Railway, Fly (free credits), or a small Heroku free instance (if available) — or host on a small VM.

Notes:
- If using WebSockets, ensure chosen platform supports long-lived sockets (Vercel serverless functions do not — prefer Render/Rails/Heroku/Fly for backend WebSocket support).
- Alternatively, use SSE (easier on some platforms) or implement client-side polling.

---

## Local testing tips

- Run backend: `node server.js` (or `nodemon server.js` for auto reload).
- Run frontend: `npm run dev` inside the Next project.
- If using different ports, set `NEXT_PUBLIC_WS_URL` to `ws://localhost:3001`.
- Use `ngrok` or `cloudflared` to expose local backend if testing on remote devices.

---

## Logging & debugging

- Backend: log poll responses length and timestamps. Log errors separately.
- Frontend: show a small timestamp like `Last updated: HH:MM:SS` so you always know how fresh the view is.

---

## UI/UX suggestions

- Minimal, high-contrast data cards.
- Large driver abbreviations, gap numbers, and lap count.
- Color-code tyres and pit status.
- Add a small track map image if you like.
- On mobile, show compact list; on desktop, show full leaderboard with gaps and sectors.

---

## Packaging later as macOS menu app / widgets

- Menu-bar apps can poll your backend every 1–3s and show live updates — great for "near-real-time".
- Widgets (WidgetKit) are snapshots and have limited refresh. Widget is good for quick glance only.
- For macOS development use SwiftUI + AppKit; call your REST snapshot endpoints for widget content.

---

## Security and legal notes

- Make sure you comply with OpenF1's terms of use.
- If you plan to redistribute heavily or commercialize, double-check legal permission for streaming their feed.

---

## Next steps — quick checklist to start coding right now

1. Create Git repo `f1-live-tracker` and two folders `backend`, `frontend`.
2. Implement backend skeleton (`server.js`, `openf1.js`) and run it locally.
3. Implement frontend Next app with `useLiveF1` hook and `Leaderboard` component.
4. Wire WebSocket or polling to the backend.
5. Style using Tailwind or minimal CSS.
6. Deploy frontend to Vercel and backend to Render/Railway.
7. Iterate: add tyre/pit/sector info, notifications, and a dark theme.

---

## Extra: Sample `package.json` scripts

For backend `package.json`:

```json
{
  "name": "f1-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "node-fetch": "^2.6.7",
    "ws": "^8.12.0"
  }
}
```

For frontend `package.json` (Next default): keep `dev`, `build`, `start`.

---

## Want me to scaffold it for you?

I can generate the initial repository files (backend + frontend) as a zipped project or create the code directly in the Cursor workspace. Tell me if you want:

- A full scaffold (I create all files), or
- Only backend scaffold, or
- Only frontend scaffold.

---

Good vibes — enjoy building! If you want, I can now create the starter scaffold for you (backend + frontend) in this workspace.

