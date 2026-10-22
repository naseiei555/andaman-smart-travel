-- Illustrative UI demo records only. These are not real or verified events.
INSERT INTO events (title, slug, description, province, venue, category, start_date, end_date,
  source_name, verification_status, publication_status)
VALUES
  ('[MOCK SAMPLE] Coastal culture weekend', 'mock-coastal-culture-weekend-2026',
   'Illustrative sample record for demonstrating event discovery. This is not a real event; confirm dates with local organizers.',
   'Krabi', 'Sample venue — to be confirmed', 'culture', DATE '2026-11-14', DATE '2026-11-15',
   'Illustrative mock data — not an official source', 'unverified', 'published'),
  ('[MOCK SAMPLE] Local food and craft market', 'mock-food-craft-market-2026',
   'Illustrative sample record for demonstrating the monthly calendar. This is not a real event; confirm dates with local organizers.',
   'Phuket', 'Sample venue — to be confirmed', 'food', DATE '2026-10-24', DATE '2026-10-25',
   'Illustrative mock data — not an official source', 'unverified', 'published'),
  ('[MOCK SAMPLE] Trang community music day', 'mock-trang-music-day-2026',
   'Illustrative sample record for demonstrating province filters. This is not a real event; confirm dates with local organizers.',
   'Trang', 'Sample venue — to be confirmed', 'music', DATE '2026-11-21', DATE '2026-11-21',
   'Illustrative mock data — not an official source', 'unverified', 'published')
ON CONFLICT (slug) DO NOTHING;
