import type { AndamanPlace } from './places.data';

export function distanceKilometers(from: Pick<AndamanPlace, 'latitude' | 'longitude'>, to: Pick<AndamanPlace, 'latitude' | 'longitude'>): number {
  const degreesToRadians = Math.PI / 180;
  const latitudeDelta = (to.latitude - from.latitude) * degreesToRadians;
  const longitudeDelta = (to.longitude - from.longitude) * degreesToRadians;
  const fromLatitude = from.latitude * degreesToRadians;
  const toLatitude = to.latitude * degreesToRadians;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}
