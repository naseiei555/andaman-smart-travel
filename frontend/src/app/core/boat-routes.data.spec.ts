import { describe, expect, it } from 'vitest';
import { isBoatRoute, isBoatRouteList } from '../../../../shared/data/boat-routes.data';

const route = {
  id: 'phuket-phi-phi',
  destinationId: 'phi-phi',
  departure: 'Phuket',
  destination: 'Phi Phi Islands',
  departureTime: '08:30',
  estimatedDuration: '1h 45m',
  transportType: 'Speedboat',
  price: '฿1,100',
  operator: 'Andaman Wave',
};

describe('boat route response validation', () => {
  it('accepts a complete route and list', () => {
    expect(isBoatRoute(route)).toBe(true);
    expect(isBoatRouteList([route])).toBe(true);
  });

  it('rejects malformed records and non-array results', () => {
    expect(isBoatRoute({ ...route, departureTime: 830 })).toBe(false);
    expect(isBoatRouteList({ routes: [route] })).toBe(false);
    expect(isBoatRouteList([route, null])).toBe(false);
  });
});
