export interface RecommendationMatch {
  readonly id: string;
  readonly matchScore: number;
  readonly matchedInterests: readonly string[];
  readonly reason: string;
}

export function isRecommendationMatch(value: unknown): value is RecommendationMatch {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const match = value as Record<string, unknown>;
  return (
    typeof match['id'] === 'string' &&
    typeof match['matchScore'] === 'number' &&
    Number.isFinite(match['matchScore']) &&
    match['matchScore'] >= 0 &&
    match['matchScore'] <= 100 &&
    Array.isArray(match['matchedInterests']) &&
    match['matchedInterests'].every((interest) => typeof interest === 'string') &&
    typeof match['reason'] === 'string'
  );
}

export function isRecommendationMatchList(value: unknown): value is RecommendationMatch[] {
  return Array.isArray(value) && value.every(isRecommendationMatch);
}

export function getLocalRecommendations(
  destinations: readonly {
    readonly id: string;
    readonly name: string;
    readonly province: string;
    readonly category: string;
    readonly activities?: readonly string[];
    readonly rating?: number;
  }[],
  interests: readonly string[],
  favoriteIds: readonly string[] = [],
): RecommendationMatch[] {
  const normalize = (value: string) => value.toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
  const uniqueInterests = [...new Set(interests.map(normalize).filter(Boolean))];
  const favorites = new Set(favoriteIds);
  return destinations.map((place) => {
    const searchable = normalize([place.category, ...(place.activities ?? [])].join(' '));
    const matchedInterests = interests.filter((interest) => searchable.includes(normalize(interest)));
    const score = Math.min(99, Math.round(
      45 + (uniqueInterests.length ? new Set(matchedInterests.map(normalize)).size / uniqueInterests.length * 40 : 0)
      + (Number.isFinite(place.rating) ? Math.min(5, Math.max(0, place.rating!)) * 2 : 0)
      + (favorites.has(place.id) ? 10 : 0),
    ));
    const reasons = [
      ...(matchedInterests.length ? [`Matches your interests: ${matchedInterests.join(', ')}`] : []),
      ...(favorites.has(place.id) ? ['Similar to a place you saved'] : []),
    ];
    if (!reasons.length) reasons.push(`A highly rated place in ${place.province}`);
    return { id: place.id, matchScore: score, matchedInterests, reason: reasons.join(' · ') };
  }).sort((left, right) => right.matchScore - left.matchScore ||
    destinations.find((place) => place.id === left.id)!.name.localeCompare(destinations.find((place) => place.id === right.id)!.name));
}
