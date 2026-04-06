export type FlightStatus = 'scheduled' | 'in_air' | 'landed' | 'cancelled'

export interface Flight {
  id: string
  user_id: string
  flight_number: string
  airline: string
  origin_code: string
  destination_code: string
  departure_time: string
  arrival_time: string
  status: FlightStatus
  aircraft_type: string | null
  seat: string | null
  notes: string | null
  actual_departure_time: string | null
  actual_arrival_time: string | null
  estimated_arrival_time: string | null
  progress_percent: number | null
  departure_delay: number | null  // minutes
  arrival_delay: number | null    // minutes
  departure_gate: string | null
  arrival_gate: string | null
  route: string | null
  created_at: string
}

export interface ShareToken {
  id: string
  user_id: string
  token: string
  label: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      flights: {
        Row: Flight
        Insert: Omit<Flight, 'id' | 'created_at'>
        Update: Partial<Omit<Flight, 'id' | 'user_id' | 'created_at'>>
      }
      share_tokens: {
        Row: ShareToken
        Insert: Omit<ShareToken, 'id' | 'token' | 'created_at'>
        Update: Partial<Pick<ShareToken, 'label'>>
      }
    }
  }
}

export interface FlightLookupResult {
  flight_number: string
  airline: string
  origin_code: string
  destination_code: string
  departure_time: string
  arrival_time: string
  aircraft_type: string | null
  status: FlightStatus
  actual_departure_time: string | null
  actual_arrival_time: string | null
  estimated_arrival_time: string | null
  progress_percent: number | null
  departure_delay: number | null
  arrival_delay: number | null
  departure_gate: string | null
  arrival_gate: string | null
  route: string | null
}
