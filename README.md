# Capital Markets Live

A 2-hour, 12-team classroom simulation covering primary markets (IPO/FPO/Rights/Private Placement), secondary market trading (Market/Limit/Stop-loss/Stop-limit/Bracket orders), NSE vs BSE + Nifty/Sensex indices, and SEBI/RBI/Global regulators.

This is a real-time multiplayer web app: Node.js + Express + Socket.io backend, single-page vanilla-JS frontend. All game state lives on the server and pushes to every connected browser instantly — no polling, no external database needed (in-memory state is fine for a single class session).

## Running locally

```
npm install
npm start
```

Then open `http://localhost:3000` in a few browser tabs to try different roles.

## Deploying to Render

1. **Push this folder to a GitHub repo** (a new one, or a new folder in an existing repo like your `IAPM-Module-1` repo).
2. On [render.com](https://render.com), click **New +** → **Web Service**.
3. Connect the GitHub repo.
4. Configure:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free tier is fine for a single 2-hour session with 13 connections.
5. Click **Create Web Service**. Render will build and give you a URL like `https://capital-markets-live.onrender.com`.
6. Share that URL with your 12 teams (QR code, WhatsApp, projector — whatever's easiest).

**Free-tier heads-up:** Render's free web services spin down after ~15 minutes of no traffic and take 30–60 seconds to wake back up on the next request. Open the URL yourself about 5 minutes before class starts so it's already warm when the 12 teams connect — otherwise the first person to load it will see a blank page for up to a minute.

## How the game works

- **Facilitator** controls the phase (Lobby → IPO → FPO → Rights → Allotment → Break → Secondary → Indices → SEBI → RBI → Global → Final Index → Debrief) from their own browser tab.
- Every other team picks their role from the same lobby screen (Company A/B/C, Investor Desks 1–6, NSE Desk, BSE Desk, Regulatory Council).
- The server holds one shared `state` object with all bids, orders, trades, and prices. Any action (submitting a bid, running order matching, triggering a regulatory event) is sent to the server, processed there, and the updated state is pushed to every connected browser in real time.
- Reconnects are automatic — if a laptop's wifi drops, Socket.io reconnects and immediately receives the current state.

## Resetting between class batches

The Facilitator's **Reset Simulation** button wipes all bids/orders/trades and restores starting cash for a fresh run. Because state is in-memory, restarting the Render service (or a deploy) also resets everything — so if you're running back-to-back sessions, prefer the in-app Reset button over redeploying.

## Files

- `server.js` — Express + Socket.io backend, holds all game logic (allotment, order matching, bracket/OCO orders, stop-loss triggers, regulatory events, settlement).
- `public/index.html` — the single-page frontend every team's browser loads.
- `package.json` — dependencies (`express`, `socket.io`) and the `npm start` script Render uses.
