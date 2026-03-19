const visitService = require('../services/visitService');
const siteService = require('../services/siteService');
const { getActiveVisitors } = require('../socket/hub');

function getOwnerId(req) {
  // Le payload JWT Symfony contient l'id utilisateur
  return req.user?.id || req.user?.userId || req.user?.sub;
}

async function dashboard(req, res) {
  try {
    const { from, to } = req.query;
    const owner_id = getOwnerId(req);
    const stats = await visitService.getSitesStats(owner_id, { from, to });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function timeline(req, res) {
  try {
    const { site_id } = req.params;
    const { from, to, granularity } = req.query;
    const data = await visitService.getVisitsTimeline(site_id, { from, to, granularity });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function topPages(req, res) {
  try {
    const { site_id } = req.params;
    const { from, to, limit } = req.query;
    const data = await visitService.getTopPages(site_id, { from, to, limit: parseInt(limit) || 10 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function countries(req, res) {
  try {
    const { site_id } = req.params;
    const { from, to } = req.query;
    const data = await visitService.getCountryStats(site_id, { from, to });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function devices(req, res) {
  try {
    const { site_id } = req.params;
    const { from, to } = req.query;
    const data = await visitService.getDeviceStats(site_id, { from, to });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function recentVisits(req, res) {
  try {
    const { site_id } = req.params;
    const { limit } = req.query;
    const data = await visitService.getRecentVisits(site_id, parseInt(limit) || 50);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function activeVisitors(req, res) {
  try {
    const { site_id } = req.params;
    const visitors = getActiveVisitors(parseInt(site_id));
    res.json({ count: visitors.length, visitors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { dashboard, timeline, topPages, countries, devices, recentVisits, activeVisitors };
