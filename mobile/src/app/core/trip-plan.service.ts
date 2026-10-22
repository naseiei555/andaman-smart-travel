import { Injectable, signal } from '@angular/core';
import {
  EMPTY_TRIP_PLAN,
  readTripPlan,
  TripPlan,
  writeTripPlan,
} from '../../../../shared/data/trip-plan.data';

@Injectable({ providedIn: 'root' })
export class TripPlanService {
  readonly plan = signal(readTripPlan());

  updatePlan(update: Partial<Pick<TripPlan, 'startDate' | 'durationDays'>>): void {
    const plan = { ...this.plan(), ...update };
    if (update.durationDays !== undefined) {
      this.commit({
        ...plan,
        stops: plan.stops.map((stop) => ({
          ...stop,
          day: Math.min(stop.day, plan.durationDays),
        })),
      });
      return;
    }
    this.commit(plan);
  }

  addStop(destinationId: string): void {
    if (this.plan().stops.some((stop) => stop.destinationId === destinationId)) {
      return;
    }
    this.commit({
      ...this.plan(),
      stops: [...this.plan().stops, { destinationId, day: 1 }],
    });
  }

  removeStop(destinationId: string): void {
    this.commit({
      ...this.plan(),
      stops: this.plan().stops.filter((stop) => stop.destinationId !== destinationId),
    });
  }

  assignStopToDay(destinationId: string, day: number): void {
    this.commit({
      ...this.plan(),
      stops: this.plan().stops.map((stop) =>
        stop.destinationId === destinationId ? { ...stop, day } : stop,
      ),
    });
  }

  clearPlan(): void {
    writeTripPlan(EMPTY_TRIP_PLAN);
    this.plan.set(EMPTY_TRIP_PLAN);
  }

  private commit(plan: TripPlan): void {
    writeTripPlan(plan);
    this.plan.set(plan);
  }
}
