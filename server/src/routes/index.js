const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');
const trackCtrl    = require('../controllers/trackController');
const analyticsCtrl = require('../controllers/analyticsController');
const sitesCtrl    = require('../controllers/sitesController');
const globalCtrl   = require('../controllers/globalController');

// ─── Tracking public ─────────────────────────────────────────────────────────
router.post('/track/pageview',  trackCtrl.pageview);
router.post('/track/heartbeat', trackCtrl.heartbeat);
router.post('/track/event',     trackCtrl.event);

// ─── API protégée JWT ─────────────────────────────────────────────────────────
router.use(authMiddleware);

// Sites CRUD
router.get('/sites',                      sitesCtrl.list);
router.post('/sites',                     sitesCtrl.create);
router.put('/sites/:id',                  sitesCtrl.update);
router.delete('/sites/:id',               sitesCtrl.remove);
router.post('/sites/:id/regenerate-key',  sitesCtrl.regenerateKey);

// Analytics globales (toutes sites)
router.get('/global/stats',       globalCtrl.globalStats);
router.get('/global/timeline',    globalCtrl.globalTimeline);
router.get('/global/countries',   globalCtrl.globalCountries);
router.get('/global/devices',     globalCtrl.globalDevices);
router.get('/global/top-pages',   globalCtrl.globalTopPages);
router.get('/global/per-site',    globalCtrl.globalPerSite);

// Analytics par site
router.get('/analytics/dashboard',              analyticsCtrl.dashboard);
router.get('/analytics/:site_id/timeline',      analyticsCtrl.timeline);
router.get('/analytics/:site_id/top-pages',     analyticsCtrl.topPages);
router.get('/analytics/:site_id/countries',     analyticsCtrl.countries);
router.get('/analytics/:site_id/devices',       analyticsCtrl.devices);
router.get('/analytics/:site_id/recent-visits', analyticsCtrl.recentVisits);
router.get('/analytics/:site_id/active',        analyticsCtrl.activeVisitors);

module.exports = router;