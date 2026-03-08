import type {
  Session, Driver, Weather, RaceControl, LeaderboardEntry, Lap, Stint, PitStop,
} from './types'

const LT_PROXY = '/api/lt'

// --- Raw F1 Live Timing types ---

export interface LTSessionInfo {
  Meeting: {
    Key: number
    Name: string
    OfficialName: string
    Location: string
    Country: { Key: number; Code: string; Name: string }
    Circuit: { Key: number; ShortName: string }
  }
  SessionStatus: string
  Key: number
  Type: string
  Name: string
  StartDate: string
  EndDate: string
  GmtOffset: string
  Path: string
}

// --- Fetchers ---

export async function fetchLTJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`LT ${res.status}`)
  return res.json()
}

export function ltUrl(topic: string, path?: string): string {
  const filePath = path ? `${path}${topic}.json` : `${topic}.json`
  return `${LT_PROXY}?path=${encodeURIComponent(filePath)}`
}

// --- Lap time parser: "1:18.518" → 78.518 ---

export function parseLapTime(val: unknown): number | null {
  if (val == null) return null
  const str = typeof val === 'string' ? val : typeof val === 'number' ? String(val) : null
  if (!str || str === '') return null
  const parts = str.split(':')
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseFloat(parts[1])
  }
  const n = parseFloat(str)
  return isNaN(n) ? null : n
}

// --- Transform: SessionInfo → Session ---

export function transformSession(lt: LTSessionInfo): Session {
  return {
    session_key: lt.Key,
    session_name: lt.Name,
    session_type: lt.Type,
    meeting_key: lt.Meeting.Key,
    circuit_key: lt.Meeting.Circuit.Key,
    circuit_short_name: lt.Meeting.Circuit.ShortName,
    country_name: lt.Meeting.Country.Name,
    country_code: lt.Meeting.Country.Code,
    country_key: lt.Meeting.Country.Key,
    date_start: lt.StartDate,
    date_end: lt.EndDate,
    gmt_offset: lt.GmtOffset,
    location: lt.Meeting.Location,
    year: new Date(lt.StartDate).getFullYear(),
  }
}

// --- Transform: DriverList → Driver[] ---

export function transformDrivers(raw: Record<string, any>): Driver[] {
  return Object.entries(raw).map(([num, d]) => ({
    driver_number: parseInt(num),
    broadcast_name: d.BroadcastName || '',
    full_name: d.FullName || '',
    name_acronym: d.Tla || '',
    first_name: d.FirstName || '',
    last_name: d.LastName || '',
    team_name: d.TeamName || '',
    team_colour: d.TeamColour || '666666',
    headshot_url: d.HeadshotUrl || '',
    session_key: 0,
    meeting_key: 0,
  }))
}

// --- Transform: WeatherData → Weather ---

export function transformWeather(raw: any): Weather {
  return {
    air_temperature: parseFloat(raw.AirTemp) || 0,
    track_temperature: parseFloat(raw.TrackTemp) || 0,
    humidity: parseFloat(raw.Humidity) || 0,
    pressure: parseFloat(raw.Pressure) || 0,
    rainfall: parseFloat(raw.Rainfall) || 0,
    wind_direction: parseFloat(raw.WindDirection) || 0,
    wind_speed: parseFloat(raw.WindSpeed) || 0,
    date: new Date().toISOString(),
    session_key: 0,
    meeting_key: 0,
  }
}

// --- Normalise object-with-numeric-keys OR array into an array ---

function toArray(val: any): any[] {
  if (Array.isArray(val)) return val
  if (val && typeof val === 'object') {
    return Object.keys(val)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => val[k])
  }
  return []
}

// --- Transform: RaceControlMessages → RaceControl[] ---

export function transformRaceControl(raw: any): RaceControl[] {
  const messages = toArray(raw?.Messages)
  if (messages.length === 0) return []
  return messages.map((m: any) => ({
    category: m.Category || 'Other',
    date: m.Utc || '',
    driver_number: m.RacingNumber ? parseInt(m.RacingNumber) : null,
    flag: m.Flag || null,
    lap_number: m.Lap || null,
    message: m.Message || '',
    qualifying_phase: null,
    scope: m.Scope || null,
    sector: m.Sector || null,
    session_key: 0,
    meeting_key: 0,
  }))
}

// --- Build leaderboard from TimingData + DriverList + TimingAppData ---

export function buildLeaderboardFromLT(
  timingData: any,
  driverList: Record<string, any>,
  timingAppData: any,
): LeaderboardEntry[] {
  const lines = timingData?.Lines
  if (!lines) return []

  const entries: LeaderboardEntry[] = []

  for (const [num, raw] of Object.entries<any>(lines)) {
    const driverRaw = driverList[num]
    if (!driverRaw) continue

    const line = raw as any
    const stints: any[] = toArray(timingAppData?.Lines?.[num]?.Stints)
    const currentStint = stints.length > 0 ? stints[stints.length - 1] : null

    const driver: Driver = {
      driver_number: parseInt(num),
      broadcast_name: driverRaw.BroadcastName || '',
      full_name: driverRaw.FullName || '',
      name_acronym: driverRaw.Tla || '',
      first_name: driverRaw.FirstName || '',
      last_name: driverRaw.LastName || '',
      team_name: driverRaw.TeamName || '',
      team_colour: driverRaw.TeamColour || '666666',
      headshot_url: driverRaw.HeadshotUrl || '',
      session_key: 0,
      meeting_key: 0,
    }

    const s1 = line.Sectors?.[0]
    const s2 = line.Sectors?.[1]
    const s3 = line.Sectors?.[2]

    const lastLap: Lap = {
      driver_number: parseInt(num),
      lap_duration: parseLapTime(line.LastLapTime?.Value),
      duration_sector_1: parseLapTime(s1?.Value || s1?.PreviousValue),
      duration_sector_2: parseLapTime(s2?.Value || s2?.PreviousValue),
      duration_sector_3: parseLapTime(s3?.Value || s3?.PreviousValue),
      i1_speed: line.Speeds?.I1?.Value ? parseInt(line.Speeds.I1.Value) : null,
      i2_speed: line.Speeds?.I2?.Value ? parseInt(line.Speeds.I2.Value) : null,
      st_speed: line.Speeds?.ST?.Value ? parseInt(line.Speeds.ST.Value) : null,
      lap_number: line.NumberOfLaps || 0,
      is_pit_out_lap: !!line.PitOut,
      segments_sector_1: toArray(s1?.Segments).map((s: any) => s.Status),
      segments_sector_2: toArray(s2?.Segments).map((s: any) => s.Status),
      segments_sector_3: toArray(s3?.Segments).map((s: any) => s.Status),
      date_start: '',
      session_key: 0,
      meeting_key: 0,
    }

    const stintData: Stint | null = currentStint ? {
      compound: currentStint.Compound || 'UNKNOWN',
      driver_number: parseInt(num),
      lap_start: (currentStint.StartLaps || 0) + 1,
      lap_end: (currentStint.StartLaps || 0) + (currentStint.TotalLaps || 0),
      stint_number: stints.length,
      tyre_age_at_start: 0,
      session_key: 0,
      meeting_key: 0,
    } : null

    const gapRaw = typeof line.GapToLeader === 'object'
      ? line.GapToLeader?.Value
      : (line.GapToLeader ?? line.TimeDiffToFastest)
    const intervalRaw = typeof line.IntervalToPositionAhead === 'object'
      ? line.IntervalToPositionAhead?.Value
      : (line.IntervalToPositionAhead ?? line.TimeDiffToPositionAhead)

    entries.push({
      position: parseInt(line.Position) || line.Line || 99,
      driver,
      interval: intervalRaw ? parseLapTime(intervalRaw) ?? intervalRaw : null,
      gapToLeader: gapRaw ? parseLapTime(gapRaw) ?? gapRaw : null,
      lastLap,
      bestLapTime: parseLapTime(line.BestLapTime?.Value),
      isOverallBest: false,
      currentStint: stintData,
      tyreAge: currentStint?.TotalLaps || 0,
      lapNumber: line.NumberOfLaps || 0,
    })
  }

  const validTimes = entries.filter(e => e.bestLapTime != null && e.bestLapTime > 0)
  const overallBest = validTimes.length > 0
    ? Math.min(...validTimes.map(e => e.bestLapTime!))
    : Infinity

  entries.forEach(e => {
    e.isOverallBest = e.bestLapTime != null && e.bestLapTime === overallBest
  })

  return entries.sort((a, b) => a.position - b.position)
}

// --- Extract lap count from LapCount topic ---

export function extractLapCount(raw: any): { current: number; total: number } | null {
  if (!raw) return null
  return {
    current: parseInt(raw.CurrentLap) || 0,
    total: parseInt(raw.TotalLaps) || 0,
  }
}

// --- Build PitStops from TimingData pit events ---

export function buildPitStopsFromLT(
  timingData: any,
  driverList: Record<string, any>,
): PitStop[] {
  const lines = timingData?.Lines
  if (!lines) return []

  const stops: PitStop[] = []
  for (const [num, line] of Object.entries<any>(lines)) {
    if (!driverList[num]) continue
    if (line.InPit || line.PitOut) {
      stops.push({
        date: new Date().toISOString(),
        driver_number: parseInt(num),
        lane_duration: parseLapTime(line.LastLapTime?.Value) || 0,
        lap_number: line.NumberOfLaps || 0,
        stop_duration: null,
        session_key: 0,
        meeting_key: 0,
      })
    }
  }
  return stops
}
