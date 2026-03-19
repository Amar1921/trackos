const crypto = require('crypto');

/**
 * Valide les JWT émis par Symfony (HS256, clé symétrique)
 * Compatible avec firebase/php-jwt (même format)
 */
function verifySymfonyJWT(token) {
  if (!token) throw new Error('Token manquant');

  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Token malformé');

  const [headerB64, payloadB64, signatureB64] = parts;

  // Vérifier la signature
  const secret = process.env.JWT_SECRET;
  const data = `${headerB64}.${payloadB64}`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64url');

  if (expectedSig !== signatureB64) throw new Error('Signature invalide');

  // Décoder le payload
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

  // Vérifier expiration
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    throw new Error('Token expiré');
  }

  return payload;
}

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentification requise' });
    }
    const token = authHeader.slice(7);
    const payload = verifySymfonyJWT(token);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
}

function authSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Token socket manquant'));
    const payload = verifySymfonyJWT(token);
    socket.user = payload;
    next();
  } catch (err) {
    next(new Error(err.message));
  }
}

module.exports = { authMiddleware, authSocket, verifySymfonyJWT };
