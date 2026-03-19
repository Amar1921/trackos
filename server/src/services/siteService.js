const db = require('../utils/db');
const crypto = require('crypto');

class SiteService {
  generateSiteKey() {
    return crypto.randomBytes(24).toString('hex'); // 48 chars hex
  }

  async create({ name, domain, owner_id }) {
    const site_key = this.generateSiteKey();
    const [result] = await db.query(
      'INSERT INTO sites (name, domain, site_key, owner_id) VALUES (?, ?, ?, ?)',
      [name, domain.replace(/^https?:\/\//, '').replace(/\/$/, ''), site_key, owner_id]
    );
    return { id: result.insertId, name, domain, site_key };
  }

  async findAll(owner_id) {
    const [rows] = await db.query(
      'SELECT * FROM sites WHERE owner_id = ? ORDER BY created_at DESC',
      [owner_id]
    );
    return rows;
  }

  async findById(id, owner_id) {
    const [rows] = await db.query(
      'SELECT * FROM sites WHERE id = ? AND owner_id = ? LIMIT 1',
      [id, owner_id]
    );
    return rows[0] || null;
  }

  async update(id, owner_id, { name, domain, is_active }) {
    await db.query(
      'UPDATE sites SET name = ?, domain = ?, is_active = ? WHERE id = ? AND owner_id = ?',
      [name, domain, is_active, id, owner_id]
    );
  }

  async delete(id, owner_id) {
    await db.query('DELETE FROM sites WHERE id = ? AND owner_id = ?', [id, owner_id]);
  }

  async regenerateKey(id, owner_id) {
    const site_key = this.generateSiteKey();
    await db.query('UPDATE sites SET site_key = ? WHERE id = ? AND owner_id = ?', [site_key, id, owner_id]);
    return site_key;
  }
}

module.exports = new SiteService();
