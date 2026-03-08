export interface Session {
  session_key: number
  session_name: string
  session_type: string
  meeting_key: number
  circuit_key: number
  circuit_short_name: string
  country_name: string
  country_code: string
  country_key: number
  date_start: string
  date_end: string
  gmt_offset: string
  location: string
  year: number
}

export interface Meeting {
  meeting_key: number
  meeting_name: string
  meeting_official_name: string
  circuit_key: number
  circuit_short_name: string
  circuit_image: string
  country_name: string
  country_flag: string
  country_code: string
  country_key: number
  location: string
  date_start: string
  date_end: string
  gmt_offset: string
  year: number
}

export interface Driver {
  driver_number: number
  broadcast_name: string
  first_name: string
  last_name: string
  full_name: string
  name_acronym: string
  headshot_url: string
  team_name: string
  team_colour: string
  session_key: number
  meeting_key: number
}

export interface Position {
  date: string
  driver_number: number
  position: number
  session_key: number
  meeting_key: number
}

export interface Interval {
  date: string
  driver_number: number
  gap_to_leader: number | string | null
  interval: number | string | null
  session_key: number
  meeting_key: number
}

export interface Lap {
  date_start: string
  driver_number: number
  duration_sector_1: number | null
  duration_sector_2: number | null
  duration_sector_3: number | null
  i1_speed: number | null
  i2_speed: number | null
  lap_duration: number | null
  lap_number: number
  is_pit_out_lap: boolean
  st_speed: number | null
  segments_sector_1: number[]
  segments_sector_2: number[]
  segments_sector_3: number[]
  session_key: number
  meeting_key: number
}

export interface Stint {
  [k: string]: unknown
  compound: string
  driver_number: number
  lap_start: number
  lap_end: number
  stint_number: number
  tyre_age_at_start: number
  session_key: number
  meeting_key: number
}

export interface PitStop {
  date: string
  driver_number: number
  lane_duration: number
  lap_number: number
  stop_duration: number | null
  session_key: number
  meeting_key: number
}

export interface RaceControl {
  category: string
  date: string
  driver_number: number | null
  flag: string | null
  lap_number: number | null
  message: string
  qualifying_phase: string | null
  scope: string | null
  sector: number | null
  session_key: number
  meeting_key: number
}

export interface Weather {
  air_temperature: number
  date: string
  humidity: number
  pressure: number
  rainfall: number
  track_temperature: number
  wind_direction: number
  wind_speed: number
  session_key: number
  meeting_key: number
}

export interface LeaderboardEntry {
  position: number
  driver: Driver
  interval: number | string | null
  gapToLeader: number | string | null
  lastLap: Lap | null
  bestLapTime: number | null
  isOverallBest: boolean
  currentStint: Stint | null
  tyreAge: number
  lapNumber: number
}
