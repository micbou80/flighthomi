-- Baggage claim carousel (post-landing)
-- Weather at destination airport (temperature + WMO code)
ALTER TABLE flights
  ADD COLUMN IF NOT EXISTS baggage_claim text,
  ADD COLUMN IF NOT EXISTS destination_temp_c integer,
  ADD COLUMN IF NOT EXISTS destination_weather_code integer;
