import { Injectable, signal } from '@angular/core';
import { readFavoriteIds, writeFavoriteIds } from '../../../../shared/data/favorites.data';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  readonly favorites = signal(readFavoriteIds());

  toggleFavorite(id: string): void {
    const current = this.favorites();
    const updated = current.includes(id)
      ? current.filter((favoriteId) => favoriteId !== id)
      : [...current, id];
    writeFavoriteIds(updated);
    this.favorites.set(updated);
  }

  isFavorite(id: string): boolean {
    return this.favorites().includes(id);
  }
}
