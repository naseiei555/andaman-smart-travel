import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { heart, heartDislike } from 'ionicons/icons';
import { destinations } from '../../../../shared/data/places.data';
import { applyImageFallback } from '../../../../shared/data/images.data';
import { FavoritesService } from '../core/favorites.service';

@Component({
  selector: 'app-favorites-page',
  standalone: true,
  imports: [
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
    RouterLink,
  ],
  templateUrl: './favorites.page.html',
  styleUrl: './favorites.page.scss',
})
export class FavoritesPage {
  protected readonly favoritesService = inject(FavoritesService);
  protected readonly favoritePlaces = computed(() =>
    destinations.filter((place) => this.favoritesService.favorites().includes(place.id)),
  );

  constructor() {
    addIcons({ heart, heartDislike });
  }

  protected removeFavorite(id: string): void {
    this.favoritesService.toggleFavorite(id);
  }

  protected handleImageError(event: Event, fallbackUrl: string): void {
    applyImageFallback(event, fallbackUrl);
  }
}
