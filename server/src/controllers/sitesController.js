const siteService = require('../services/siteService');

function getOwnerId(req) {
  return req.user?.id || req.user?.userId || req.user?.sub;
}

async function list(req, res) {
  try {
    const sites = await siteService.findAll(getOwnerId(req));
    res.json(sites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    const { name, domain } = req.body;
    if (!name || !domain) return res.status(400).json({ error: 'name et domain requis' });
    const site = await siteService.create({ name, domain, owner_id: getOwnerId(req) });
    res.status(201).json(site);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Domaine déjà enregistré' });
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    await siteService.update(id, getOwnerId(req), req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    await siteService.delete(req.params.id, getOwnerId(req));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function regenerateKey(req, res) {
  try {
    const key = await siteService.regenerateKey(req.params.id, getOwnerId(req));
    res.json({ site_key: key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { list, create, update, remove, regenerateKey };
