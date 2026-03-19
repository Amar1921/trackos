const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

/**
 * Extrait les infos géographiques depuis une IP
 */
function getGeoInfo(ip) {
  if (!ip || ip === '::1' || ip === '127.0.0.1') {
    return { country: 'Local', country_code: 'LC', city: 'Localhost', region: '', latitude: null, longitude: null };
  }
  // Extraire IPv4 si IPv6-mapped
  const cleanIp = ip.replace(/^::ffff:/, '');
  const geo = geoip.lookup(cleanIp);
  if (!geo) return { country: 'Inconnu', country_code: '??', city: '', region: '', latitude: null, longitude: null };

  return {
    country: geo.country ? getCountryName(geo.country) : 'Inconnu',
    country_code: geo.country || '??',
    city: geo.city || '',
    region: geo.region || '',
    latitude: geo.ll?.[0] ?? null,
    longitude: geo.ll?.[1] ?? null,
  };
}

/**
 * Parse le User-Agent et retourne les infos browser/OS/device
 */
function parseUA(uaString) {
  if (!uaString) return { browser: 'Inconnu', browser_version: '', os: 'Inconnu', os_version: '', device_type: 'unknown', device_brand: '' };

  const parser = new UAParser(uaString);
  const result = parser.getResult();

  let deviceType = 'desktop';
  const deviceKind = result.device?.type;
  if (deviceKind === 'mobile') deviceType = 'mobile';
  else if (deviceKind === 'tablet') deviceType = 'tablet';
  else if (deviceKind === 'bot' || /bot|crawl|spider/i.test(uaString)) deviceType = 'bot';

  return {
    browser: result.browser?.name || 'Inconnu',
    browser_version: result.browser?.version || '',
    os: result.os?.name || 'Inconnu',
    os_version: result.os?.version || '',
    device_type: deviceType,
    device_brand: result.device?.vendor || '',
  };
}

/**
 * Extrait l'IP réelle en tenant compte des proxies (Apache reverse proxy)
 */
function extractIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.ip
  );
}

// Mapping pays ISO → nom lisible (principaux)
const COUNTRY_NAMES = {
  SN: 'Sénégal', FR: 'France', US: 'États-Unis', GB: 'Royaume-Uni',
  DE: 'Allemagne', IT: 'Italie', ES: 'Espagne', BE: 'Belgique',
  CH: 'Suisse', CA: 'Canada', MA: 'Maroc', CI: "Côte d'Ivoire",
  CM: 'Cameroun', ML: 'Mali', BF: 'Burkina Faso', GN: 'Guinée',
  TG: 'Togo', BJ: 'Bénin', GH: 'Ghana', NG: 'Nigeria', DZ: 'Algérie',
  TN: 'Tunisie', EG: 'Égypte', ZA: 'Afrique du Sud', BR: 'Brésil',
  JP: 'Japon', CN: 'Chine', IN: 'Inde', AU: 'Australie', RU: 'Russie',
};

function getCountryName(code) {
  return COUNTRY_NAMES[code] || code;
}

module.exports = { getGeoInfo, parseUA, extractIP };
