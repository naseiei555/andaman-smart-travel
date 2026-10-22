import { distanceKilometers } from '../../../../shared/data/geo.utils';
import { destinations } from '../../../../shared/data/places.data';

describe('interactive map data', () => {
  it('has valid coordinates for every map destination', () => {
    expect(destinations.length).toBeGreaterThan(0);
    for (const place of destinations) {
      expect(place.latitude).toBeGreaterThanOrEqual(-90);
      expect(place.latitude).toBeLessThanOrEqual(90);
      expect(place.longitude).toBeGreaterThanOrEqual(-180);
      expect(place.longitude).toBeLessThanOrEqual(180);
    }
  });

  it('calculates a zero distance for the same place and a positive distance for another place', () => {
    const phiPhi = destinations.find((place) => place.id === 'phi-phi');
    const kohLipe = destinations.find((place) => place.id === 'koh-lipe');

    if (!phiPhi || !kohLipe) {
      throw new Error('Expected Phi Phi and Koh Lipe in the destination catalog.');
    }

    expect(distanceKilometers(phiPhi, phiPhi)).toBeCloseTo(0, 6);
    expect(distanceKilometers(phiPhi, kohLipe)).toBeGreaterThan(100);
  });
});
