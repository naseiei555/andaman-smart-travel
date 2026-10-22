import { getLocalRecommendations } from '../../../../shared/data/recommendations.data';
import { destinations } from '../../../../shared/data/places.data';

describe('getLocalRecommendations', () => {
  it('returns a ranked result for every destination when the API is unavailable', () => {
    const results = getLocalRecommendations(destinations, ['Beach', 'Diving'], ['phi-phi']);
    expect(results).toHaveLength(destinations.length);
    expect(results[0].id).toBe('phi-phi');
    expect(results[0].matchedInterests).toContain('Beach');
    expect(results[0].matchScore).toBeLessThanOrEqual(99);
  });

  it('handles empty interests without returning invalid scores', () => {
    const results = getLocalRecommendations(destinations, []);
    expect(results.every((match) => match.matchScore >= 0 && match.matchScore <= 99)).toBe(true);
  });
});
