import { TRACK_COORDINATES } from "./trackData"

export interface F1Session {
  name: string
  shortName: string
  day: number
}

export interface F1Race {
  round: number
  name: string
  country: string
  city: string
  circuitName: string
  circuitKey: string
  dateStart: string
  dateEnd: string
  hasSprint: boolean
  flag: string
  sessions: F1Session[]
}

const STANDARD_SESSIONS: F1Session[] = [
  { name: "Practice 1", shortName: "FP1", day: 1 },
  { name: "Practice 2", shortName: "FP2", day: 1 },
  { name: "Practice 3", shortName: "FP3", day: 2 },
  { name: "Qualifying", shortName: "Q", day: 2 },
  { name: "Race", shortName: "R", day: 3 },
]

const SPRINT_SESSIONS: F1Session[] = [
  { name: "Practice 1", shortName: "FP1", day: 1 },
  { name: "Sprint Qualifying", shortName: "SQ", day: 1 },
  { name: "Sprint", shortName: "SPR", day: 2 },
  { name: "Qualifying", shortName: "Q", day: 2 },
  { name: "Race", shortName: "R", day: 3 },
]

export const F1_2026_CALENDAR: F1Race[] = [
  {
    round: 1,
    name: "Australian Grand Prix",
    country: "Australia",
    city: "Melbourne",
    circuitName: "Albert Park Circuit",
    circuitKey: "Melbourne",
    dateStart: "2026-03-06",
    dateEnd: "2026-03-08",
    hasSprint: false,
    flag: "🇦🇺",
    sessions: STANDARD_SESSIONS,
  },
  {
    round: 2,
    name: "Chinese Grand Prix",
    country: "China",
    city: "Shanghai",
    circuitName: "Shanghai International Circuit",
    circuitKey: "Shanghai",
    dateStart: "2026-03-13",
    dateEnd: "2026-03-15",
    hasSprint: true,
    flag: "🇨🇳",
    sessions: SPRINT_SESSIONS,
  },
  {
    round: 3,
    name: "Japanese Grand Prix",
    country: "Japan",
    city: "Suzuka",
    circuitName: "Suzuka International Racing Course",
    circuitKey: "Suzuka",
    dateStart: "2026-03-27",
    dateEnd: "2026-03-29",
    hasSprint: false,
    flag: "🇯🇵",
    sessions: STANDARD_SESSIONS,
  },
  {
    round: 4,
    name: "Bahrain Grand Prix",
    country: "Bahrain",
    city: "Sakhir",
    circuitName: "Bahrain International Circuit",
    circuitKey: "Bahrain",
    dateStart: "2026-04-10",
    dateEnd: "2026-04-12",
    hasSprint: false,
    flag: "🇧🇭",
    sessions: STANDARD_SESSIONS,
  },
  {
    round: 5,
    name: "Saudi Arabian Grand Prix",
    country: "Saudi Arabia",
    city: "Jeddah",
    circuitName: "Jeddah Corniche Circuit",
    circuitKey: "Jeddah",
    dateStart: "2026-04-17",
    dateEnd: "2026-04-19",
    hasSprint: false,
    flag: "🇸🇦",
    sessions: STANDARD_SESSIONS,
  },
  {
    round: 6,
    name: "Miami Grand Prix",
    country: "USA",
    city: "Miami",
    circuitName: "Miami International Autodrome",
    circuitKey: "Miami",
    dateStart: "2026-05-01",
    dateEnd: "2026-05-03",
    hasSprint: true,
    flag: "🇺🇸",
    sessions: SPRINT_SESSIONS,
  },
  {
    round: 7,
    name: "Canadian Grand Prix",
    country: "Canada",
    city: "Montreal",
    circuitName: "Circuit Gilles-Villeneuve",
    circuitKey: "Montreal",
    dateStart: "2026-05-22",
    dateEnd: "2026-05-24",
    hasSprint: true,
    flag: "🇨🇦",
    sessions: SPRINT_SESSIONS,
  },
  {
    round: 8,
    name: "Monaco Grand Prix",
    country: "Monaco",
    city: "Monaco",
    circuitName: "Circuit de Monaco",
    circuitKey: "Monaco",
    dateStart: "2026-06-05",
    dateEnd: "2026-06-07",
    hasSprint: false,
    flag: "🇲🇨",
    sessions: STANDARD_SESSIONS,
  },
  {
    round: 9,
    name: "Spanish Grand Prix",
    country: "Spain",
    city: "Barcelona",
    circuitName: "Circuit de Barcelona-Catalunya",
    circuitKey: "Barcelona",
    dateStart: "2026-06-12",
    dateEnd: "2026-06-14",
    hasSprint: false,
    flag: "🇪🇸",
    sessions: STANDARD_SESSIONS,
  },
  {
    round: 10,
    name: "Austrian Grand Prix",
    country: "Austria",
    city: "Spielberg",
    circuitName: "Red Bull Ring",
    circuitKey: "Austria",
    dateStart: "2026-06-26",
    dateEnd: "2026-06-28",
    hasSprint: false,
    flag: "🇦🇹",
    sessions: STANDARD_SESSIONS,
  },
  {
    round: 11,
    name: "British Grand Prix",
    country: "UK",
    city: "Silverstone",
    circuitName: "Silverstone Circuit",
    circuitKey: "Silverstone",
    dateStart: "2026-07-03",
    dateEnd: "2026-07-05",
    hasSprint: true,
    flag: "🇬🇧",
    sessions: SPRINT_SESSIONS,
  },
  {
    round: 12,
    name: "Belgian Grand Prix",
    country: "Belgium",
    city: "Spa-Francorchamps",
    circuitName: "Circuit de Spa-Francorchamps",
    circuitKey: "Spa",
    dateStart: "2026-07-17",
    dateEnd: "2026-07-19",
    hasSprint: false,
    flag: "🇧🇪",
    sessions: STANDARD_SESSIONS,
  },
  {
    round: 13,
    name: "Hungarian Grand Prix",
    country: "Hungary",
    city: "Budapest",
    circuitName: "Hungaroring",
    circuitKey: "Budapest",
    dateStart: "2026-07-24",
    dateEnd: "2026-07-26",
    hasSprint: false,
    flag: "🇭🇺",
    sessions: STANDARD_SESSIONS,
  },
  {
    round: 14,
    name: "Dutch Grand Prix",
    country: "Netherlands",
    city: "Zandvoort",
    circuitName: "Circuit Zandvoort",
    circuitKey: "Zandvoort",
    dateStart: "2026-08-21",
    dateEnd: "2026-08-23",
    hasSprint: true,
    flag: "🇳🇱",
    sessions: SPRINT_SESSIONS,
  },
  {
    round: 15,
    name: "Italian Grand Prix",
    country: "Italy",
    city: "Monza",
    circuitName: "Autodromo Nazionale Monza",
    circuitKey: "Monza",
    dateStart: "2026-09-04",
    dateEnd: "2026-09-06",
    hasSprint: false,
    flag: "🇮🇹",
    sessions: STANDARD_SESSIONS,
  },
  {
    round: 16,
    name: "Spanish Grand Prix",
    country: "Spain",
    city: "Madrid",
    circuitName: "IFEMA Madrid Circuit",
    circuitKey: "Madrid",
    dateStart: "2026-09-11",
    dateEnd: "2026-09-13",
    hasSprint: false,
    flag: "🇪🇸",
    sessions: STANDARD_SESSIONS,
  },
  {
    round: 17,
    name: "Azerbaijan Grand Prix",
    country: "Azerbaijan",
    city: "Baku",
    circuitName: "Baku City Circuit",
    circuitKey: "Baku",
    dateStart: "2026-09-24",
    dateEnd: "2026-09-26",
    hasSprint: false,
    flag: "🇦🇿",
    sessions: STANDARD_SESSIONS,
  },
  {
    round: 18,
    name: "Singapore Grand Prix",
    country: "Singapore",
    city: "Singapore",
    circuitName: "Marina Bay Street Circuit",
    circuitKey: "Singapore",
    dateStart: "2026-10-09",
    dateEnd: "2026-10-11",
    hasSprint: true,
    flag: "🇸🇬",
    sessions: SPRINT_SESSIONS,
  },
  {
    round: 19,
    name: "United States Grand Prix",
    country: "USA",
    city: "Austin",
    circuitName: "Circuit of the Americas",
    circuitKey: "Austin",
    dateStart: "2026-10-23",
    dateEnd: "2026-10-25",
    hasSprint: false,
    flag: "🇺🇸",
    sessions: STANDARD_SESSIONS,
  },
  {
    round: 20,
    name: "Mexico City Grand Prix",
    country: "Mexico",
    city: "Mexico City",
    circuitName: "Autodromo Hermanos Rodriguez",
    circuitKey: "Mexico City",
    dateStart: "2026-10-30",
    dateEnd: "2026-11-01",
    hasSprint: false,
    flag: "🇲🇽",
    sessions: STANDARD_SESSIONS,
  },
  {
    round: 21,
    name: "São Paulo Grand Prix",
    country: "Brazil",
    city: "São Paulo",
    circuitName: "Autodromo Jose Carlos Pace",
    circuitKey: "São Paulo",
    dateStart: "2026-11-06",
    dateEnd: "2026-11-08",
    hasSprint: false,
    flag: "🇧🇷",
    sessions: STANDARD_SESSIONS,
  },
  {
    round: 22,
    name: "Las Vegas Grand Prix",
    country: "USA",
    city: "Las Vegas",
    circuitName: "Las Vegas Strip Circuit",
    circuitKey: "Las Vegas",
    dateStart: "2026-11-19",
    dateEnd: "2026-11-21",
    hasSprint: false,
    flag: "🇺🇸",
    sessions: STANDARD_SESSIONS,
  },
  {
    round: 23,
    name: "Qatar Grand Prix",
    country: "Qatar",
    city: "Lusail",
    circuitName: "Lusail International Circuit",
    circuitKey: "Qatar",
    dateStart: "2026-11-27",
    dateEnd: "2026-11-29",
    hasSprint: false,
    flag: "🇶🇦",
    sessions: STANDARD_SESSIONS,
  },
  {
    round: 24,
    name: "Abu Dhabi Grand Prix",
    country: "UAE",
    city: "Abu Dhabi",
    circuitName: "Yas Marina Circuit",
    circuitKey: "Abu Dhabi",
    dateStart: "2026-12-04",
    dateEnd: "2026-12-06",
    hasSprint: false,
    flag: "🇦🇪",
    sessions: STANDARD_SESSIONS,
  },
]

export function getRaceByRound(round: number): F1Race | undefined {
  return F1_2026_CALENDAR.find((race) => race.round === round)
}

export function getCurrentOrNextRace(): F1Race {
  const today = new Date().toISOString().split("T")[0]
  const current = F1_2026_CALENDAR.find(
    (race) => today >= race.dateStart && today <= race.dateEnd,
  )
  if (current) return current

  const upcoming = F1_2026_CALENDAR.find((race) => race.dateStart > today)
  if (upcoming) return upcoming

  return F1_2026_CALENDAR[F1_2026_CALENDAR.length - 1]
}

export function getTrackCoordinates(circuitKey: string): number[][] | null {
  return TRACK_COORDINATES[circuitKey] ?? null
}

export { TRACK_COORDINATES }
