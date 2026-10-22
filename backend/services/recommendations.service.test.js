const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreRecommendations } = require('./recommendations.service');

const destinations = [
  {
    id: 'beach-place',
    name: 'Beach Place',
    province: 'Krabi',
    category: 'Beach',
    activities: ['Snorkeling', 'Island Hopping'],
    rating: 4.8,
  },
  {
    id: 'culture-place',
    name: 'Culture Place',
    province: 'Phuket',
    category: 'Culture & food',
    activities: ['Food', 'Walking'],
    rating: 4.6,
  },
];

test('ranks destinations by selected interests and explains matched interests', () => {
  const recommendations = scoreRecommendations(destinations, ['Beach', 'Snorkeling']);

  assert.equal(recommendations[0].id, 'beach-place');
  assert.deepEqual(Object.keys(recommendations[0]), [
    'id',
    'matchScore',
    'matchedInterests',
    'reason',
  ]);
  assert.deepEqual(recommendations[0].matchedInterests, ['Beach', 'Snorkeling']);
  assert.match(recommendations[0].reason, /Beach, Snorkeling/);
  assert.ok(recommendations[0].matchScore > recommendations[1].matchScore);
});

test('uses saved places as a ranking signal without fabricating interest matches', () => {
  const recommendations = scoreRecommendations(destinations, ['Diving'], ['culture-place']);
  const savedPlace = recommendations.find((place) => place.id === 'culture-place');

  assert.equal(savedPlace.matchedInterests.length, 0);
  assert.match(savedPlace.reason, /Similar to a place you saved/);
  assert.ok(savedPlace.matchScore > 0);
});

test('handles empty interests and keeps scores within the documented range', () => {
  const recommendations = scoreRecommendations(
    [{ ...destinations[0], rating: 9 }],
    [],
  );

  assert.equal(recommendations[0].matchScore, 55);
  assert.deepEqual(recommendations[0].matchedInterests, []);
  assert.match(recommendations[0].reason, /highly rated place/);
});
