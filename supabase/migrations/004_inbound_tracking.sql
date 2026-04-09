-- Inbound aircraft tracking: stores the previous leg's delay so we can warn
-- the user before the departure board shows anything.
ALTER TABLE flights
  ADD COLUMN IF NOT EXISTS inbound_delay_mins integer,
  ADD COLUMN IF NOT EXISTS inbound_origin_code text,
  ADD COLUMN IF NOT EXISTS inbound_fa_flight_id text;
