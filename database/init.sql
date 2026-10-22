CREATE TABLE IF NOT EXISTS destinations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  province VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  image TEXT,
  rating DOUBLE PRECISION DEFAULT 0,
  opening_info VARCHAR(255),
  estimated_cost VARCHAR(100),
  activities TEXT[]
);

CREATE TABLE IF NOT EXISTS favorite_places (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  destination_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, destination_id)
);

CREATE TABLE IF NOT EXISTS boat_routes (
  id SERIAL PRIMARY KEY,
  departure VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  departure_time VARCHAR(50),
  estimated_duration VARCHAR(50),
  transport_type VARCHAR(100),
  price VARCHAR(50),
  operator VARCHAR(150)
);

CREATE TABLE IF NOT EXISTS weather_records (
  id SERIAL PRIMARY KEY,
  destination_id INTEGER NOT NULL,
  temperature DOUBLE PRECISION,
  humidity INTEGER,
  wind_speed DOUBLE PRECISION,
  rain_probability INTEGER,
  weather_condition VARCHAR(100),
  forecast JSONB,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
