BEGIN;

CREATE TABLE IF NOT EXISTS layer_governorate_stats (
  id SERIAL PRIMARY KEY,
  layer_id INTEGER NOT NULL REFERENCES layers(id) ON DELETE CASCADE,
  country_file VARCHAR(255) NOT NULL,
  clipped_layer_name VARCHAR(255) NOT NULL,
  total_area_km2 DOUBLE PRECISION NOT NULL,
  pixel_size_m DOUBLE PRECISION,
  classes JSONB NOT NULL,
  clip_created_at TIMESTAMP,
  computed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(layer_id, country_file)
);

CREATE INDEX IF NOT EXISTS idx_layer_governorate_stats_layer
  ON layer_governorate_stats(layer_id);

CREATE INDEX IF NOT EXISTS idx_layer_governorate_stats_country
  ON layer_governorate_stats(country_file);

COMMIT;
