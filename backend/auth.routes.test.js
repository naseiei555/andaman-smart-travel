const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createAuthRouter } = require('./auth.routes');

const secret = 'test-secret-that-is-long-enough-for-authentication';

async function withServer(pool, run) {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', createAuthRouter({ pool, jwtSecret: secret }));
  const server = app.listen(0);
  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}/api/auth`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('registers a user with a password hash and an HttpOnly session cookie', async () => {
  let stored;
  const pool = { query: async (sql, values) => {
    if (sql.includes('INSERT INTO app_users')) {
      stored = values;
      return { rows: [{ id: values[0], email: values[1], role: 'user' }] };
    }
    if (sql.startsWith('SELECT id, email, role FROM app_users')) {
      return { rows: [{ id: values[0], email: stored[1], role: 'user' }] };
    }
    throw new Error('Unexpected query');
  } };
  await withServer(pool, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/register`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'TRAVELER@example.com', password: 'correct horse battery' }),
    });
    const data = await response.json();
    assert.equal(response.status, 201);
    assert.equal(data.user.email, 'traveler@example.com');
    assert.equal(data.user.role, 'user');
    assert.equal(data.token, undefined);
    const cookie = response.headers.get('set-cookie');
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
    assert.equal(stored[1], 'traveler@example.com');
    assert.match(stored[2], /^scrypt\$/);
    const me = await fetch(`${baseUrl}/me`, { headers: { cookie: cookie.split(';')[0] } });
    assert.equal(me.status, 200);
    assert.equal((await me.json()).user.email, 'traveler@example.com');
  });
});

test('signs in with valid credentials and rejects invalid passwords', async () => {
  const { hashPassword } = require('./auth.routes');
  const passwordHash = await hashPassword('correct horse battery');
  const pool = { query: async (_sql, [email]) => ({ rows: email === 'traveler@example.com'
    ? [{ id: 'a90ea2de-a12e-42ef-ae16-54a24cdd2e3b', email, role: 'user', password_hash: passwordHash }]
    : [] }) };
  await withServer(pool, async (baseUrl) => {
    const login = (password) => fetch(`${baseUrl}/login`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'traveler@example.com', password }),
    });
    const ok = await login('correct horse battery');
    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).token, undefined);
    assert.match(ok.headers.get('set-cookie'), /HttpOnly/);
    const rejected = await login('incorrect password');
    assert.equal(rejected.status, 401);
  });
});

test('rejects weak registration passwords', async () => {
  let queried = false;
  const pool = { query: async () => { queried = true; return { rows: [] }; } };
  await withServer(pool, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/register`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'traveler@example.com', password: 'short' }),
    });
    assert.equal(response.status, 400);
    assert.equal(queried, false);
  });
});

test('clears the HttpOnly session cookie on logout', async () => {
  await withServer({ query: async () => ({ rows: [] }) }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/logout`, { method: 'POST' });
    assert.equal(response.status, 204);
    assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
  });
});

test('limits repeated failed sign-in attempts', async () => {
  const pool = { query: async () => ({ rows: [] }) };
  await withServer(pool, async (baseUrl) => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const response = await fetch(`${baseUrl}/login`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'traveler@example.com', password: 'incorrect password' }),
      });
      assert.equal(response.status, 401);
    }
    const limited = await fetch(`${baseUrl}/login`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'traveler@example.com', password: 'incorrect password' }),
    });
    assert.equal(limited.status, 429);
    assert.ok(limited.headers.get('retry-after'));
  });
});
