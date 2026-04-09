export interface AirportInfo {
  lat: number
  lon: number
  name: string
  city: string
}

const AIRPORTS: Record<string, AirportInfo> = {
  // Netherlands
  AMS: { lat: 52.3086, lon: 4.7639, name: 'Amsterdam Schiphol', city: 'Amsterdam' },
  EIN: { lat: 51.4501, lon: 5.3744, name: 'Eindhoven', city: 'Eindhoven' },
  RTM: { lat: 51.9569, lon: 4.4372, name: 'Rotterdam The Hague', city: 'Rotterdam' },
  // UK
  LHR: { lat: 51.4706, lon: -0.4619, name: 'London Heathrow', city: 'London' },
  LGW: { lat: 51.1537, lon: -0.1821, name: 'London Gatwick', city: 'London' },
  STN: { lat: 51.885, lon: 0.235, name: 'London Stansted', city: 'London' },
  MAN: { lat: 53.3537, lon: -2.2749, name: 'Manchester', city: 'Manchester' },
  EDI: { lat: 55.9508, lon: -3.3725, name: 'Edinburgh', city: 'Edinburgh' },
  // Germany
  FRA: { lat: 50.0379, lon: 8.5622, name: 'Frankfurt', city: 'Frankfurt' },
  MUC: { lat: 48.3538, lon: 11.7861, name: 'Munich', city: 'Munich' },
  BER: { lat: 52.3667, lon: 13.5033, name: 'Berlin Brandenburg', city: 'Berlin' },
  DUS: { lat: 51.2895, lon: 6.7668, name: 'Düsseldorf', city: 'Düsseldorf' },
  HAM: { lat: 53.6304, lon: 9.9882, name: 'Hamburg', city: 'Hamburg' },
  // France
  CDG: { lat: 49.0097, lon: 2.5479, name: 'Paris Charles de Gaulle', city: 'Paris' },
  ORY: { lat: 48.7233, lon: 2.3794, name: 'Paris Orly', city: 'Paris' },
  LYS: { lat: 45.7256, lon: 5.0811, name: 'Lyon', city: 'Lyon' },
  NCE: { lat: 43.6584, lon: 7.2159, name: 'Nice', city: 'Nice' },
  MRS: { lat: 43.4393, lon: 5.2214, name: 'Marseille', city: 'Marseille' },
  // Italy
  FCO: { lat: 41.8003, lon: 12.2389, name: 'Rome Fiumicino', city: 'Rome' },
  LIN: { lat: 45.4508, lon: 9.2750, name: 'Milan Linate', city: 'Milan' },
  MXP: { lat: 45.6306, lon: 8.7231, name: 'Milan Malpensa', city: 'Milan' },
  VCE: { lat: 45.5053, lon: 12.3519, name: 'Venice', city: 'Venice' },
  NAP: { lat: 40.8860, lon: 14.2908, name: 'Naples', city: 'Naples' },
  BGY: { lat: 45.6739, lon: 9.7042, name: 'Bergamo', city: 'Bergamo' },
  // Spain
  MAD: { lat: 40.4936, lon: -3.5668, name: 'Madrid Barajas', city: 'Madrid' },
  BCN: { lat: 41.2971, lon: 2.0785, name: 'Barcelona', city: 'Barcelona' },
  AGP: { lat: 36.6749, lon: -4.4991, name: 'Málaga', city: 'Málaga' },
  PMI: { lat: 39.5517, lon: 2.7388, name: 'Palma de Mallorca', city: 'Mallorca' },
  ALC: { lat: 38.2822, lon: -0.5582, name: 'Alicante', city: 'Alicante' },
  SVQ: { lat: 37.418, lon: -5.8931, name: 'Seville', city: 'Seville' },
  // Portugal
  LIS: { lat: 38.7813, lon: -9.1359, name: 'Lisbon', city: 'Lisbon' },
  OPO: { lat: 41.2481, lon: -8.6814, name: 'Porto', city: 'Porto' },
  FAO: { lat: 37.0144, lon: -7.9659, name: 'Faro', city: 'Faro' },
  // Scandinavia
  CPH: { lat: 55.6180, lon: 12.6508, name: 'Copenhagen', city: 'Copenhagen' },
  ARN: { lat: 59.6519, lon: 17.9186, name: 'Stockholm Arlanda', city: 'Stockholm' },
  OSL: { lat: 60.1976, lon: 11.1004, name: 'Oslo Gardermoen', city: 'Oslo' },
  HEL: { lat: 60.3183, lon: 24.9630, name: 'Helsinki', city: 'Helsinki' },
  GOT: { lat: 57.6628, lon: 12.2798, name: 'Gothenburg', city: 'Gothenburg' },
  // Belgium / Luxembourg
  BRU: { lat: 50.9014, lon: 4.4844, name: 'Brussels', city: 'Brussels' },
  LUX: { lat: 49.6233, lon: 6.2044, name: 'Luxembourg', city: 'Luxembourg' },
  // Switzerland / Austria
  ZRH: { lat: 47.4647, lon: 8.5492, name: 'Zurich', city: 'Zurich' },
  GVA: { lat: 46.2381, lon: 6.1089, name: 'Geneva', city: 'Geneva' },
  VIE: { lat: 48.1103, lon: 16.5697, name: 'Vienna', city: 'Vienna' },
  // Greece / Turkey
  ATH: { lat: 37.9364, lon: 23.9445, name: 'Athens', city: 'Athens' },
  IST: { lat: 41.2753, lon: 28.7519, name: 'Istanbul', city: 'Istanbul' },
  SKG: { lat: 40.5197, lon: 22.9709, name: 'Thessaloniki', city: 'Thessaloniki' },
  HER: { lat: 35.3397, lon: 25.1803, name: 'Heraklion', city: 'Crete' },
  RHO: { lat: 36.4054, lon: 28.0862, name: 'Rhodes', city: 'Rhodes' },
  // Eastern Europe
  WAW: { lat: 52.1657, lon: 20.9671, name: 'Warsaw', city: 'Warsaw' },
  PRG: { lat: 50.1008, lon: 14.2600, name: 'Prague', city: 'Prague' },
  BUD: { lat: 47.4369, lon: 19.2556, name: 'Budapest', city: 'Budapest' },
  OTP: { lat: 44.5711, lon: 26.0850, name: 'Bucharest', city: 'Bucharest' },
  SOF: { lat: 42.6967, lon: 23.4114, name: 'Sofia', city: 'Sofia' },
  // Middle East / Africa
  DXB: { lat: 25.2532, lon: 55.3657, name: 'Dubai', city: 'Dubai' },
  AUH: { lat: 24.4330, lon: 54.6511, name: 'Abu Dhabi', city: 'Abu Dhabi' },
  DOH: { lat: 25.2609, lon: 51.6138, name: 'Doha', city: 'Doha' },
  CAI: { lat: 30.1219, lon: 31.4056, name: 'Cairo', city: 'Cairo' },
  CMN: { lat: 33.3675, lon: -7.5899, name: 'Casablanca', city: 'Casablanca' },
  NBO: { lat: -1.3192, lon: 36.9275, name: 'Nairobi', city: 'Nairobi' },
  JNB: { lat: -26.1392, lon: 28.2460, name: 'Johannesburg', city: 'Johannesburg' },
  CPT: { lat: -33.9648, lon: 18.5976, name: 'Cape Town', city: 'Cape Town' },
  // North America
  JFK: { lat: 40.6413, lon: -73.7781, name: 'New York JFK', city: 'New York' },
  EWR: { lat: 40.6895, lon: -74.1745, name: 'Newark', city: 'New York' },
  LAX: { lat: 33.9425, lon: -118.4081, name: 'Los Angeles', city: 'Los Angeles' },
  SFO: { lat: 37.6213, lon: -122.3790, name: 'San Francisco', city: 'San Francisco' },
  ORD: { lat: 41.9742, lon: -87.9073, name: 'Chicago O\'Hare', city: 'Chicago' },
  MIA: { lat: 25.7959, lon: -80.2870, name: 'Miami', city: 'Miami' },
  BOS: { lat: 42.3656, lon: -71.0096, name: 'Boston', city: 'Boston' },
  IAD: { lat: 38.9531, lon: -77.4565, name: 'Washington Dulles', city: 'Washington' },
  YYZ: { lat: 43.6777, lon: -79.6248, name: 'Toronto Pearson', city: 'Toronto' },
  YUL: { lat: 45.4706, lon: -73.7408, name: 'Montreal', city: 'Montreal' },
  // Asia-Pacific
  NRT: { lat: 35.7720, lon: 140.3929, name: 'Tokyo Narita', city: 'Tokyo' },
  HND: { lat: 35.5494, lon: 139.7798, name: 'Tokyo Haneda', city: 'Tokyo' },
  HKG: { lat: 22.3080, lon: 113.9185, name: 'Hong Kong', city: 'Hong Kong' },
  SIN: { lat: 1.3644, lon: 103.9915, name: 'Singapore Changi', city: 'Singapore' },
  ICN: { lat: 37.4602, lon: 126.4407, name: 'Seoul Incheon', city: 'Seoul' },
  PVG: { lat: 31.1443, lon: 121.8083, name: 'Shanghai Pudong', city: 'Shanghai' },
  PEK: { lat: 40.0799, lon: 116.6031, name: 'Beijing Capital', city: 'Beijing' },
  BKK: { lat: 13.6811, lon: 100.7472, name: 'Bangkok Suvarnabhumi', city: 'Bangkok' },
  KUL: { lat: 2.7456, lon: 101.7099, name: 'Kuala Lumpur', city: 'Kuala Lumpur' },
  SYD: { lat: -33.9461, lon: 151.1772, name: 'Sydney', city: 'Sydney' },
  MEL: { lat: -37.6690, lon: 144.8410, name: 'Melbourne', city: 'Melbourne' },
  // South America
  GRU: { lat: -23.4356, lon: -46.4731, name: 'São Paulo Guarulhos', city: 'São Paulo' },
  EZE: { lat: -34.8222, lon: -58.5358, name: 'Buenos Aires Ezeiza', city: 'Buenos Aires' },
  BOG: { lat: 4.7016, lon: -74.1469, name: 'Bogotá', city: 'Bogotá' },
  LIM: { lat: -12.0219, lon: -77.1143, name: 'Lima', city: 'Lima' },
}

export function getAirportInfo(iata: string): AirportInfo | null {
  return AIRPORTS[iata.toUpperCase()] ?? null
}

export function getAirportCoords(iata: string): { lat: number; lon: number } | null {
  const info = AIRPORTS[iata.toUpperCase()]
  return info ? { lat: info.lat, lon: info.lon } : null
}

export function getAirportCity(iata: string): string {
  return AIRPORTS[iata.toUpperCase()]?.city ?? iata
}
