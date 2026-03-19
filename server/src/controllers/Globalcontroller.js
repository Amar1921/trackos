const db = require('../utils/db');

/**
 * Stats globales toutes sites confondus — pour la page "Statistiques globales"
 */

async function globalStats(req, res) {
    try {
        const owner_id = req.user?.id || req.user?.sub;
        const { from, to } = req.query;
        const dateFrom = from || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const dateTo   = to   || new Date().toISOString().split('T')[0];

        // KPIs globaux
        const [[kpis]] = await db.query(`
      SELECT
        COUNT(v.id)                                          AS total_visits,
        COUNT(DISTINCT v.visitor_id)                        AS unique_visitors,
        COUNT(DISTINCT v.session_id)                        AS sessions,
        ROUND(AVG(v.duration_seconds), 0)                   AS avg_duration,
        ROUND(AVG(v.scroll_depth_pct), 1)                   AS avg_scroll,
        SUM(CASE WHEN v.is_bounce = 1 THEN 1 ELSE 0 END)   AS bounces,
        COUNT(DISTINCT s.id)                                AS sites_count
      FROM sites s
      LEFT JOIN visits v ON v.site_id = s.id
        AND DATE(v.visited_at) BETWEEN ? AND ?
      WHERE s.owner_id = ?
    `, [dateFrom, dateTo, owner_id]);

        res.json(kpis);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function globalTimeline(req, res) {
    try {
        const owner_id = req.user?.id || req.user?.sub;
        const { from, to, granularity = 'day' } = req.query;
        const dateFrom = from || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const dateTo   = to   || new Date().toISOString().split('T')[0];
        const fmt      = granularity === 'hour' ? '%Y-%m-%d %H:00' : '%Y-%m-%d';

        const [rows] = await db.query(`
      SELECT
        DATE_FORMAT(v.visited_at, ?) AS period,
        COUNT(v.id)                  AS visits,
        COUNT(DISTINCT v.visitor_id) AS unique_visitors,
        COUNT(DISTINCT v.session_id) AS sessions
      FROM visits v
      INNER JOIN sites s ON s.id = v.site_id AND s.owner_id = ?
      WHERE DATE(v.visited_at) BETWEEN ? AND ?
      GROUP BY period
      ORDER BY period ASC
    `, [fmt, owner_id, dateFrom, dateTo]);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function globalCountries(req, res) {
    try {
        const owner_id = req.user?.id || req.user?.sub;
        const { from, to } = req.query;
        const dateFrom = from || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const dateTo   = to   || new Date().toISOString().split('T')[0];

        const [rows] = await db.query(`
      SELECT
        v.country, v.country_code,
        COUNT(v.id)                  AS visits,
        COUNT(DISTINCT v.visitor_id) AS unique_visitors
      FROM visits v
      INNER JOIN sites s ON s.id = v.site_id AND s.owner_id = ?
      WHERE DATE(v.visited_at) BETWEEN ? AND ?
      GROUP BY v.country, v.country_code
      ORDER BY visits DESC
      LIMIT 20
    `, [owner_id, dateFrom, dateTo]);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function globalDevices(req, res) {
    try {
        const owner_id = req.user?.id || req.user?.sub;
        const { from, to } = req.query;
        const dateFrom = from || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const dateTo   = to   || new Date().toISOString().split('T')[0];

        const [browsers] = await db.query(`
      SELECT v.browser, COUNT(*) AS count
      FROM visits v INNER JOIN sites s ON s.id = v.site_id AND s.owner_id = ?
      WHERE DATE(v.visited_at) BETWEEN ? AND ?
      GROUP BY v.browser ORDER BY count DESC LIMIT 8
    `, [owner_id, dateFrom, dateTo]);

        const [devices] = await db.query(`
      SELECT v.device_type, COUNT(*) AS count
      FROM visits v INNER JOIN sites s ON s.id = v.site_id AND s.owner_id = ?
      WHERE DATE(v.visited_at) BETWEEN ? AND ?
      GROUP BY v.device_type ORDER BY count DESC
    `, [owner_id, dateFrom, dateTo]);

        const [oses] = await db.query(`
      SELECT v.os, COUNT(*) AS count
      FROM visits v INNER JOIN sites s ON s.id = v.site_id AND s.owner_id = ?
      WHERE DATE(v.visited_at) BETWEEN ? AND ?
      GROUP BY v.os ORDER BY count DESC LIMIT 8
    `, [owner_id, dateFrom, dateTo]);

        const [hourly] = await db.query(`
      SELECT HOUR(v.visited_at) AS hour, COUNT(*) AS visits
      FROM visits v INNER JOIN sites s ON s.id = v.site_id AND s.owner_id = ?
      WHERE DATE(v.visited_at) BETWEEN ? AND ?
      GROUP BY hour ORDER BY hour ASC
    `, [owner_id, dateFrom, dateTo]);

        const [weekday] = await db.query(`
      SELECT DAYOFWEEK(v.visited_at) AS dow, COUNT(*) AS visits
      FROM visits v INNER JOIN sites s ON s.id = v.site_id AND s.owner_id = ?
      WHERE DATE(v.visited_at) BETWEEN ? AND ?
      GROUP BY dow ORDER BY dow ASC
    `, [owner_id, dateFrom, dateTo]);

        res.json({ browsers, devices, oses, hourly, weekday });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function globalTopPages(req, res) {
    try {
        const owner_id = req.user?.id || req.user?.sub;
        const { from, to, limit = 10 } = req.query;
        const dateFrom = from || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const dateTo   = to   || new Date().toISOString().split('T')[0];

        const [rows] = await db.query(`
      SELECT
        s.name AS site_name, v.page_url, v.page_title,
        COUNT(v.id)                  AS views,
        COUNT(DISTINCT v.visitor_id) AS unique_visitors,
        ROUND(AVG(v.duration_seconds), 0) AS avg_duration
      FROM visits v
      INNER JOIN sites s ON s.id = v.site_id AND s.owner_id = ?
      WHERE DATE(v.visited_at) BETWEEN ? AND ?
      GROUP BY s.id, v.page_url, v.page_title
      ORDER BY views DESC
      LIMIT ?
    `, [owner_id, dateFrom, dateTo, parseInt(limit)]);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function globalPerSite(req, res) {
    try {
        const owner_id = req.user?.id || req.user?.sub;
        const { from, to } = req.query;
        const dateFrom = from || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const dateTo   = to   || new Date().toISOString().split('T')[0];

        const [rows] = await db.query(`
      SELECT
        DATE_FORMAT(v.visited_at, '%Y-%m-%d') AS period,
        s.name AS site_name,
        COUNT(v.id) AS visits
      FROM visits v
      INNER JOIN sites s ON s.id = v.site_id AND s.owner_id = ?
      WHERE DATE(v.visited_at) BETWEEN ? AND ?
      GROUP BY period, s.id
      ORDER BY period ASC
    `, [owner_id, dateFrom, dateTo]);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { globalStats, globalTimeline, globalCountries, globalDevices, globalTopPages, globalPerSite };