import { destinations } from './places.data';

const FAVORITES_STORAGE_KEY = 'andaman-smart-travel:favorites:v1';
const destinationIds = new Set(destinations.map((destination) => destination.id));

export function readFavoriteIds(storage: Storage = globalThis.localStorage): string[] {
  const stored = storage.getItem(FAVORITES_STORAGE_KEY);
  if (stored === null) {
    return [];
  }

  let value: unknown;
  try {
    value = JSON.parse(stored);
  } catch (error) {
    throw new Error('Saved favorites are corrupted in local storage', { cause: error });
  }

  if (!Array.isArray(value) || !value.every((id) => typeof id === 'string')) {
    throw new Error('Saved favorites in local storage have an invalid format');
  }

  return [...new Set(value.filter((id) => destinationIds.has(id)))];
}

export function writeFavoriteIds(ids: readonly string[], storage: Storage = globalThis.localStorage): void {
  if (!ids.every((id) => typeof id === 'string' && destinationIds.has(id))) {
    throw new Error('Cannot save an unknown destination as a favorite');
  }

  storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...new Set(ids)]));
}
