const express = require('express');
const { requireAdmin, requireUser } = require('./auth');

const PROVINCES = [
  'Krabi', 'Phang Nga', 'Phuket', 'Trang', 'Satun', 'Songkhla',
  'Surat Thani', 'Nakhon Si Thammarat', 'Phatthalung', 'Pattani',
  'Yala', 'Narathiwat', 'Chumphon', 'Ranong',
];
const CATEGORIES = ['culture', 'food', 'music', 'sports', 'tradition', 'tourism', 'other'];
const PUBLIC_COLUMNS = `id, title, slug, description, province, district, venue, category,
  start_date, end_date, start_time, end_time, latitude, longitude, estimated_cost,
  image_url, official_url, source_name, source_url, verification_status,
  last_verified_at, publication_status, created_at, updated_at,
  CASE
    WHEN publication_status = 'cancelled' THEN 'cancelled'
    WHEN start_date IS NULL THEN 'unscheduled'
    WHEN CURRENT_DATE < start_date THEN 'upcoming'
    WHEN CURRENT_DATE <= end_date THEN 'ongoing'
    ELSE 'completed'
  END AS event_status`;
const EVENT_FIELDS = new Set([
  'title', 'slug', 'description', 'province', 'district', 'venue', 'category',
  'start_date', 'end_date', 'start_time', 'end_time', 'latitude', 'longitude',
  'estimated_cost', 'image_url', 'official_url', 'source_name', 'source_url',
  'verification_status', 'publication_status',
]);
const router = express.Router();

function badRequest(res, message) {
  return res.status(400).json({ message });
}

function queryValue(value, name) {
  if (typeof value !== 'string') {
    throw new Error(`${name} must be a single value`);
  }
  return value.trim();
}

function optionalUrl(value, name) {
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 2048) {
    throw new Error(`${name} must be an HTTP or HTTPS URL`);
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be an HTTP or HTTPS URL`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`${name} must be an HTTP or HTTPS URL`);
  }
  return value;
}

function validateEvent(input, partial = false) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return 'Event body must be an object';
  }
  const keys = Object.keys(input);
  if (keys.some((key) => !EVENT_FIELDS.has(key))) return 'Event contains an unsupported field';
  const required = ['title', 'slug', 'province', 'category', 'publication_status'];
  if (!partial && required.some((key) => input[key] === undefined)) {
    return `Required fields: ${required.join(', ')}`;
  }
  if (input.title !== undefined && (typeof input.title !== 'string' || !input.title.trim() || input.title.length > 255)) {
    return 'title must contain 1 to 255 characters';
  }
  if (input.slug !== undefined && (typeof input.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug) || input.slug.length > 255)) {
    return 'slug must contain lowercase letters, numbers and hyphens';
  }
  if (input.province !== undefined && !PROVINCES.includes(input.province)) return 'province is not supported';
  if (input.category !== undefined && !CATEGORIES.includes(input.category)) return 'category is not supported';
  if (input.publication_status !== undefined && !['draft', 'published', 'cancelled'].includes(input.publication_status)) {
    return 'publication_status must be draft, published or cancelled';
  }
  if (input.verification_status !== undefined && !['verified', 'unverified'].includes(input.verification_status)) {
    return 'verification_status must be verified or unverified';
  }
  for (const field of ['start_date', 'end_date']) {
    if (input[field] !== undefined && input[field] !== null &&
        (typeof input[field] !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input[field]) ||
         Number.isNaN(Date.parse(`${input[field]}T00:00:00Z`)) ||
         new Date(`${input[field]}T00:00:00Z`).toISOString().slice(0, 10) !== input[field])) {
      return `${field} must be a valid YYYY-MM-DD date or null`;
    }
  }
  const start = input.start_date;
  const end = input.end_date;
  if ((start === null && end !== undefined && end !== null) ||
      (end === null && start !== undefined && start !== null) ||
      (start && end && end < start)) {
    return 'start_date and end_date must both be null or a valid ordered date range';
  }
  for (const field of ['start_time', 'end_time']) {
    if (input[field] !== undefined && input[field] !== null &&
        (typeof input[field] !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(input[field]))) {
      return `${field} must be a valid time or null`;
    }
  }
  for (const field of ['latitude', 'longitude', 'estimated_cost']) {
    if (input[field] !== undefined && input[field] !== null &&
        (typeof input[field] !== 'number' || !Number.isFinite(input[field]))) {
      return `${field} must be a finite number or null`;
    }
  }
  if (input.latitude != null && (input.latitude < -90 || input.latitude > 90)) return 'latitude is out of range';
  if (input.longitude != null && (input.longitude < -180 || input.longitude > 180)) return 'longitude is out of range';
  if (input.estimated_cost != null && input.estimated_cost < 0) return 'estimated_cost cannot be negative';
  for (const field of ['image_url', 'official_url', 'source_url']) {
    if (input[field] !== undefined) {
      try { optionalUrl(input[field], field); } catch (error) { return error.message; }
    }
  }
  if (input.verification_status === 'verified' && !input.source_url) {
    return 'A source_url is required for verified events';
  }
  for (const field of ['description', 'district', 'venue', 'source_name']) {
    if (input[field] !== undefined && input[field] !== null &&
        (typeof input[field] !== 'string' || input[field].length > 5000)) {
      return `${field} must be a string of at most 5000 characters or null`;
    }
  }
  return null;
}

function filters(query, { upcomingOnly = false } = {}) {
  const where = [];
  const values = [];
  const add = (expression, value) => {
    values.push(value);
    where.push(expression.replace('?', `$${values.length}`));
  };
  if (query.province !== undefined) {
    const province = queryValue(query.province, 'province');
    if (!PROVINCES.includes(province)) throw new Error('province is not supported');
    add('province = ?', province);
  }
  if (query.category !== undefined) {
    const category = queryValue(query.category, 'category');
    if (!CATEGORIES.includes(category)) throw new Error('category is not supported');
    add('category = ?', category);
  }
  if (query.keyword !== undefined) {
    const keyword = queryValue(query.keyword, 'keyword');
    if (!keyword || keyword.length > 100) throw new Error('keyword must contain 1 to 100 characters');
    values.push(keyword);
    where.push(`(title ILIKE '%' || $${values.length} || '%' OR COALESCE(description, '') ILIKE '%' || $${values.length} || '%')`);
  }
  const month = query.month === undefined ? undefined : Number(queryValue(query.month, 'month'));
  const year = query.year === undefined ? undefined : Number(queryValue(query.year, 'year'));
  if (month !== undefined && (!Number.isInteger(month) || month < 1 || month > 12)) throw new Error('month must be 1 to 12');
  if (year !== undefined && (!Number.isInteger(year) || year < 2000 || year > 2100)) throw new Error('year must be 2000 to 2100');
  if ((month === undefined) !== (year === undefined)) throw new Error('month and year must be provided together');
  if (month !== undefined) {
    values.push(year, month);
    where.push(`start_date <= (make_date($${values.length - 1}, $${values.length}, 1) + interval '1 month - 1 day')::date`);
    where.push(`end_date >= make_date($${values.length - 1}, $${values.length}, 1)`);
  }
  if (query.status === 'cancelled') where.push("publication_status = 'cancelled'");
  else where.push("publication_status = 'published'");
  if (upcomingOnly) where.push("publication_status = 'published' AND end_date >= CURRENT_DATE");
  if (query.status !== undefined) {
    const status = queryValue(query.status, 'status');
    if (!['upcoming', 'ongoing', 'completed', 'cancelled', 'unscheduled'].includes(status)) {
      throw new Error('status is invalid');
    }
    if (status === 'cancelled') where.push("publication_status = 'cancelled'");
    else if (status === 'upcoming') where.push("publication_status = 'published' AND start_date > CURRENT_DATE");
    else if (status === 'ongoing') where.push("publication_status = 'published' AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE");
    else if (status === 'completed') where.push("publication_status = 'published' AND end_date < CURRENT_DATE");
    else where.push("publication_status = 'published' AND start_date IS NULL");
  }
  return { sql: where.join(' AND '), values };
}

function pagination(query) {
  const page = query.page === undefined ? 1 : Number(queryValue(query.page, 'page'));
  const limit = query.limit === undefined ? 20 : Number(queryValue(query.limit, 'limit'));
  if (!Number.isInteger(page) || page < 1 || page > 100000) throw new Error('page must be a positive integer');
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('limit must be between 1 and 100');
  return { page, limit, offset: (page - 1) * limit };
}

function createEventsRouter({ pool, jwtSecret, now = () => new Date() }) {
  const api = express.Router();
  const admin = express.Router();
  const authenticated = requireUser(jwtSecret);
  const administrator = requireAdmin(jwtSecret);
  const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

  api.get('/categories', (_req, res) => res.json(CATEGORIES));

  api.get('/favorites', authenticated, asyncRoute(async (req, res) => {
    const result = await pool.query(
      `SELECT events.*, CASE
         WHEN events.publication_status = 'cancelled' THEN 'cancelled'
         WHEN events.start_date IS NULL THEN 'unscheduled'
         WHEN CURRENT_DATE < events.start_date THEN 'upcoming'
         WHEN CURRENT_DATE <= events.end_date THEN 'ongoing'
         ELSE 'completed'
       END AS event_status FROM events
       JOIN event_favorites f ON f.event_id = events.id
       WHERE f.user_id = $1 ORDER BY events.start_date NULLS LAST, events.title`,
      [req.user.id],
    );
    return res.json(result.rows);
  }));

  api.get('/monthly', asyncRoute(async (req, res) => {
    let selected;
    try { selected = filters(req.query); } catch (error) { return badRequest(res, error.message); }
    if (req.query.month === undefined) return badRequest(res, 'month and year are required');
    const result = await pool.query(
      `SELECT ${PUBLIC_COLUMNS} FROM events WHERE ${selected.sql} ORDER BY start_date, end_date, title`,
      selected.values,
    );
    return res.json(result.rows);
  }));

  api.get('/upcoming', asyncRoute(async (req, res) => {
    let selected;
    let page;
    try { selected = filters(req.query, { upcomingOnly: true }); page = pagination(req.query); }
    catch (error) { return badRequest(res, error.message); }
    const result = await pool.query(
      `SELECT ${PUBLIC_COLUMNS} FROM events WHERE ${selected.sql}
       ORDER BY start_date, title LIMIT $${selected.values.length + 1} OFFSET $${selected.values.length + 2}`,
      [...selected.values, page.limit, page.offset],
    );
    return res.json({ data: result.rows, page: page.page, limit: page.limit });
  }));

  api.get('/', asyncRoute(async (req, res) => {
    let selected;
    let page;
    try { selected = filters(req.query); page = pagination(req.query); }
    catch (error) { return badRequest(res, error.message); }
    const result = await pool.query(
      `SELECT ${PUBLIC_COLUMNS}, count(*) OVER()::int AS total FROM events
       WHERE ${selected.sql} ORDER BY start_date NULLS LAST, title
       LIMIT $${selected.values.length + 1} OFFSET $${selected.values.length + 2}`,
      [...selected.values, page.limit, page.offset],
    );
    const total = result.rows[0]?.total ?? 0;
    return res.json({ data: result.rows, page: page.page, limit: page.limit, total });
  }));

  api.post('/favorites', authenticated, asyncRoute(async (req, res) => {
    const eventId = req.body?.event_id;
    if (!Number.isSafeInteger(eventId) || eventId < 1) return badRequest(res, 'event_id must be a positive integer');
    const result = await pool.query(
      `INSERT INTO event_favorites (user_id, event_id)
       SELECT $1, id FROM events WHERE id = $2 AND publication_status = 'published'
       ON CONFLICT (user_id, event_id) DO NOTHING RETURNING event_id`,
      [req.user.id, eventId],
    );
    if (!result.rowCount && !(await pool.query(
      "SELECT 1 FROM events WHERE id = $1 AND publication_status = 'published'", [eventId],
    )).rowCount) return res.status(404).json({ message: 'Published event not found' });
    return res.status(201).json({ event_id: eventId, saved: true });
  }));

  api.delete('/favorites/:eventId', authenticated, asyncRoute(async (req, res) => {
    if (!/^[1-9]\d{0,8}$/.test(req.params.eventId)) return badRequest(res, 'event id is invalid');
    await pool.query('DELETE FROM event_favorites WHERE user_id = $1 AND event_id = $2', [req.user.id, Number(req.params.eventId)]);
    return res.status(204).end();
  }));

  api.get('/:id', asyncRoute(async (req, res) => {
    const isId = /^[1-9]\d{0,8}$/.test(req.params.id);
    const result = await pool.query(isId
      ? `SELECT ${PUBLIC_COLUMNS} FROM events WHERE publication_status = 'published' AND (slug = $1 OR id = $2)`
      : `SELECT ${PUBLIC_COLUMNS} FROM events WHERE publication_status <> 'draft' AND slug = $1`,
    isId ? [req.params.id, Number(req.params.id)] : [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ message: 'Published event not found' });
    return res.json(result.rows[0]);
  }));

  admin.get('/', administrator, asyncRoute(async (_req, res) => {
    const result = await pool.query(`SELECT id, title, slug, province, category, start_date, end_date, venue,
      source_url, verification_status, publication_status FROM events ORDER BY created_at DESC LIMIT 100`);
    return res.json(result.rows);
  }));
  admin.post('/', administrator, asyncRoute(async (req, res) => {
    const error = validateEvent(req.body);
    if (error) return badRequest(res, error);
    await pool.query(`INSERT INTO app_users (id, email, role) VALUES ($1, $2, 'admin') ON CONFLICT (id) DO UPDATE SET role = 'admin'`, [req.user.id, `admin.${req.user.id}@local.invalid`]);
    const fields = Object.keys(req.body);
    const values = fields.map((field) => req.body[field] ?? null);
    const names = [...fields, 'created_by', 'last_verified_at'];
    const placeholders = fields.map((_, index) => `$${index + 1}`);
    values.push(req.user.id, req.body.verification_status === 'verified' ? now() : null);
    placeholders.push(`$${values.length - 1}`, `$${values.length}`);
    const result = await pool.query(
      `INSERT INTO events (${names.join(', ')}) VALUES (${placeholders.join(', ')})
       RETURNING ${PUBLIC_COLUMNS}`,
      values,
    );
    return res.status(201).json(result.rows[0]);
  }));

  admin.put('/:id', administrator, asyncRoute(async (req, res) => {
    if (!/^[1-9]\d{0,8}$/.test(req.params.id)) return badRequest(res, 'event id is invalid');
    const existing = await pool.query('SELECT * FROM events WHERE id = $1', [Number(req.params.id)]);
    if (!existing.rows[0]) return res.status(404).json({ message: 'Event not found' });
    const event = { ...existing.rows[0], ...req.body };
    const error = validateEvent(event, false);
    if (error) return badRequest(res, error);
    const fields = Object.keys(req.body);
    if (!fields.length) return badRequest(res, 'At least one event field is required');
    const values = fields.map((field) => req.body[field] ?? null);
    const assignments = fields.map((field, index) => `${field} = $${index + 1}`);
    if (req.body.verification_status !== undefined) {
      values.push(req.body.verification_status === 'verified' ? now() : null);
      assignments.push(`last_verified_at = $${values.length}`);
    }
    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE events SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length} RETURNING ${PUBLIC_COLUMNS}`,
      values,
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Event not found' });
    return res.json(result.rows[0]);
  }));

  admin.delete('/:id', administrator, asyncRoute(async (req, res) => {
    if (!/^[1-9]\d{0,8}$/.test(req.params.id)) return badRequest(res, 'event id is invalid');
    const result = await pool.query(
      "UPDATE events SET publication_status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id",
      [Number(req.params.id)],
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Event not found' });
    return res.status(204).end();
  }));

  admin.patch('/:id/status', administrator, asyncRoute(async (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) ||
        Object.keys(req.body).some((key) => !['publication_status', 'verification_status'].includes(key))) {
      return badRequest(res, 'Only publication_status and verification_status are supported');
    }
    const { publication_status: status, verification_status: verification } = req.body || {};
    if (status !== undefined && !['draft', 'published', 'cancelled'].includes(status)) {
      return badRequest(res, 'publication_status must be draft, published or cancelled');
    }
    if (verification !== undefined && !['verified', 'unverified'].includes(verification)) {
      return badRequest(res, 'verification_status must be verified or unverified');
    }
    if (status === undefined && verification === undefined) {
      return badRequest(res, 'publication_status or verification_status is required');
    }
    if (verification === 'verified' && !req.body.source_url) {
      const event = await pool.query('SELECT source_url FROM events WHERE id = $1', [req.params.id]);
      if (!event.rows[0]) return res.status(404).json({ message: 'Event not found' });
      if (!event.rows[0].source_url) return badRequest(res, 'A source_url is required for verified events');
    }
    const values = [];
    const assignments = [];
    if (status !== undefined) {
      values.push(status);
      assignments.push(`publication_status = $${values.length}`);
    }
    if (verification !== undefined) {
      values.push(verification);
      assignments.push(`verification_status = $${values.length}`);
      values.push(verification === 'verified' ? now() : null);
      assignments.push(`last_verified_at = $${values.length}`);
    }
    assignments.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE events SET ${assignments.join(', ')} WHERE id = $${values.length} RETURNING ${PUBLIC_COLUMNS}`,
      values,
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Event not found' });
    return res.json(result.rows[0]);
  }));

  return { events: api, admin };
}

module.exports = { CATEGORIES, PROVINCES, createEventsRouter, filters, validateEvent };



