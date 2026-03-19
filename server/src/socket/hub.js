const { authSocket } = require('../middleware/auth');
const visitService = require('../services/visitService');

// Stockage en mémoire des visiteurs actifs par site
// Map<site_id, Map<session_id, visitorData>>
const activeVisitors = new Map();

let io;

function initSocket(server) {
  const { Server } = require('socket.io');

  io = new Server(server, {
    cors: {
      origin: process.env.DASHBOARD_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Namespace /track — reçoit les events des scripts clients (pas d'auth JWT)
  const trackNs = io.of('/track');
  trackNs.on('connection', (socket) => {
    const site_key = socket.handshake.query?.site_key;
    if (!site_key) { socket.disconnect(); return; }

    socket.site_key = site_key;

    // Le script client envoie "pageview"
    socket.on('pageview', async (data) => {
      try {
        // Simuler req pour compatibilité
        const fakeReq = {
          headers: {
            'user-agent': data.ua || socket.handshake.headers['user-agent'],
            'x-forwarded-for': socket.handshake.headers['x-forwarded-for'],
          },
          connection: { remoteAddress: socket.handshake.address },
          ip: socket.handshake.address,
        };

        const result = await visitService.trackVisit(fakeReq, {
          ...data,
          site_key: socket.site_key,
        });

        // Mettre à jour les actifs
        addActiveVisitor(result.site_id, data.session_id, {
          session_id: data.session_id,
          visitor_id: data.visitor_id,
          page_url: data.page_url,
          page_title: data.page_title,
          country: result.geo.country,
          country_code: result.geo.country_code,
          city: result.geo.city,
          browser: result.device.browser,
          os: result.device.os,
          device_type: result.device.device_type,
          visit_id: result.visit_id,
          last_seen: Date.now(),
        });

        // Broadcaster au dashboard
        broadcastToSite(result.site_id, 'visitor:new', {
          site_id: result.site_id,
          visit_id: result.visit_id,
          session_id: data.session_id,
          page_url: data.page_url,
          page_title: data.page_title,
          geo: result.geo,
          device: result.device,
          timestamp: new Date().toISOString(),
        });

        broadcastActiveCount(result.site_id);

      } catch (err) {
        console.error('[socket:pageview]', err.message);
      }
    });

    // Heartbeat du visiteur (durée, scroll)
    socket.on('heartbeat', async (data) => {
      try {
        await visitService.updateVisit(data.session_id, data.page_url, {
          duration_seconds: data.duration,
          scroll_depth_pct: data.scroll_depth,
          is_bounce: data.is_bounce,
        });

        updateActiveVisitorTime(socket.site_key, data.session_id);
      } catch (err) { /* silent */ }
    });

    // Event custom
    socket.on('event', async (data) => {
      try {
        await visitService.trackEvent({ ...data, site_key: socket.site_key });
      } catch (err) { /* silent */ }
    });

    socket.on('disconnect', () => {
      // Le visiteur sera purgé par le timer
    });
  });

  // Namespace /dashboard — dashboard admin (auth JWT)
  const dashNs = io.of('/dashboard');
  dashNs.use(authSocket);

  dashNs.on('connection', (socket) => {
    console.log(`[socket:dashboard] ${socket.user?.email || socket.id} connecté`);

    // Le dashboard s'abonne à un ou plusieurs sites
    socket.on('subscribe:site', (site_id) => {
      socket.join(`site:${site_id}`);
      // Envoyer snapshot des actifs
      const actifs = getActiveVisitors(site_id);
      socket.emit('active:snapshot', { site_id, visitors: actifs });
    });

    socket.on('unsubscribe:site', (site_id) => {
      socket.leave(`site:${site_id}`);
    });

    socket.on('disconnect', () => {
      console.log(`[socket:dashboard] ${socket.id} déconnecté`);
    });
  });

  // Purge des visiteurs inactifs toutes les 30s
  setInterval(purgeInactiveVisitors, 30_000);

  return io;
}

// ─── Helpers actifs ─────────────────────────────────────────────────────────

function addActiveVisitor(site_id, session_id, data) {
  if (!activeVisitors.has(site_id)) activeVisitors.set(site_id, new Map());
  activeVisitors.get(site_id).set(session_id, { ...data, last_seen: Date.now() });
}

function updateActiveVisitorTime(site_key, session_id) {
  for (const [site_id, map] of activeVisitors.entries()) {
    if (map.has(session_id)) {
      const v = map.get(session_id);
      v.last_seen = Date.now();
      map.set(session_id, v);
    }
  }
}

function getActiveVisitors(site_id) {
  if (!activeVisitors.has(site_id)) return [];
  return Array.from(activeVisitors.get(site_id).values());
}

function broadcastToSite(site_id, event, data) {
  if (!io) return;
  io.of('/dashboard').to(`site:${site_id}`).emit(event, data);
}

function broadcastActiveCount(site_id) {
  const count = activeVisitors.get(site_id)?.size || 0;
  broadcastToSite(site_id, 'active:count', { site_id, count });
}

function purgeInactiveVisitors() {
  const TIMEOUT = 5 * 60 * 1000; // 5 minutes
  const now = Date.now();
  for (const [site_id, map] of activeVisitors.entries()) {
    for (const [session_id, v] of map.entries()) {
      if (now - v.last_seen > TIMEOUT) {
        map.delete(session_id);
        broadcastToSite(site_id, 'visitor:left', { site_id, session_id });
      }
    }
    broadcastActiveCount(site_id);
  }
}

function broadcastNewVisit(site_id, data) {
  broadcastToSite(site_id, 'visitor:new', data);
}

module.exports = { initSocket, broadcastNewVisit, getActiveVisitors };
