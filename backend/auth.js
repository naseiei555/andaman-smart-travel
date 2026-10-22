const crypto = require('node:crypto');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function verifyToken(token, secret, now = Math.floor(Date.now() / 1000)) {
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('Authentication is not configured');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  let header;
  let payload;
  try {
    header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (header.alg !== 'HS256' || typeof payload.sub !== 'string' || !UUID_PATTERN.test(payload.sub)) {
    return null;
  }

  const expected = crypto.createHmac('sha256', secret).update(`${parts[0]}.${parts[1]}`).digest();
  let actual;
  try {
    actual = Buffer.from(parts[2], 'base64url');
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    return null;
  }

  if (!Number.isInteger(payload.exp) || payload.exp <= now) {
    return null;
  }
  if (payload.nbf !== undefined && (!Number.isInteger(payload.nbf) || payload.nbf > now)) {
    return null;
  }
  if (process.env.AUTH_JWT_ISSUER && payload.iss !== process.env.AUTH_JWT_ISSUER) {
    return null;
  }
  if (process.env.AUTH_JWT_AUDIENCE) {
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audiences.includes(process.env.AUTH_JWT_AUDIENCE)) {
      return null;
    }
  }
  return { id: payload.sub, role: payload.role };
}

function requireUser(secret) {
  return (req, res, next) => {
    if (!secret || Buffer.byteLength(secret) < 32) {
      return res.status(503).json({ message: 'Authentication is not configured' });
    }
    const authorization = req.get('authorization') || '';
    const bearer = /^Bearer ([^\s]+)$/.exec(authorization)?.[1];
    const session = /(?:^|;\s*)andaman_session=([^;]+)/.exec(req.get('cookie') || '')?.[1];
    const user = verifyToken(bearer || session || '', secret);
    if (!user) {
      return res.status(401).json({ message: 'A valid access token is required' });
    }
    req.user = user;
    return next();
  };
}

function requireAdmin(secret) {
  const authenticate = requireUser(secret);
  return (req, res, next) =>
    authenticate(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Administrator role is required' });
      }
      return next();
    });
}

module.exports = { requireAdmin, requireUser, verifyToken };
