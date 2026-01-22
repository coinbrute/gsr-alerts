# GSR Alerts + Portfolio Tracker

A simple Next.js webapp that:
- Fetches BTC/USD (CoinGecko)
- Fetches Gold & Silver USD/oz (Metals-API if configured) with manual fallback
- Computes Gold–Silver Ratio (GSR)
- Shows your doctrine band + action
- Alerts when the ratio enters a new band
- Tracks portfolio value over time (localStorage snapshots)
- Charts component values (BTC/Gold/Silver/Total) + total in gold-equivalent ounces

## Tech
- Next.js (App Router) + TypeScript
- Chart.js + react-chartjs-2
- LocalStorage for persistence (no DB)

---

## Requirements
- Node.js 18+ (recommended)
- npm (or pnpm/yarn if you prefer)

---

## Setup

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment (optional but recommended)

Copy .env.example to .env.local:
```bash
cp .env.example .env.local
```

Edit .env.local and set your Metals-API key:
```bash
METALS_API_KEY=your_key_here
```

If you do not set a Metals-API key, the app will still function using:

Live BTC price

Manual Gold/Silver USD/oz fallback inputs in the UI
```bash
Run (dev)
npm run dev
```

Open:
```bash
http://localhost:3000
```

Build (prod)
```bash
npm run build
```

Run (prod)
```bash
npm run start
```

Test

This repo keeps tests minimal and uses linting as the test gate:
```bash
npm run test
```
(Equivalent to npm run lint)

### 3) How alerts work (v1)

* The app computes the current GSR (goldUsd / silverUsd)

* It maps the ratio to a doctrine band

* If the band changes from the previously stored band, it triggers an in-app alert message

This avoids spamming you every refresh while the ratio remains inside a band.

### 4) Next step (if you want real notifications)

* Browser Notifications API (push-like for active sessions)

* Email/SMS via Twilio/SendGrid/Mailgun (server route)

* Add cooldowns and “quiet hours”

### 5) Data persistence

* Holdings, refresh interval, manual fallback prices, snapshots, and last-band state are stored in localStorage.

* Snapshots are capped at 1000 entries.

To reset:

* Use "Clear snapshots" or "Reset app state" in the UI.

### 6) Deploy

#### Deploy to Vercel (recommended)

1) Push this repo to GitHub.

2) Import into Vercel.

3) Set environment variable:
    * ```bash
        METALS_API_KEY (optional)
      ```
4) Deploy.

Notes:

* CoinGecko may rate limit heavy traffic. For personal use, this is usually fine.

* If you hit rate limits, add caching on the server route or swap to a paid provider.

### Deploy to a VPS / Docker

This app is standard Next.js:

1) Build:
    ```bash
    npm ci
    npm run build
    ```

2) Run:
    ```bash
    npm run start
    ```

3) Put Nginx/Caddy in front if you want TLS and a domain.

### Customize doctrine thresholds

Edit:
```bash
lib/doctrine.ts
```

### Holding defaults

Defaults are set to your current values in:

* lib/storage.ts

Change:

```ts
holdings: { btc: 0, silverOz: 0, goldOz: 0 }
```

### Roadmap ideas (useful upgrades)

* Add browser push notifications (Notification API)

* Add email/SMS alerts with cooldowns + quiet hours

* Store snapshots in SQLite/Postgres for true history

* CSV export

* Add allocation % chart

* Add “rebalance plan builder” for the silver → gold tranches


### Build/Run/Deploy quick commands

```bash
# install
npm install

# dev
npm run dev

# test (lint)
npm run test

# build
npm run build

# prod
npm run start
```