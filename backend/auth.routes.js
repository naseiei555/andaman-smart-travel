const crypto = require('node:crypto');
const { promisify } = require('node:util');
const express = require('express');

const scrypt = promisify(crypto.scrypt);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DUMMY_SALT = crypto.randomBytes(16);
const DUMMY_PASSWORD_HASH = `scrypt$${DUMMY_SALT.toString('base64url')}$${crypto.scryptSync(crypto.randomBytes(32), DUMMY_SALT, 64).toString('base64url')}`;
const COOKIE_NAME = 'andaman_session';

function setSessionCookie(req, res, token) {
  const secure = req.secure ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/api; Max-Age=604800${secure}`);
}

function clearSessionCookie(req, res) {
  const secure = req.secure ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/api; Max-Age=0${secure}`);
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

async function verifyPassword(password, encoded) {
  const [algorithm, saltValue, hashValue] = String(encoded || '').split('$');
  if (algorithm !== 'scrypt' || !saltValue || !hashValue) return false;
  const salt = Buffer.from(saltValue, 'base64url');
  const expected = Buffer.from(hashValue, 'base64url');
  if (salt.length !== 16 || expected.length !== 64) return false;
  const actual = await scrypt(password, salt, expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

function createToken(user, secret) {
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('Authentication is not configured');
  }
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const claims = {
    sub: user.id,
    role: user.role,
    iat: now,
    exp: now + 60 * 60 * 24 * 7,
    ...(process.env.AUTH_JWT_ISSUER ? { iss: process.env.AUTH_JWT_ISSUER } : {}),
    ...(process.env.AUTH_JWT_AUDIENCE ? { aud: process.env.AUTH_JWT_AUDIENCE } : {}),
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function createAuthRouter({ pool, jwtSecret }) {
  const router = express.Router();
  const attempts = new Map();
  const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
  const limitAttempts = (req, res, next) => {
    const now = Date.now();
    for (const [key, entry] of attempts) if (entry.until <= now) attempts.delete(key);
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const entry = attempts.get(key);
    if (entry?.count >= 8 && entry.until > now) {
      res.setHeader('Retry-After', String(Math.ceil((entry.until - now) / 1000)));
      return res.status(429).json({ message: 'Too many sign-in attempts. Please try again later.' });
    }
    req.authAttemptKey = key;
    return next();
  };
  const recordAttempt = (key) => {
    const now = Date.now();
    const entry = attempts.get(key);
    if (!entry || entry.until <= now) attempts.set(key, { count: 1, until: now + 15 * 60 * 1000 });
    else entry.count += 1;
    if (attempts.size > 10000) attempts.clear();
  };

  router.post('/register', limitAttempts, asyncRoute(async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body?.password;
    if (!EMAIL_PATTERN.test(email) || email.length > 320) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    if (typeof password !== 'string' || password.length < 10 || password.length > 128) {
      return res.status(400).json({ message: 'Password must be 10 to 128 characters.' });
    }
    if (!jwtSecret || Buffer.byteLength(jwtSecret) < 32) {
      return res.status(503).json({ message: 'Sign-in is not configured on this server.' });
    }
    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const result = await pool.query(
      `INSERT INTO app_users (id, email, password_hash, role)
       VALUES ($1, $2, $3, 'user') RETURNING id, email, role`,
      [id, email, passwordHash],
    );
    const user = result.rows[0];
    recordAttempt(req.authAttemptKey);
    setSessionCookie(req, res, createToken(user, jwtSecret));
    return res.status(201).json({ user });
  }));

  router.post('/login', limitAttempts, asyncRoute(async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body?.password;
    if (!EMAIL_PATTERN.test(email) || email.length > 320 || typeof password !== 'string' || password.length > 128) {
      recordAttempt(req.authAttemptKey);
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }
    if (!jwtSecret || Buffer.byteLength(jwtSecret) < 32) {
      return res.status(503).json({ message: 'Sign-in is not configured on this server.' });
    }
    const result = await pool.query(
      'SELECT id, email, role, password_hash FROM app_users WHERE email = $1', [email],
    );
    const user = result.rows[0];
    const passwordIsValid = await verifyPassword(password, user?.password_hash || DUMMY_PASSWORD_HASH);
    if (!user || !passwordIsValid) {
      recordAttempt(req.authAttemptKey);
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }
    attempts.delete(req.authAttemptKey);
    setSessionCookie(req, res, createToken(user, jwtSecret));
    return res.json({ user: { id: user.id, email: user.email, role: user.role } });
  }));

  router.post('/logout', (req, res) => {
    clearSessionCookie(req, res);
    return res.status(204).end();
  });

  router.get('/me', require('./auth').requireUser(jwtSecret), asyncRoute(async (req, res) => {
    const result = await pool.query('SELECT id, email, role FROM app_users WHERE id = $1', [req.user.id]);
    if (!result.rows[0]) return res.status(401).json({ message: 'Account not found.' });
    return res.json({ user: result.rows[0] });
  }));

  return router;
}

module.exports = { createAuthRouter, hashPassword, verifyPassword };
