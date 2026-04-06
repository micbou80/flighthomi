export type FlightStatus = 'scheduled' | 'in_air' | 'landed' | 'cancelled'

export interface Flight {
  id: string
  user_id: string
  flight_number: string
  airline: string
  origin_code: string
  destination_code: string
  departure_time: string // ISO timestamptz
  arrival_time: string   // ISO timestamptz
  status: FlightStatus
  aircraft_type: string | null
  seat: string | null
  notes: string | null
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
}
