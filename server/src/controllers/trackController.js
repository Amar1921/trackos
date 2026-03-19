const visitService = require('../services/visitService');

/**
 * POST /api/track/pageview
 * Point d'entrée HTTP pour les navigateurs sans WebSocket
 */
async function pageview(req, res) {
  try {
    const result = await visitService.trackVisit(req, req.body);
    res.status(200).json({ ok: true, visit_id: result.visit_id });
  } catch (err) {
    console.error('[track:pageview]', err.message);
    res.status(400).json({ error: err.message });
  }
}

/**
 * POST /api/track/heartbeat
 */
async function heartbeat(req, res) {
  try {
    const { session_id, page_url, duration, scroll_depth, is_bounce } = req.body;
    await visitService.updateVisit(session_id, page_url, {
      duration_seconds: duration,
      scroll_depth_pct: scroll_depth,
      is_bounce,
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * POST /api/track/event
 */
async function event(req, res) {
  try {
    await visitService.trackEvent(req.body);
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { pageview, heartbeat, event };
