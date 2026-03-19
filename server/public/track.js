/**
 * TrackOS - Client Tracking Script v1.1
 * Usage: <script defer src="http://localhost:4000/track.js" data-site-key="VOTRE_KEY"></script>
 */
(function () {
  'use strict';

  const script = document.currentScript || document.querySelector('script[data-site-key]');
  const SITE_KEY = script?.getAttribute('data-site-key');
  const SERVER   = script?.getAttribute('data-server') || script?.src?.replace('/track.js', '') || 'http://localhost:4000';

  if (!SITE_KEY) { console.warn('[TrackOS] data-site-key manquant'); return; }

  // ─── Ignorer les bots ────────────────────────────────────────────────────
  if (/bot|crawl|spider|slurp|facebookexternalhit/i.test(navigator.userAgent)) return;

  // ─── Helpers ─────────────────────────────────────────────────────────────
  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));
  }

  function getOrCreate(key, factory) {
    try {
      let v = localStorage.getItem(key);
      if (!v) { v = factory(); localStorage.setItem(key, v); }
      return v;
    } catch { return factory(); }
  }

  function getUTM() {
    const p = new URLSearchParams(location.search);
    return {
      utm_source:   p.get('utm_source'),
      utm_medium:   p.get('utm_medium'),
      utm_campaign: p.get('utm_campaign'),
    };
  }

  function getScrollDepth() {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    if (docH <= 0) return 100;
    return Math.min(100, Math.round((window.scrollY / docH) * 100));
  }

  // ─── State ───────────────────────────────────────────────────────────────
  const VISITOR_ID = getOrCreate('_trkos_vid', uuid);
  const SESSION_ID = uuid();
  let pageStart    = Date.now();
  let maxScroll    = 0;
  let sentBounce   = false;
  let socket       = null;
  let useSocket    = false;

  const payload = {
    site_key:     SITE_KEY,
    session_id:   SESSION_ID,
    visitor_id:   VISITOR_ID,
    page_url:     location.href,
    page_title:   document.title,
    referrer:     document.referrer || null,
    ua:           navigator.userAgent,
    screen_width:  screen.width,
    screen_height: screen.height,
    ...getUTM(),
  };

  // ─── Scroll ───────────────────────────────────────────────────────────────
  window.addEventListener('scroll', () => {
    const d = getScrollDepth();
    if (d > maxScroll) maxScroll = d;
  }, { passive: true });

  // ─── HTTP Fallback (sendBeacon) ───────────────────────────────────────────
  function httpPost(path, data) {
    const url  = `${SERVER}/api${path}`;
    const body = JSON.stringify(data);
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true })
          .catch(() => {});
    }
  }

  function sendPageviewHTTP() {
    httpPost('/track/pageview', payload);
  }

  function sendHeartbeat() {
    const hb = {
      session_id:    SESSION_ID,
      page_url:      location.href,
      duration:      Math.round((Date.now() - pageStart) / 1000),
      scroll_depth:  maxScroll,
      is_bounce:     !sentBounce,
    };
    sentBounce = true;
    if (useSocket && socket?.connected) {
      socket.emit('heartbeat', hb);
    } else {
      httpPost('/track/heartbeat', hb);
    }
  }

  // ─── Socket.IO (chargement dynamique) ────────────────────────────────────
  function loadSocketIO(cb) {
    if (window.io) { cb(); return; }
    const s  = document.createElement('script');
    s.src    = `${SERVER}/socket.io/socket.io.js`;
    s.async  = true;
    s.onload = cb;
    s.onerror = () => { sendPageviewHTTP(); }; // fallback si socket.io non dispo
    document.head.appendChild(s);
  }

  function connectSocket() {
    try {
      socket = window.io(`${SERVER}/track`, {
        query:               { site_key: SITE_KEY },
        transports:          ['websocket', 'polling'],
        reconnectionAttempts: 2,
        timeout:             5000,
      });

      socket.on('connect', () => {
        useSocket = true;
        socket.emit('pageview', payload);
      });

      socket.on('connect_error', () => {
        if (!useSocket) sendPageviewHTTP(); // fallback une seule fois
      });
    } catch (e) {
      sendPageviewHTTP();
    }
  }

  // ─── API publique custom events ───────────────────────────────────────────
  window.trackos = {
    event(type, name, data) {
      const ev = { site_key: SITE_KEY, session_id: SESSION_ID, event_type: type, event_name: name, event_data: data };
      if (useSocket && socket?.connected) socket.emit('event', ev);
      else httpPost('/track/event', ev);
    },
  };

  // ─── Heartbeat toutes les 30s ─────────────────────────────────────────────
  setInterval(sendHeartbeat, 30_000);

  // ─── Envoyer avant fermeture ──────────────────────────────────────────────
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sendHeartbeat();
  });
  window.addEventListener('beforeunload', sendHeartbeat);

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    loadSocketIO(connectSocket);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();