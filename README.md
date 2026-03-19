<div align="center">

# 📡 TrackOS

### Self-hosted, real-time web analytics platform

*Track visitors across all your websites — no third-party, no data leaks, full control.*


**[Features](#-features) · [Architecture](#-architecture) · [Quick start](#-quick-start) · [track.js](#-trackjs-integration) · [Deploy](#-production-deployment) · [API](#-api-reference)**

</div>

---

## 🇫🇷 Description

TrackOS est une plateforme complète de surveillance de trafic web développée **from scratch**, entièrement auto-hébergée. Elle permet de suivre en temps réel les visiteurs de plusieurs sites simultanément — pages consultées, localisation géographique, type d'appareil, durée de lecture, profondeur de scroll et events personnalisés — sans dépendre d'un service tiers comme Google Analytics. Les données restent sur votre propre VPS, vous gardez le contrôle total.

Le projet repose sur un serveur **Node.js + Express + Socket.IO** qui reçoit les données du script client (`track.js`) et les pousse instantanément vers le dashboard. Le frontend **React + Redux Toolkit + Material UI** affiche les métriques en temps réel avec des graphiques interactifs Chart.js. L'authentification s'appuie sur un JWT émis par une application **Symfony** existante — aucun service d'auth supplémentaire requis.

## 🇬🇧 Description

TrackOS is a fully self-hosted web traffic monitoring platform built from scratch. It tracks visitors across multiple websites simultaneously in real time — pages visited, geographic location, device type, reading duration, scroll depth, and custom events — without relying on third-party services like Google Analytics. Data stays on your own VPS, giving you full control over privacy and infrastructure.

The project is built on a **Node.js + Express + Socket.IO** server that receives data from the client script (`track.js`) and pushes it instantly to the dashboard. The **React + Redux Toolkit + Material UI** frontend displays real-time metrics with interactive Chart.js visualizations. Authentication delegates to an existing **Symfony** application via JWT — no additional auth service required.

## 🇮🇹 Descrizione

TrackOS è una piattaforma completa di monitoraggio del traffico web sviluppata da zero, completamente self-hosted. Permette di seguire in tempo reale i visitatori di più siti contemporaneamente — pagine visitate, posizione geografica, tipo di dispositivo, durata della lettura, profondità di scorrimento ed eventi personalizzati — senza dipendere da servizi di terze parti come Google Analytics. I dati rimangono sul proprio VPS, con il pieno controllo su privacy e infrastruttura.

Il progetto si basa su un server **Node.js + Express + Socket.IO** che riceve i dati dallo script client (`track.js`) e li invia istantaneamente alla dashboard. Il frontend **React + Redux Toolkit + Material UI** visualizza le metriche in tempo reale con grafici interattivi Chart.js. L'autenticazione si affida a un'applicazione **Symfony** esistente tramite JWT — nessun servizio di autenticazione aggiuntivo richiesto.

---

## ✨ Features

- **Real-time visitor stream** — Socket.IO pushes every new pageview to the dashboard instantly
- **Embeddable tracking script** — `track.js` is < 4kb, loads async, zero dependencies on target sites
- **Multi-site management** — add unlimited sites, each with its own unique `site_key`
- **Rich visitor data** — IP geolocation, browser/OS/device detection, scroll depth, time on page, bounce detection
- **Custom events** — `window.trackos.event('click', 'cta', { page: 'home' })`
- **Global analytics dashboard** — cross-site charts: timeline, top pages, countries, hourly heatmap, device breakdown
- **Interactive Chart.js charts** — area charts, donut charts, grouped bar charts, per-site comparison
- **Symfony JWT auth** — delegates to your existing Symfony app (HS256, no extra service)
- **Bot filtering** — bots filtered client-side before any data is sent
- **UTM tracking** — `utm_source`, `utm_medium`, `utm_campaign` auto-detected from query string
- **Production-ready** — Apache reverse proxy + WebSocket upgrade, PM2 process manager, Let's Encrypt SSL

---

## 🏗 Architecture

```
trackos/
├── server/                         ← Node.js API + WebSocket server
│   ├── src/
│   │   ├── index.js                — Express entry point, CORS, routes
│   │   ├── socket/
│   │   │   └── hub.js              — Socket.IO hub (/track + /dashboard namespaces)
│   │   ├── middleware/
│   │   │   └── auth.js             — Symfony JWT validation (HS256)
│   │   ├── controllers/
│   │   │   ├── trackController.js      — HTTP fallback for track.js
│   │   │   ├── analyticsController.js  — Per-site analytics endpoints
│   │   │   ├── globalController.js     — Cross-site global stats
│   │   │   └── sitesController.js      — Sites CRUD
│   │   ├── services/
│   │   │   ├── visitService.js     — Visit tracking + MySQL queries
│   │   │   └── siteService.js      — Site management
│   │   ├── routes/
│   │   │   └── index.js            — API route definitions
│   │   └── utils/
│   │       ├── db.js               — MySQL2 connection pool
│   │       └── geoua.js            — GeoIP + User-Agent parser
│   ├── public/
│   │   └── track.js               ← Embeddable tracking script (< 4kb)
│   ├── schema.sql                  ← Database schema
│   ├── ecosystem.config.cjs        ← PM2 production config
│   └── .env.example
│
├── dashboard/                      ← React SPA (Vite + MUI Light)
│   ├── src/
│   │   ├── App.jsx                 — Router + Redux Provider + auth guard
│   │   ├── theme/                  — Material UI Light theme
│   │   ├── app/store.js            — Redux store
│   │   ├── features/
│   │   │   ├── sites/              — Sites slice (CRUD async thunks)
│   │   │   ├── analytics/          — Analytics slice (stats, charts, global)
│   │   │   └── realtime/           — Realtime slice (Socket.IO events)
│   │   ├── hooks/
│   │   │   └── useSocket.js        — Socket init + site subscriptions
│   │   ├── services/
│   │   │   ├── api.js              — Axios instance + JWT interceptor
│   │   │   └── socket.js           — Socket.IO singleton (/dashboard)
│   │   └── components/
│   │       ├── layout/             — Sidebar, TopBar, ProtectedRoute
│   │       ├── pages/              — Overview, GlobalStats, Sites, Realtime,
│   │       │                         Analytics, Visitors, Login
│   │       └── widgets/            — StatCard, LiveFeed, ActiveVisitors
│   └── .env.example
│
└── apache/
    └── trackos.conf                ← Apache VirtualHost (SSL + WS proxy)
```

### Data flow

```
Tracked site (any domain)
    └─ track.js
        ├─ Socket.IO  →  Node :4000  /track      (real-time pageview)
        └─ sendBeacon →  Node :4000  /api/track   (HTTP fallback)

React Dashboard
    ├─ REST    →  Node :4000  /api/*              (JWT protected)
    └─ WS      →  Node :4000  /dashboard          (live visitor push)

Auth flow
    └─ POST    →  Symfony /login_verify           (returns { token, user })
         └─ localStorage.setItem('jwt_token', token)
              └─ injected as Bearer in every request
```

---

## 📋 Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | ≥ 20 | Required for server and dashboard build |
| MySQL | ≥ 8 | Database for visits, sites, events |
| npm | ≥ 9 | Package manager |
| Symfony app | any | Must expose a `POST /login_verify` endpoint returning `{ token, user }` |
| Apache | ≥ 2.4 | Production only — `mod_proxy`, `mod_proxy_wstunnel` required |

---

## 🚀 Quick start

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/trackos.git
cd trackos
```

### 2. Database

```bash
# Connect as root and create DB + user
mysql -u root -p <<SQL
CREATE DATABASE tracker_os CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'trackos_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON tracker_os.* TO 'trackos_user'@'localhost';
FLUSH PRIVILEGES;
SQL

# Import schema
mysql -u trackos_user -p tracker_os < server/schema.sql
```

### 3. Server

```bash
cd server
cp .env.example .env   # then edit .env
npm install
npm run dev            # starts on :4000
```

**`server/.env` key variables:**

| Variable | Description |
|---|---|
| `PORT` | Node.js port (default: 4000) |
| `DB_HOST / DB_USER / DB_PASSWORD / DB_NAME` | MySQL credentials |
| `JWT_SECRET` | **Same key as Symfony** — raw value, no quotes |
| `DASHBOARD_ORIGIN` | React dashboard URL (for CORS) |
| `ALLOWED_TRACK_ORIGINS` | Comma-separated tracked site URLs |

> **Finding `JWT_SECRET`**: look for `JWT_SECRET_KEY` in your Symfony `.env.local`,
> or `secret` under `lexik_jwt_authentication` in `config/packages/`.

### 4. Dashboard

```bash
cd dashboard
cp .env.example .env   # then edit .env
npm install
npm run dev            # starts on :5173
```

**`dashboard/.env` key variables:**

| Variable | Description |
|---|---|
| `VITE_API_URL` | TrackOS Node.js API — e.g. `http://localhost:4000/api` |
| `VITE_SOCKET_URL` | Socket.IO base URL — e.g. `http://localhost:4000` |
| `VITE_SYMFONY_LOGIN_URL` | Symfony POST login endpoint — e.g. `http://127.0.0.1:8000/login_verify` |

> ⚠️ `VITE_API_URL` points to **Node.js**, not Symfony. Symfony only handles JWT emission.

Open `http://localhost:5173` — login with your Symfony credentials.

---

## 📡 track.js Integration

Add this snippet before `</body>` on any site you want to monitor:

```html
<script defer
  src="https://your-trackos-domain.com/track.js"
  data-site-key="YOUR_SITE_KEY"
></script>
```

Get your `site_key` from **Dashboard → My sites → Snippet**.

### Custom events

```javascript
// Fire anywhere after the script loads
window.trackos.event('click',       'cta-button',  { page: 'home' });
window.trackos.event('form_submit', 'contact',      { source: 'footer' });
window.trackos.event('custom',      'video_play',   { video_id: 'intro' });
```

### How track.js works

1. Dynamically loads `socket.io-client` from the TrackOS server (`/socket.io/socket.io.js`)
2. Connects to `/track` namespace with `site_key` as query param
3. Emits `pageview` immediately on load
4. Sends `heartbeat` every 30s (scroll depth, time on page, bounce flag)
5. Falls back to `navigator.sendBeacon` HTTP POST if WebSocket unavailable
6. Fires `beforeunload` + `visibilitychange` for accurate session end detection
7. Filters bots by User-Agent regex **before** connecting — zero data for crawlers

---

## 📊 Dashboard pages

| Route | Page | Description |
|---|---|---|
| `/` | Overview | Global KPIs, live visitor feed, per-site performance table |
| `/global` | Global stats | Cross-site charts: timeline, devices, countries, hourly heatmap, top pages |
| `/sites` | My sites | CRUD management, site_key display, HTML snippet generator |
| `/realtime` | Real-time | Live visitor stream, active users by country |
| `/analytics` | Analytics | Per-site deep dive: traffic timeline, top pages, geo, browsers |
| `/visitors` | Visitors | Searchable recent visits table with device + location details |
| `/login` | Login | Delegates authentication to Symfony via JWT |

---

## 🌍 Production deployment

### Server `.env`

```env
PORT=4000
NODE_ENV=production

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=trackos_user
DB_PASSWORD=your_strong_password
DB_NAME=tracker_os

DASHBOARD_ORIGIN=https://dash.yourdomain.com
ALLOWED_TRACK_ORIGINS=https://yoursite.com,https://*.yourdomain.com

JWT_SECRET=your_symfony_jwt_secret
```

CORS supports wildcards and regex:
```env
# Wildcard subdomain
ALLOWED_TRACK_ORIGINS=https://*.yourdomain.com

# Regex pattern
ALLOWED_TRACK_ORIGINS=/https?:\/\/.*\.yourdomain\.com/
```

### Dashboard build

```bash
# dashboard/.env (production values)
VITE_API_URL=https://trackos.yourdomain.com/api
VITE_SOCKET_URL=https://trackos.yourdomain.com
VITE_SYMFONY_LOGIN_URL=https://your-symfony-app.com/login_verify

npm run build
# → dist/ ready to serve via Apache
```

### PM2

```bash
cd /var/www/trackos/server

# Start (always from server/ directory, not src/)
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup    # enable auto-restart on server reboot

# Useful commands
pm2 logs trackos
pm2 status
pm2 restart trackos
```

> ⚠️ Always run `pm2 start` from `/var/www/trackos/server/`, never from `src/`.
> dotenv reads `.env` relative to the current working directory.

### Apache

```bash
# Enable required modules
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite headers ssl

# Deploy config
sudo cp apache/trackos.conf /etc/apache2/sites-available/
sudo a2ensite trackos.conf

# SSL
sudo certbot --apache -d trackos.yourdomain.com -d dash.yourdomain.com

# Reload
sudo apache2ctl configtest && sudo systemctl reload apache2
```

---

## 🗄 Database schema

```
sites             registered websites (name, domain, site_key, owner_id)
visits            individual pageviews — geo, device, duration, scroll, bounce
events            custom events (click, form_submit, custom) with JSON payload
page_stats_daily  aggregated daily stats per page (for fast dashboard queries)
```

Full schema → [`server/schema.sql`](server/schema.sql)

---

## 🔌 API reference

All endpoints except `/api/track/*` require `Authorization: Bearer <jwt_token>`.
All analytics endpoints accept `?from=YYYY-MM-DD&to=YYYY-MM-DD`.

### Tracking (public)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/track/pageview` | Record a pageview |
| `POST` | `/api/track/heartbeat` | Update session duration + scroll |
| `POST` | `/api/track/event` | Record a custom event |

### Sites

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/sites` | List all owned sites |
| `POST` | `/api/sites` | Create a site |
| `PUT` | `/api/sites/:id` | Update a site |
| `DELETE` | `/api/sites/:id` | Delete a site + all data |
| `POST` | `/api/sites/:id/regenerate-key` | Rotate site_key |

### Per-site analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics/dashboard` | KPIs for all sites |
| `GET` | `/api/analytics/:id/timeline` | Traffic over time |
| `GET` | `/api/analytics/:id/top-pages` | Most visited pages |
| `GET` | `/api/analytics/:id/countries` | Geographic breakdown |
| `GET` | `/api/analytics/:id/devices` | Browser / OS / device type |
| `GET` | `/api/analytics/:id/recent-visits` | Latest visits (up to 100) |
| `GET` | `/api/analytics/:id/active` | Currently active visitors |

### Global analytics (all sites)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/global/stats` | Cross-site KPIs |
| `GET` | `/api/global/timeline` | Aggregated traffic timeline |
| `GET` | `/api/global/countries` | Global geo breakdown |
| `GET` | `/api/global/devices` | Global browser/OS/device stats + hourly/weekday distribution |
| `GET` | `/api/global/top-pages` | Top pages across all sites |
| `GET` | `/api/global/per-site` | Daily visits split by site |

### Socket.IO events

**Namespace `/track`** (client → server):
| Event | Payload | Description |
|---|---|---|
| `pageview` | `{ site_key, session_id, page_url, ... }` | New page visit |
| `heartbeat` | `{ session_id, duration, scroll_depth, is_bounce }` | Periodic update |
| `event` | `{ site_key, event_type, event_name, event_data }` | Custom event |

**Namespace `/dashboard`** (server → client):
| Event | Payload | Description |
|---|---|---|
| `visitor:new` | `{ site_id, geo, device, page_url, ... }` | New visitor arrived |
| `visitor:left` | `{ site_id, session_id }` | Visitor inactive > 5 min |
| `active:count` | `{ site_id, count }` | Updated active visitor count |
| `active:snapshot` | `{ site_id, visitors[] }` | Full active visitors list on subscribe |

---

## 📦 Collected data

| Field | Source | Notes |
|---|---|---|
| Page URL + title | JavaScript | `location.href` + `document.title` |
| Session duration | Heartbeat every 30s | Updated on heartbeat + page close |
| Scroll depth | Scroll event | Max % reached during the visit |
| Bounce | Computed | `true` if only one page in session |
| Country / City / Region | GeoIP (server-side) | Based on client IP |
| Browser / OS / Device | User-Agent parser | ua-parser-js |
| Screen resolution | JavaScript | `screen.width` × `screen.height` |
| UTM parameters | Query string | `utm_source`, `utm_medium`, `utm_campaign` |
| Referrer | `document.referrer` | Empty if direct traffic |

---

## 🔐 Security

- **JWT validation** — local HMAC-SHA256 check, same secret as Symfony — no external API call
- **site_key** — 48 hex chars (crypto-random), rotatable at any time from the dashboard
- **CORS** — in production, only explicitly listed origins are accepted; no wildcard `*`
- **Bot filtering** — regex on User-Agent client-side before any socket connection
- **IP storage** — stored raw for geo purposes; never exposed through the dashboard API
- **JWT_SECRET** — never commit to git (listed in `.gitignore`)

---

## 🛠 Useful commands

```bash
# PM2 logs
pm2 logs trackos

# Quick MySQL stats
mysql -u trackos_user -p tracker_os -e "
  SELECT s.name, COUNT(v.id) AS total_visits, COUNT(DISTINCT v.visitor_id) AS unique_visitors
  FROM sites s LEFT JOIN visits v ON v.site_id = s.id
  GROUP BY s.id ORDER BY total_visits DESC;
"

# Test the server health
curl https://trackos.yourdomain.com/health

# Check Node is listening
ss -tlnp | grep 4000
```

---
![screencapture-trackos-amarsyll-pro-realtime-2026-03-19-01_20_28](https://github.com/user-attachments/assets/371e560e-b05f-4950-b224-8602530f48ab)

---

<div align="center">

Built by [Amar Syll](https://amarsyll.pro) &nbsp;·&nbsp; [Live demo](https://trackos.amarsyll.pro)

</div>
