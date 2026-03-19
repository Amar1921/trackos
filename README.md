# TrackOS — Surveillance de visites en temps réel

> Plateforme complète de web analytics auto-hébergée.  
> Stack : Node.js + Express + Socket.IO · MySQL · React + Redux Toolkit + MUI Light · Vite

---

## Architecture

```
trackos/
├── server/              ← API REST + WebSocket (Node.js)
│   ├── src/
│   │   ├── index.js         — Point d'entrée (Express + Socket.IO)
│   │   ├── socket/hub.js    — Hub temps réel (/track + /dashboard)
│   │   ├── middleware/auth.js   — Validation JWT Symfony (HS256)
│   │   ├── services/
│   │   │   ├── visitService.js  — Tracking + stats MySQL
│   │   │   └── siteService.js   — CRUD sites
│   │   ├── controllers/     — trackController, analyticsController, sitesController
│   │   ├── routes/index.js  — Routes API
│   │   └── utils/
│   │       ├── db.js            — Pool MySQL2
│   │       └── geoua.js         — GeoIP + UA Parser
│   ├── public/track.js  ← Script client embarquable (< 4kb)
│   ├── schema.sql       ← Schéma BDD complet
│   └── ecosystem.config.cjs ← Config PM2
│
├── dashboard/           ← React SPA (MUI Light)
│   ├── src/
│   │   ├── App.jsx          — Root + Router + Provider
│   │   ├── theme/           — Thème MUI Google Material Light
│   │   ├── app/store.js     — Redux store
│   │   ├── features/
│   │   │   ├── sites/       — CRUD sites (Redux slice)
│   │   │   ├── analytics/   — Stats (Redux slice)
│   │   │   └── realtime/    — Socket temps réel (Redux slice)
│   │   ├── hooks/useSocket.js — Init socket + subscriptions
│   │   ├── services/
│   │   │   ├── api.js       — Axios + JWT interceptor
│   │   │   └── socket.js    — Singleton Socket.IO /dashboard
│   │   └── components/
│   │       ├── layout/      — Sidebar, TopBar
│   │       ├── pages/       — Overview, Sites, Realtime, Analytics, Visitors
│   │       └── widgets/     — StatCard, LiveFeed, ActiveVisitors
│   └── index.html
│
└── apache/trackos.conf  ← VirtualHost Apache (SSL + WS proxy)
```

---

## Installation

### 1. Base de données MySQL

```bash
mysql -u root -p
CREATE USER 'trackos_user'@'localhost' IDENTIFIED BY 'mot_de_passe';
GRANT ALL PRIVILEGES ON trackos_db.* TO 'trackos_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

mysql -u root -p < trackos/server/schema.sql
```

### 2. Serveur Node.js

```bash
cd trackos/server
cp .env.example .env
# Éditer .env avec vos vraies valeurs

npm install
npm start           # développement
# OU
pm2 start ecosystem.config.cjs   # production
pm2 save && pm2 startup
```

**Variables `.env` serveur :**
| Variable | Description |
|---|---|
| `PORT` | Port Node.js (défaut: 4000) |
| `DB_HOST / DB_USER / DB_PASSWORD / DB_NAME` | MySQL |
| `JWT_SECRET` | **Même clé** que Symfony (`lexik_jwt_authentication.secret_key` ou `APP_SECRET`) |
| `DASHBOARD_ORIGIN` | URL du dashboard React |
| `ALLOWED_TRACK_ORIGINS` | URLs des sites à tracker (séparées par virgule) |

### 3. Dashboard React

```bash
cd trackos/dashboard
cp .env.example .env
# Éditer .env

npm install
npm run build     # → génère dist/

# Déployer dist/ sur le serveur
rsync -avz dist/ user@serveur:/var/www/trackos-dashboard/dist/
```

**Variables `.env` dashboard :**
| Variable | Description |
|---|---|
| `VITE_API_URL` | URL API Node.js (`https://trackos.amarsyll.pro/api`) |
| `VITE_SOCKET_URL` | URL Socket.IO (`https://trackos.amarsyll.pro`) |
| `VITE_SYMFONY_LOGIN_URL` | URL login Symfony (redirection si JWT expiré) |

### 4. Apache

```bash
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite headers ssl

# Copier la config
sudo cp trackos/apache/trackos.conf /etc/apache2/sites-available/
sudo a2ensite trackos.conf

# SSL avec Certbot
sudo certbot --apache -d trackos.amarsyll.pro -d dash.trackos.amarsyll.pro

sudo apache2ctl configtest && sudo systemctl reload apache2
```

---

## Intégration Symfony (Auth)

Le dashboard lit le JWT dans `localStorage.jwt_token`.  
Côté Symfony, après login réussi, stockez le token :

```javascript
// Après connexion Symfony (Twig + JS ou API)
localStorage.setItem('jwt_token', response.token);
window.location.href = 'https://dash.trackos.amarsyll.pro';
```

Le middleware Node.js (`src/middleware/auth.js`) valide le JWT avec la **même clé secrète** que Symfony (HS256).  
Le payload JWT doit contenir `id` (ou `userId` ou `sub`) pour identifier l'utilisateur propriétaire des sites.

---

## Intégration sur vos sites

### Script de base

```html
<!-- Avant </body> -->
<script defer
  src="https://trackos.amarsyll.pro/track.js"
  data-site-key="VOTRE_SITE_KEY"
></script>
```

La `site_key` s'obtient dans **Dashboard → Mes sites → Snippet**.

### Events custom

```javascript
// Après chargement du script
window.trackos.event('click', 'bouton-cta', { page: 'accueil' });
window.trackos.event('form_submit', 'contact', { source: 'footer' });
window.trackos.event('custom', 'video_play', { video_id: 'intro' });
```

---

## Données collectées

| Donnée | Source |
|---|---|
| URL + titre de la page | JavaScript |
| Durée sur la page | Heartbeat toutes les 30s |
| Profondeur de scroll | Événement scroll |
| Rebond (1 seule page) | Calculé à la fermeture |
| Pays / Ville / Région | GeoIP (IP serveur) |
| Navigateur / OS / Appareil | User-Agent parser |
| UTM (source, medium, campaign) | Query string |
| Référent | `document.referrer` |

---

## Pages du dashboard

| Page | Route | Description |
|---|---|---|
| **Vue d'ensemble** | `/` | KPI globaux, flux live, table par site |
| **Mes sites** | `/sites` | CRUD sites, snippet HTML, régénération clé |
| **Temps réel** | `/realtime` | Flux Socket.IO, visiteurs actifs par pays |
| **Analytics** | `/analytics` | Timeline, top pages, pays, browsers, OS |
| **Visiteurs** | `/visitors` | Table des visites récentes avec recherche |

---

## Sécurité

- **JWT** : validation locale (HMAC-SHA256), même secret que Symfony — pas d'appel API externe
- **site_key** : 48 caractères hex aléatoires, régénérable à tout moment
- **CORS** : seuls les origines listées dans `ALLOWED_TRACK_ORIGINS` sont acceptées
- **Bots** : filtrés côté `track.js` (regex User-Agent) avant envoi
- **IP** : stockée brute en BDD, pas exposée dans l'API dashboard

---

## Scripts utiles

```bash
# Voir les logs PM2
pm2 logs trackos-server

# Purger les tokens bloqués (si vous utilisez la blacklist JWT)
# (côté Symfony — déjà implémenté dans votre app)

# Stats rapides MySQL
mysql -u trackos_user -p trackos_db -e "
  SELECT s.name, COUNT(v.id) AS visites_total, COUNT(DISTINCT v.visitor_id) AS uniques
  FROM sites s LEFT JOIN visits v ON v.site_id = s.id
  GROUP BY s.id ORDER BY visites_total DESC;
"
```
