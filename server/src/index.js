require('dotenv').config();
const express        = require('express');
const http           = require('http');
const cors           = require('cors');
const routes         = require('./routes');
const { initSocket } = require('./socket/hub');

const app    = express();
const server = http.createServer(app);

// ─── CORS ─────────────────────────────────────────────────────────────────
function parseOriginRule(rule) {
  rule = rule.trim();
  if (rule.startsWith('/') && rule.lastIndexOf('/') > 0) {
    const lastSlash = rule.lastIndexOf('/');
    return { type: 'regex', re: new RegExp(rule.slice(1, lastSlash), rule.slice(lastSlash + 1)) };
  }
  if (rule.includes('*')) {
    const escaped = rule.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return { type: 'regex', re: new RegExp(`^${escaped}$`) };
  }
  return { type: 'exact', value: rule };
}

const rawOrigins = [
  ...(process.env.DASHBOARD_ORIGIN?.split(',')      || []),
  ...(process.env.ALLOWED_TRACK_ORIGINS?.split(',') || []),
].map(o => o.trim()).filter(Boolean);

const originRules   = rawOrigins.map(parseOriginRule);
const DEV_LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function isOriginAllowed(origin) {
  if (!origin) return true;
  for (const rule of originRules) {
    if (rule.type === 'exact' && rule.value === origin) return true;
    if (rule.type === 'regex' && rule.re.test(origin))  return true;
  }
  if (process.env.NODE_ENV !== 'production' && DEV_LOCALHOST.test(origin)) return true;
  return false;
}

app.use(cors({
  origin: (origin, cb) => {
    if (isOriginAllowed(origin)) return cb(null, true);
    console.warn('[CORS] Bloqué:', origin);
    cb(new Error(`CORS bloqué: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// sendBeacon envoie parfois Content-Type: text/plain
app.use((req, res, next) => {
  if (req.headers['content-type']?.includes('text/plain')) {
    req.headers['content-type'] = 'application/json';
  }
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health ───────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ─── track.js ─────────────────────────────────────────────────────────────
app.get('/track.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(require('path').join(__dirname, '../public/track.js'));
});

// ─── API ──────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── Socket.IO ────────────────────────────────────────────────────────────
initSocket(server);

// ─── 404 / Errors ─────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route non trouvée' }));
app.use((err, req, res, next) => {
  console.error('[server]', err.message);
  res.status(500).json({ error: err.message });
});

// ─── Start ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n🚀 TrackOS Server — port ${PORT}`);
  console.log('   Origins configurées:', rawOrigins.join(', ') || 'aucune');
  if (process.env.NODE_ENV !== 'production') {
    console.log('   Dev mode: localhost/* accepté automatiquement');
  }
});