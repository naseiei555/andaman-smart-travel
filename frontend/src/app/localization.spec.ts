import { destinations } from '../../../shared/data/places.data';
import { southernProvinces } from '../../../shared/data/provinces.data';
import { placeCategory, placeDescription, placeName, provinceName } from '../../../shared/data/localization.data';

describe('Thai and English destination content', () => {
  it('translates every supported province name', () => {
    for (const province of southernProvinces) {
      expect(provinceName(province, 'th')).not.toBe(province);
      expect(provinceName(province, 'en')).toBe(province);
    }
  });

  it('translates every destination name, category and description', () => {
    for (const place of destinations) {
      expect(placeName(place.name, 'th')).not.toBe(place.name);
      expect(placeName(place.name, 'en')).toBe(place.name);
      expect(placeCategory(place.category, 'th')).not.toBe(place.category);
      expect(placeCategory(place.category, 'en')).toBe(place.category);
      expect(placeDescription(place.name, place.description, 'th')).not.toBe(place.description);
      expect(placeDescription(place.name, place.description, 'en')).toBe(place.description);
    }
  });
});
