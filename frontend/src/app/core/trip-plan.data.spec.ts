import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  EMPTY_TRIP_PLAN,
  isTripPlan,
  readTripPlan,
  TRIP_PLAN_STORAGE_KEY,
  writeTripPlan,
} from '../../../../shared/data/trip-plan.data';
import { TripPlanService } from './trip-plan.service';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('trip plan persistence and validation', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('loads an empty trip plan by default and persists valid plans', () => {
    expect(readTripPlan(storage)).toEqual(EMPTY_TRIP_PLAN);
    const plan = {
      startDate: '2026-12-10',
      durationDays: 3,
      stops: [{ destinationId: 'phi-phi', day: 2 }],
    };

    writeTripPlan(plan, storage);

    expect(readTripPlan(storage)).toEqual(plan);
  });

  it('rejects invalid dates, duplicate destinations, unknown places, and out-of-range days', () => {
    expect(isTripPlan({ ...EMPTY_TRIP_PLAN, startDate: '2026-02-30' })).toBe(false);
    expect(isTripPlan({
      ...EMPTY_TRIP_PLAN,
      stops: [
        { destinationId: 'phi-phi', day: 1 },
        { destinationId: 'phi-phi', day: 2 },
      ],
    })).toBe(false);
    expect(isTripPlan({
      ...EMPTY_TRIP_PLAN,
      stops: [{ destinationId: 'not-a-place', day: 1 }],
    })).toBe(false);
    expect(isTripPlan({
      ...EMPTY_TRIP_PLAN,
      stops: [{ destinationId: 'phi-phi', day: 4 }],
    })).toBe(false);
  });

  it('adds and removes itinerary stops, assigns trip days, and clamps days when duration shrinks', () => {
    localStorage.removeItem(TRIP_PLAN_STORAGE_KEY);
    const service = TestBed.inject(TripPlanService);

    service.addStop('phi-phi');
    service.addStop('railay');
    service.assignStopToDay('railay', 3);
    service.updatePlan({ durationDays: 2 });

    expect(service.plan().stops).toEqual([
      { destinationId: 'phi-phi', day: 1 },
      { destinationId: 'railay', day: 2 },
    ]);
    expect(JSON.parse(localStorage.getItem(TRIP_PLAN_STORAGE_KEY) ?? 'null')).toEqual(service.plan());

    service.removeStop('phi-phi');
    expect(service.plan().stops).toEqual([{ destinationId: 'railay', day: 2 }]);

    service.clearPlan();
    expect(service.plan()).toEqual(EMPTY_TRIP_PLAN);
  });
});
