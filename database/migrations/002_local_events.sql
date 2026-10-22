CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  province VARCHAR(100) NOT NULL CHECK (province IN (
    'Krabi', 'Phang Nga', 'Phuket', 'Trang', 'Satun', 'Songkhla',
    'Surat Thani', 'Nakhon Si Thammarat', 'Phatthalung', 'Pattani',
    'Yala', 'Narathiwat', 'Chumphon', 'Ranong'
  )),
  district VARCHAR(100),
  venue VARCHAR(255),
  category VARCHAR(30) NOT NULL CHECK (category IN (
    'culture', 'food', 'music', 'sports', 'tradition', 'tourism', 'other'
  )),
  start_date DATE,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  latitude DOUBLE PRECISION CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION CHECK (longitude BETWEEN -180 AND 180),
  estimated_cost NUMERIC(12, 2) CHECK (estimated_cost >= 0),
  image_url TEXT,
  official_url TEXT,
  source_name VARCHAR(255),
  source_url TEXT,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('verified', 'unverified')),
  last_verified_at TIMESTAMPTZ,
  publication_status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (publication_status IN ('draft', 'published', 'cancelled')),
  created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ((start_date IS NULL AND end_date IS NULL) OR
         (start_date IS NOT NULL AND end_date IS NOT NULL AND end_date >= start_date)),
  CHECK (verification_status <> 'verified' OR source_url IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS events_name_province_dates_unique
  ON events (LOWER(BTRIM(title)), LOWER(BTRIM(province)),
             COALESCE(start_date, DATE '0001-01-01'),
             COALESCE(end_date, DATE '0001-01-01'));
CREATE INDEX IF NOT EXISTS events_public_province_dates_idx
  ON events (province, start_date, end_date)
  WHERE publication_status = 'published';
CREATE INDEX IF NOT EXISTS events_public_category_dates_idx
  ON events (category, start_date, end_date)
  WHERE publication_status = 'published';
CREATE INDEX IF NOT EXISTS events_public_status_dates_idx
  ON events (publication_status, start_date, end_date);

CREATE TABLE IF NOT EXISTS event_favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, event_id)
);
CREATE INDEX IF NOT EXISTS event_favorites_user_created_idx
  ON event_favorites (user_id, created_at DESC);
