const db = require('../utils/db');
const { getGeoInfo, parseUA, extractIP } = require('../utils/geoua');

class VisitService {
  /**
   * Enregistre ou met à jour une visite
   */
  async trackVisit(req, payload) {
    const ip = extractIP(req);
    const ua = req.headers['user-agent'] || '';
    const geo = getGeoInfo(ip);
    const device = parseUA(ua);

    const {
      site_key, session_id, visitor_id,
      page_url, page_title, referrer,
      screen_width, screen_height,
      utm_source, utm_medium, utm_campaign,
    } = payload;

    // Récupérer le site_id via site_key
    const [sites] = await db.query(
      'SELECT id FROM sites WHERE site_key = ? AND is_active = 1 LIMIT 1',
      [site_key]
    );
    if (!sites.length) throw new Error(`Site key inconnu: ${site_key}`);
    const site_id = sites[0].id;

    // Vérifier si une visite existe déjà pour cette session+page
    const [existing] = await db.query(
      'SELECT id FROM visits WHERE session_id = ? AND page_url = ? LIMIT 1',
      [session_id, page_url]
    );

    if (existing.length) {
      // Mise à jour (durée, scroll, etc.) gérée par updateVisit
      return { visit_id: existing[0].id, site_id, geo, device, is_new: false };
    }

    const [result] = await db.query(
      `INSERT INTO visits
        (site_id, session_id, visitor_id, page_url, page_title, referrer,
         ip, country, country_code, city, region, latitude, longitude,
         browser, browser_version, os, os_version, device_type, device_brand,
         screen_width, screen_height,
         utm_source, utm_medium, utm_campaign)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        site_id, session_id, visitor_id || null, page_url, page_title || null, referrer || null,
        ip, geo.country, geo.country_code, geo.city, geo.region, geo.latitude, geo.longitude,
        device.browser, device.browser_version, device.os, device.os_version, device.device_type, device.device_brand,
        screen_width || null, screen_height || null,
        utm_source || null, utm_medium || null, utm_campaign || null,
      ]
    );

    return { visit_id: result.insertId, site_id, geo, device, is_new: true };
  }

  /**
   * Met à jour durée, scroll, bounce d'une visite
   */
  async updateVisit(session_id, page_url, { duration_seconds, scroll_depth_pct, is_bounce }) {
    await db.query(
      `UPDATE visits SET
        duration_seconds = ?,
        scroll_depth_pct = ?,
        is_bounce = ?
       WHERE session_id = ? AND page_url = ?`,
      [duration_seconds || 0, scroll_depth_pct || 0, is_bounce ? 1 : 0, session_id, page_url]
    );
  }

  /**
   * Enregistre un event custom
   */
  async trackEvent(payload) {
    const { site_key, visit_id, session_id, event_type, event_name, event_data } = payload;

    const [sites] = await db.query('SELECT id FROM sites WHERE site_key = ? LIMIT 1', [site_key]);
    if (!sites.length) return;

    await db.query(
      `INSERT INTO events (visit_id, site_id, session_id, event_type, event_name, event_data)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [visit_id || null, sites[0].id, session_id, event_type, event_name || null,
       event_data ? JSON.stringify(event_data) : null]
    );
  }

  // ─── Stats pour le dashboard ─────────────────────────────────────────────

  async getSitesStats(owner_id, { from, to } = {}) {
    const dateFrom = from || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const dateTo = to || new Date().toISOString().split('T')[0];

    const [rows] = await db.query(
      `SELECT
         s.id, s.name, s.domain, s.site_key, s.is_active,
         COUNT(v.id) AS total_visits,
         COUNT(DISTINCT v.visitor_id) AS unique_visitors,
         COUNT(DISTINCT v.session_id) AS sessions,
         ROUND(AVG(v.duration_seconds), 0) AS avg_duration,
         ROUND(AVG(v.scroll_depth_pct), 1) AS avg_scroll,
         SUM(CASE WHEN v.is_bounce = 1 THEN 1 ELSE 0 END) AS bounces
       FROM sites s
       LEFT JOIN visits v ON v.site_id = s.id
         AND DATE(v.visited_at) BETWEEN ? AND ?
       WHERE s.owner_id = ?
       GROUP BY s.id
       ORDER BY total_visits DESC`,
      [dateFrom, dateTo, owner_id]
    );
    return rows;
  }

  async getVisitsTimeline(site_id, { from, to, granularity = 'day' } = {}) {
    const dateFrom = from || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const dateTo = to || new Date().toISOString().split('T')[0];

    const format = granularity === 'hour' ? '%Y-%m-%d %H:00' : '%Y-%m-%d';
    const [rows] = await db.query(
      `SELECT
         DATE_FORMAT(visited_at, ?) AS period,
         COUNT(*) AS visits,
         COUNT(DISTINCT visitor_id) AS unique_visitors
       FROM visits
       WHERE site_id = ? AND DATE(visited_at) BETWEEN ? AND ?
       GROUP BY period
       ORDER BY period ASC`,
      [format, site_id, dateFrom, dateTo]
    );
    return rows;
  }

  async getTopPages(site_id, { from, to, limit = 10 } = {}) {
    const dateFrom = from || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const dateTo = to || new Date().toISOString().split('T')[0];

    const [rows] = await db.query(
      `SELECT
         page_url, page_title,
         COUNT(*) AS views,
         COUNT(DISTINCT visitor_id) AS unique_visitors,
         ROUND(AVG(duration_seconds), 0) AS avg_duration,
         ROUND(AVG(scroll_depth_pct), 1) AS avg_scroll
       FROM visits
       WHERE site_id = ? AND DATE(visited_at) BETWEEN ? AND ?
       GROUP BY page_url, page_title
       ORDER BY views DESC
       LIMIT ?`,
      [site_id, dateFrom, dateTo, limit]
    );
    return rows;
  }

  async getCountryStats(site_id, { from, to } = {}) {
    const dateFrom = from || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const dateTo = to || new Date().toISOString().split('T')[0];

    const [rows] = await db.query(
      `SELECT country, country_code, COUNT(*) AS visits, COUNT(DISTINCT visitor_id) AS unique_visitors
       FROM visits
       WHERE site_id = ? AND DATE(visited_at) BETWEEN ? AND ?
       GROUP BY country, country_code
       ORDER BY visits DESC
       LIMIT 20`,
      [site_id, dateFrom, dateTo]
    );
    return rows;
  }

  async getDeviceStats(site_id, { from, to } = {}) {
    const dateFrom = from || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const dateTo = to || new Date().toISOString().split('T')[0];

    const [browsers] = await db.query(
      `SELECT browser, COUNT(*) AS count FROM visits
       WHERE site_id = ? AND DATE(visited_at) BETWEEN ? AND ?
       GROUP BY browser ORDER BY count DESC LIMIT 8`,
      [site_id, dateFrom, dateTo]
    );
    const [devices] = await db.query(
      `SELECT device_type, COUNT(*) AS count FROM visits
       WHERE site_id = ? AND DATE(visited_at) BETWEEN ? AND ?
       GROUP BY device_type ORDER BY count DESC`,
      [site_id, dateFrom, dateTo]
    );
    const [oses] = await db.query(
      `SELECT os, COUNT(*) AS count FROM visits
       WHERE site_id = ? AND DATE(visited_at) BETWEEN ? AND ?
       GROUP BY os ORDER BY count DESC LIMIT 8`,
      [site_id, dateFrom, dateTo]
    );
    return { browsers, devices, oses };
  }

  async getRecentVisits(site_id, limit = 50) {
    const [rows] = await db.query(
      `SELECT id, session_id, visitor_id, page_url, page_title, referrer,
              country, country_code, city, browser, os, device_type,
              duration_seconds, scroll_depth_pct, is_bounce, visited_at
       FROM visits
       WHERE site_id = ?
       ORDER BY visited_at DESC
       LIMIT ?`,
      [site_id, limit]
    );
    return rows;
  }

  async getActiveVisitors(site_id) {
    // Visiteurs actifs = visite dans les 5 dernières minutes
    const [rows] = await db.query(
      `SELECT session_id, visitor_id, page_url, page_title, country, city, browser, device_type, visited_at
       FROM visits
       WHERE site_id = ? AND visited_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
       ORDER BY visited_at DESC`,
      [site_id]
    );
    return rows;
  }
}

module.exports = new VisitService();
