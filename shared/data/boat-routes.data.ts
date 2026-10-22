export interface BoatRoute {
  readonly id: string;
  readonly destinationId: string;
  readonly departure: string;
  readonly destination: string;
  readonly departureTime: string;
  readonly estimatedDuration: string;
  readonly transportType: string;
  readonly price: string;
  readonly operator: string;
}

export function isBoatRoute(value: unknown): value is BoatRoute {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const route = value as Record<string, unknown>;
  return (
    typeof route['id'] === 'string' &&
    typeof route['destinationId'] === 'string' &&
    typeof route['departure'] === 'string' &&
    typeof route['destination'] === 'string' &&
    typeof route['departureTime'] === 'string' &&
    typeof route['estimatedDuration'] === 'string' &&
    typeof route['transportType'] === 'string' &&
    typeof route['price'] === 'string' &&
    typeof route['operator'] === 'string'
  );
}

export function isBoatRouteList(value: unknown): value is BoatRoute[] {
  return Array.isArray(value) && value.every(isBoatRoute);
}
