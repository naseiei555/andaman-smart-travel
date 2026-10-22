import { destinations } from './places.data';

export const TRIP_PLAN_STORAGE_KEY = 'andaman-smart-travel:trip-plan:v1';
export const MAX_TRIP_DAYS = 14;

export interface TripStop {
  readonly destinationId: string;
  readonly day: number;
}

export interface TripPlan {
  readonly startDate: string;
  readonly durationDays: number;
  readonly stops: readonly TripStop[];
}

export const EMPTY_TRIP_PLAN: TripPlan = {
  startDate: '',
  durationDays: 3,
  stops: [],
};

const destinationIds = new Set(destinations.map((destination) => destination.id));

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function isTripPlan(value: unknown): value is TripPlan {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const plan = value as Record<string, unknown>;
  const startDate = plan['startDate'];
  const durationDays = plan['durationDays'];
  const stops = plan['stops'];
  if (
    typeof startDate !== 'string' ||
    (startDate !== '' && !isValidDate(startDate)) ||
    typeof durationDays !== 'number' ||
    !Number.isInteger(durationDays) ||
    durationDays < 1 ||
    durationDays > MAX_TRIP_DAYS ||
    !Array.isArray(stops)
  ) {
    return false;
  }

  const seen = new Set<string>();
  return stops.every((stop: unknown) => {
    if (typeof stop !== 'object' || stop === null) {
      return false;
    }
    const candidate = stop as Record<string, unknown>;
    if (
      typeof candidate['destinationId'] !== 'string' ||
      !destinationIds.has(candidate['destinationId']) ||
      seen.has(candidate['destinationId']) ||
      typeof candidate['day'] !== 'number' ||
      !Number.isInteger(candidate['day']) ||
      candidate['day'] < 1 ||
      candidate['day'] > durationDays
    ) {
      return false;
    }
    seen.add(candidate['destinationId']);
    return true;
  });
}

export function readTripPlan(storage: Storage = globalThis.localStorage): TripPlan {
  const stored = storage.getItem(TRIP_PLAN_STORAGE_KEY);
  if (stored === null) {
    return EMPTY_TRIP_PLAN;
  }

  let value: unknown;
  try {
    value = JSON.parse(stored);
  } catch (error) {
    throw new Error('Saved trip plan is corrupted in local storage', { cause: error });
  }
  if (!isTripPlan(value)) {
    throw new Error('Saved trip plan in local storage has an invalid format');
  }
  return value;
}

export function writeTripPlan(plan: TripPlan, storage: Storage = globalThis.localStorage): void {
  if (!isTripPlan(plan)) {
    throw new Error('Cannot save an invalid trip plan');
  }
  storage.setItem(TRIP_PLAN_STORAGE_KEY, JSON.stringify(plan));
}

export function localDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
