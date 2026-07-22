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

- **Facilitator** controls the phase (Lobby → IPO → FPO → Rights → Allotment → Secondary → Indices → SEBI → RBI → Global → Final Index → Debrief) from their own browser tab.
- Every team logs in with a login ID and password (see the table below) rather than picking a role from a list — this keeps roles fixed to the device that logged in for the session. After logging in, each team sees a details card describing their role and any tags (QIB, FII, existing shareholder) that affect what they're eligible for.
- The server holds one shared `state` object with all bids, orders, trades, and prices. Any action (submitting a bid, running order matching, triggering a regulatory event) is sent to the server, processed there, and the updated state is pushed to every connected browser in real time.
- Reconnects are automatic — if a laptop's wifi drops, Socket.io reconnects and immediately receives the current state. Logging in again after a refresh requires re-entering the same credentials (this is a client-side check, not a persisted session).

## Team logins

Share these with your 12 teams before class. The Facilitator view also shows this table on-screen for easy reference.

| Team | Login ID | Password |
|---|---|---|
| Company A (IPO) | companyA | ipoA123 |
| Company B (FPO) | companyB | fpoB123 |
| Company C (Rights/QIB) | companyC | rightsC123 |
| Investor Desk 1 | desk1 | trade1 |
| Investor Desk 2 | desk2 | trade2 |
| Investor Desk 3 | desk3 | trade3 |
| Investor Desk 4 | desk4 | trade4 |
| Investor Desk 5 | desk5 | trade5 |
| Investor Desk 6 | desk6 | trade6 |
| NSE Exchange Desk | nseDesk | nse123 |
| BSE Exchange Desk | bseDesk | bse123 |
| Regulatory Council | regulator | reg123 |
| Facilitator (you) | facilitator | host2026 |

Credentials are defined in `public/index.html` (search for `CREDENTIALS`) if you want to change any of them before your session.

## Resetting between class batches

The Facilitator's **Reset Simulation** button wipes all bids/orders/trades and restores starting cash for a fresh run. Because state is in-memory, restarting the Render service (or a deploy) also resets everything — so if you're running back-to-back sessions, prefer the in-app Reset button over redeploying.

## Files

- `server.js` — Express + Socket.io backend, holds all game logic (allotment, order matching, bracket/OCO orders, stop-loss triggers, regulatory events, settlement).
- `public/index.html` — the single-page frontend every team's browser loads.
- `package.json` — dependencies (`express`, `socket.io`) and the `npm start` script Render uses.
