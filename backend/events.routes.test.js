const test = require('node:test');
const assert = require('node:assert/strict');
const { filters, validateEvent } = require('./events.routes');

const validEvent = {
  title: 'Community Food Festival',
  slug: 'community-food-festival',
  province: 'Phuket',
  category: 'food',
  publication_status: 'draft',
};

test('accepts an unverified draft event without claiming an official source', () => {
  assert.equal(validateEvent(validEvent), null);
});

test('requires a source URL before an event can be marked verified', () => {
  assert.match(validateEvent({ ...validEvent, verification_status: 'verified' }), /source_url is required/);
  assert.equal(validateEvent({ ...validEvent, verification_status: 'verified', source_url: 'https://example.org/event' }), null);
});

test('rejects invalid provinces, unordered dates, and unsafe URLs', () => {
  assert.match(validateEvent({ ...validEvent, province: 'Atlantis' }), /province is not supported/);
  assert.match(validateEvent({ ...validEvent, start_date: '2026-11-20', end_date: '2026-11-19' }), /ordered date range/);
  assert.match(validateEvent({ ...validEvent, official_url: 'javascript:alert(1)' }), /HTTP or HTTPS/);
});

test('builds parameterized province and month-overlap filters', () => {
  const selected = filters({ province: 'Krabi', month: '11', year: '2026' });
  assert.deepEqual(selected.values, ['Krabi', 2026, 11]);
  assert.match(selected.sql, /province = \$1/);
  assert.match(selected.sql, /start_date <= .* make_date/);
  assert.match(selected.sql, /end_date >= make_date/);
  assert.match(selected.sql, /publication_status = 'published'/);
});

test('requires month and year together and validates their ranges', () => {
  assert.throws(() => filters({ month: '4' }), /provided together/);
  assert.throws(() => filters({ month: '13', year: '2026' }), /month must be 1 to 12/);
  assert.throws(() => filters({ month: '4', year: '1999' }), /year must be 2000 to 2100/);
});
