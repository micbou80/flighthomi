-- Enable UUID extension (available by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Flights table
CREATE TABLE flights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flight_number text NOT NULL,
  airline text NOT NULL,
  origin_code text NOT NULL,
  destination_code text NOT NULL,
  departure_time timestamptz NOT NULL,
  arrival_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_air', 'landed', 'cancelled')),
  aircraft_type text,
  seat text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Share tokens table
CREATE TABLE share_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  label text NOT NULL DEFAULT 'Family',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON flights FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON share_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
