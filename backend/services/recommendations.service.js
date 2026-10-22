function normalize(value) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
}

function scoreRecommendations(destinations, interests, favoriteIds = []) {
  const normalizedInterests = [...new Set(interests.map(normalize).filter(Boolean))];
  const favoriteSet = new Set(favoriteIds);
  const destinationNames = new Map(destinations.map((destination) => [destination.id, destination.name]));

  return destinations
    .map((destination) => {
      const searchable = normalize(
        [destination.category, ...(destination.activities || [])].join(' '),
      );
      const matchedInterests = interests.filter((interest) =>
        searchable.includes(normalize(interest)),
      );
      const interestScore = normalizedInterests.length
        ? (new Set(matchedInterests.map(normalize)).size / normalizedInterests.length) * 40
        : 0;
      const ratingScore = Number.isFinite(destination.rating)
        ? Math.min(5, Math.max(0, destination.rating)) * 2
        : 0;
      const isFavorite = favoriteSet.has(destination.id);
      const matchScore = Math.min(
        99,
        Math.round(45 + interestScore + ratingScore + (isFavorite ? 10 : 0)),
      );
      const reasonParts = [];

      if (matchedInterests.length) {
        reasonParts.push(`Matches your interests: ${matchedInterests.join(', ')}`);
      }
      if (isFavorite) {
        reasonParts.push('Similar to a place you saved');
      }
      if (reasonParts.length === 0) {
        reasonParts.push(`A highly rated place in ${destination.province}`);
      }

      return {
        id: destination.id,
        matchScore,
        matchedInterests,
        reason: reasonParts.join(' · '),
      };
    })
    .sort(
      (a, b) =>
        b.matchScore - a.matchScore ||
        destinationNames.get(a.id).localeCompare(destinationNames.get(b.id)),
    );
}

module.exports = { scoreRecommendations };
