import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { calendar, close, location } from 'ionicons/icons';
import { destinations } from '../../../../shared/data/places.data';
import { applyImageFallback } from '../../../../shared/data/images.data';
import { localDateString, MAX_TRIP_DAYS } from '../../../../shared/data/trip-plan.data';
import { TripPlanService } from '../core/trip-plan.service';
import { FavoritesService } from '../core/favorites.service';

@Component({
  selector: 'app-trips-page',
  standalone: true,
  imports: [IonButton, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar, RouterLink],
  templateUrl: './trips.page.html',
  styleUrl: './trips.page.scss',
})
export class TripsPage {
  protected readonly tripPlanService = inject(TripPlanService);
  protected readonly favoritesService = inject(FavoritesService);
  protected readonly tripDays = Array.from({ length: MAX_TRIP_DAYS }, (_, index) => index + 1);
  protected readonly plannedStops = computed(() =>
    this.tripPlanService.plan().stops.flatMap((stop) => {
      const place = destinations.find((destination) => destination.id === stop.destinationId);
      return place ? [{ ...stop, place }] : [];
    }),
  );
  protected readonly availableDestinations = computed(() => {
    const planned = new Set(this.tripPlanService.plan().stops.map((stop) => stop.destinationId));
    return destinations.filter((place) => !planned.has(place.id));
  });
  protected readonly favoritePlaces = computed(() =>
    destinations.filter((place) => this.favoritesService.favorites().includes(place.id)),
  );

  constructor() {
    addIcons({ calendar, close, location });
  }

  protected addDestination(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (select.value) {
      this.tripPlanService.addStop(select.value);
      select.value = '';
    }
  }

  protected updateStartDate(event: Event): void {
    this.tripPlanService.updatePlan({ startDate: (event.target as HTMLInputElement).value });
  }

  protected updateDuration(event: Event): void {
    this.tripPlanService.updatePlan({ durationDays: Number((event.target as HTMLSelectElement).value) });
  }

  protected assignDay(event: Event, destinationId: string): void {
    this.tripPlanService.assignStopToDay(destinationId, Number((event.target as HTMLSelectElement).value));
  }

  protected todayDate(): string {
    return localDateString();
  }

  protected handleImageError(event: Event, fallbackUrl: string): void {
    applyImageFallback(event, fallbackUrl);
  }
}
