import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { boat, refresh } from 'ionicons/icons';
import { catchError, map, of, Subject, switchMap } from 'rxjs';
import type { BoatRoute } from '../../../../shared/data/boat-routes.data';
import { BoatRoutesApiService } from '../core/boat-routes-api.service';
import { boatRoutes as localBoatRoutes, destinations } from '../data/mock-data';

type BoatRoutesResult = { routes: BoatRoute[] } | { error: true };

const fallbackBoatRoutes: BoatRoute[] = localBoatRoutes.map((route, index) => ({
  id: `local-${index + 1}`,
  destinationId: destinations.find((place) => place.name === route.destination)?.id ?? route.destination.toLowerCase().replaceAll(' ', '-'),
  departure: route.departure,
  destination: route.destination,
  departureTime: route.departureTime,
  estimatedDuration: route.duration,
  transportType: route.type,
  price: route.price,
  operator: route.operator,
}));

@Component({
  selector: 'app-boat-routes-page',
  standalone: true,
  imports: [IonButton, IonContent, IonHeader, IonIcon, IonSearchbar, IonTitle, IonToolbar],
  templateUrl: './boat-routes.page.html',
  styleUrl: './boat-routes.page.scss',
})
export class BoatRoutesPage {
  private readonly boatRoutesApi = inject(BoatRoutesApiService);
  private readonly requests = new Subject<void>();
  protected readonly routes = signal<BoatRoute[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly visibleRoutes = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    return this.routes().filter((route) =>
      !query ||
      `${route.departure} ${route.destination} ${route.transportType} ${route.operator}`
        .toLowerCase()
        .includes(query),
    );
  });

  constructor() {
    addIcons({ boat, refresh });
    this.requests
      .pipe(
        switchMap(() =>
          this.boatRoutesApi.getRoutes().pipe(
            map((routes): BoatRoutesResult => ({ routes })),
            catchError(() => of({ error: true } as const)),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.loading.set(false);
        this.error.set(false);
        this.routes.set('routes' in result ? result.routes : fallbackBoatRoutes);
      });
    this.refresh();
  }

  protected refresh(): void {
    this.loading.set(true);
    this.error.set(false);
    this.requests.next();
  }

  protected updateSearch(event: CustomEvent<{ value?: string | null }>): void {
    this.searchQuery.set(event.detail.value ?? '');
  }

  protected routeSearchUrl(route: BoatRoute): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${route.departure} ferry pier ${route.destination}`)}`;
  }
}
