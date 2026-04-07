-- Add location and track columns for in-air flight mapping
ALTER TABLE flights
  ADD COLUMN IF NOT EXISTS fa_flight_id text,
  ADD COLUMN IF NOT EXISTS last_lat float8,
  ADD COLUMN IF NOT EXISTS last_lon float8,
  ADD COLUMN IF NOT EXISTS last_heading int,
  ADD COLUMN IF NOT EXISTS last_altitude int,
  ADD COLUMN IF NOT EXISTS track_points jsonb;

-- Update status check constraint to include taxiing
ALTER TABLE flights DROP CONSTRAINT IF EXISTS flights_status_check;
ALTER TABLE flights ADD CONSTRAINT flights_status_check
  CHECK (status IN ('scheduled', 'taxiing', 'in_air', 'landed', 'cancelled'));
