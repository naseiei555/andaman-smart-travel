import { describe, expect, it } from 'vitest';
import { destinations } from '../../../../shared/data/places.data';
import { readFavoriteIds, writeFavoriteIds } from '../../../../shared/data/favorites.data';

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

describe('favorite persistence', () => {
  it('starts empty and persists unique saved destination ids', () => {
    const storage = new MemoryStorage();
    expect(readFavoriteIds(storage)).toEqual([]);

    writeFavoriteIds(['phi-phi', 'railay', 'phi-phi'], storage);

    expect(readFavoriteIds(storage)).toEqual(['phi-phi', 'railay']);
  });

  it('ignores ids that no longer exist in the destination catalog', () => {
    const storage = new MemoryStorage();
    storage.setItem('andaman-smart-travel:favorites:v1', JSON.stringify(['phi-phi', 'unknown']));

    expect(readFavoriteIds(storage)).toEqual(['phi-phi']);
  });

  it('rejects corrupt storage and attempts to save unknown places', () => {
    const storage = new MemoryStorage();
    storage.setItem('andaman-smart-travel:favorites:v1', '{invalid');

    expect(() => readFavoriteIds(storage)).toThrow('Saved favorites are corrupted');
    expect(() => writeFavoriteIds(['unknown'], storage)).toThrow('unknown destination');
    expect(destinations.some((place) => place.id === 'phi-phi')).toBe(true);
  });
});
