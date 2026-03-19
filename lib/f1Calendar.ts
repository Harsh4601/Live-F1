export interface F1Session {
  name: string
  shortName: string
  day: number
  localTime: string // HH:MM in venue local time
}

export interface F1Race {
  round: number
  name: string
  slug: string // URL segment, e.g. "australia", "shanghai"
  country: string
  city: string
  circuitName: string
  circuitKey: string
  dateStart: string
  dateEnd: string
  utcOffset: number // hours from UTC (e.g., +11 for AEDT, -5 for CDT)
  hasSprint: boolean
  flag: string
  sessions: F1Session[]
}

// Compute the UTC Date for a session given the race start date, day offset, local time, and UTC offset
export function getSessionUTC(raceStartDate: string, session: F1Session, utcOffset: number): Date {
  const [hours, minutes] = session.localTime.split(":").map(Number)
  const date = new Date(raceStartDate + "T00:00:00Z")
  date.setUTCDate(date.getUTCDate() + (session.day - 1))
  date.setUTCHours(hours - utcOffset, minutes, 0, 0)
  return date
}

interface SessionTimes {
  fp1: string
  s2: string // FP2 for standard, SQ for sprint
  s3: string // FP3 for standard, SPR for sprint
  q: string
  r: string
}

function std(t: SessionTimes): F1Session[] {
  return [
    { name: "Practice 1", shortName: "FP1", day: 1, localTime: t.fp1 },
    { name: "Practice 2", shortName: "FP2", day: 1, localTime: t.s2 },
    { name: "Practice 3", shortName: "FP3", day: 2, localTime: t.s3 },
    { name: "Qualifying", shortName: "Q", day: 2, localTime: t.q },
    { name: "Race", shortName: "R", day: 3, localTime: t.r },
  ]
}

function spr(t: SessionTimes): F1Session[] {
  return [
    { name: "Practice 1", shortName: "FP1", day: 1, localTime: t.fp1 },
    { name: "Sprint Qualifying", shortName: "SQ", day: 1, localTime: t.s2 },
    { name: "Sprint", shortName: "SPR", day: 2, localTime: t.s3 },
    { name: "Qualifying", shortName: "Q", day: 2, localTime: t.q },
    { name: "Race", shortName: "R", day: 3, localTime: t.r },
  ]
}

// Session time patterns by venue type
const EUROPE_STD   = std({ fp1: "13:30", s2: "17:00", s3: "12:30", q: "16:00", r: "15:00" })
const EUROPE_SPR   = spr({ fp1: "12:30", s2: "16:30", s3: "12:00", q: "16:00", r: "15:00" })
const UK_SPR       = spr({ fp1: "12:30", s2: "16:30", s3: "11:30", q: "15:00", r: "14:00" })
const MIDEAST_NIGHT = std({ fp1: "14:30", s2: "18:00", s3: "14:30", q: "18:00", r: "18:00" })
const JEDDAH_NIGHT = std({ fp1: "16:30", s2: "20:00", s3: "16:30", q: "20:00", r: "20:00" })
const ABU_DHABI    = std({ fp1: "13:30", s2: "17:00", s3: "14:30", q: "18:00", r: "17:00" })
const QATAR        = std({ fp1: "14:30", s2: "18:00", s3: "17:30", q: "21:00", r: "19:00" })
const SINGAPORE_SPR = spr({ fp1: "17:30", s2: "21:30", s3: "16:00", q: "21:00", r: "20:00" })
const AUSTRALIA    = std({ fp1: "12:30", s2: "16:00", s3: "12:30", q: "16:00", r: "15:00" })
const JAPAN        = std({ fp1: "11:30", s2: "15:00", s3: "11:30", q: "15:00", r: "14:00" })
const SHANGHAI_SPR = spr({ fp1: "11:30", s2: "15:30", s3: "11:00", q: "15:00", r: "15:00" })
const MIAMI_SPR    = spr({ fp1: "14:30", s2: "18:30", s3: "12:00", q: "16:00", r: "16:00" })
const MONTREAL_SPR = spr({ fp1: "13:30", s2: "17:30", s3: "12:00", q: "16:00", r: "14:00" })
const AMERICAS_CDT = std({ fp1: "12:30", s2: "16:00", s3: "12:30", q: "16:00", r: "14:00" })
const BRAZIL       = std({ fp1: "11:30", s2: "15:00", s3: "11:30", q: "15:00", r: "14:00" })
const LAS_VEGAS    = std({ fp1: "18:30", s2: "22:00", s3: "18:30", q: "22:00", r: "22:00" })
const ZANDVOORT_SPR = spr({ fp1: "12:30", s2: "16:30", s3: "12:00", q: "16:00", r: "15:00" })

export const F1_2026_CALENDAR: F1Race[] = [
  {
    round: 1, name: "Australian Grand Prix", slug: "australia", country: "Australia", city: "Melbourne",
    circuitName: "Albert Park Circuit", circuitKey: "Melbourne",
    dateStart: "2026-03-06", dateEnd: "2026-03-08", utcOffset: 11,
    hasSprint: false, flag: "🇦🇺", sessions: AUSTRALIA,
  },
  {
    round: 2, name: "Chinese Grand Prix", slug: "shanghai", country: "China", city: "Shanghai",
    circuitName: "Shanghai International Circuit", circuitKey: "Shanghai",
    dateStart: "2026-03-13", dateEnd: "2026-03-15", utcOffset: 8,
    hasSprint: true, flag: "🇨🇳", sessions: SHANGHAI_SPR,
  },
  {
    round: 3, name: "Japanese Grand Prix", slug: "suzuka", country: "Japan", city: "Suzuka",
    circuitName: "Suzuka International Racing Course", circuitKey: "Suzuka",
    dateStart: "2026-03-27", dateEnd: "2026-03-29", utcOffset: 9,
    hasSprint: false, flag: "🇯🇵", sessions: JAPAN,
  },
  {
    round: 4, name: "Bahrain Grand Prix", slug: "bahrain", country: "Bahrain", city: "Sakhir",
    circuitName: "Bahrain International Circuit", circuitKey: "Bahrain",
    dateStart: "2026-04-10", dateEnd: "2026-04-12", utcOffset: 3,
    hasSprint: false, flag: "🇧🇭", sessions: MIDEAST_NIGHT,
  },
  {
    round: 5, name: "Saudi Arabian Grand Prix", slug: "jeddah", country: "Saudi Arabia", city: "Jeddah",
    circuitName: "Jeddah Corniche Circuit", circuitKey: "Jeddah",
    dateStart: "2026-04-17", dateEnd: "2026-04-19", utcOffset: 3,
    hasSprint: false, flag: "🇸🇦", sessions: JEDDAH_NIGHT,
  },
  {
    round: 6, name: "Miami Grand Prix", slug: "miami", country: "USA", city: "Miami",
    circuitName: "Miami International Autodrome", circuitKey: "Miami",
    dateStart: "2026-05-01", dateEnd: "2026-05-03", utcOffset: -4,
    hasSprint: true, flag: "🇺🇸", sessions: MIAMI_SPR,
  },
  {
    round: 7, name: "Canadian Grand Prix", slug: "montreal", country: "Canada", city: "Montreal",
    circuitName: "Circuit Gilles-Villeneuve", circuitKey: "Montreal",
    dateStart: "2026-05-22", dateEnd: "2026-05-24", utcOffset: -4,
    hasSprint: true, flag: "🇨🇦", sessions: MONTREAL_SPR,
  },
  {
    round: 8, name: "Monaco Grand Prix", slug: "monaco", country: "Monaco", city: "Monaco",
    circuitName: "Circuit de Monaco", circuitKey: "Monaco",
    dateStart: "2026-06-05", dateEnd: "2026-06-07", utcOffset: 2,
    hasSprint: false, flag: "🇲🇨", sessions: EUROPE_STD,
  },
  {
    round: 9, name: "Spanish Grand Prix", slug: "barcelona", country: "Spain", city: "Barcelona",
    circuitName: "Circuit de Barcelona-Catalunya", circuitKey: "Barcelona",
    dateStart: "2026-06-12", dateEnd: "2026-06-14", utcOffset: 2,
    hasSprint: false, flag: "🇪🇸", sessions: EUROPE_STD,
  },
  {
    round: 10, name: "Austrian Grand Prix", slug: "austria", country: "Austria", city: "Spielberg",
    circuitName: "Red Bull Ring", circuitKey: "Austria",
    dateStart: "2026-06-26", dateEnd: "2026-06-28", utcOffset: 2,
    hasSprint: false, flag: "🇦🇹", sessions: EUROPE_STD,
  },
  {
    round: 11, name: "British Grand Prix", slug: "silverstone", country: "UK", city: "Silverstone",
    circuitName: "Silverstone Circuit", circuitKey: "Silverstone",
    dateStart: "2026-07-03", dateEnd: "2026-07-05", utcOffset: 1,
    hasSprint: true, flag: "🇬🇧", sessions: UK_SPR,
  },
  {
    round: 12, name: "Belgian Grand Prix", slug: "spa", country: "Belgium", city: "Spa-Francorchamps",
    circuitName: "Circuit de Spa-Francorchamps", circuitKey: "Spa",
    dateStart: "2026-07-17", dateEnd: "2026-07-19", utcOffset: 2,
    hasSprint: false, flag: "🇧🇪", sessions: EUROPE_STD,
  },
  {
    round: 13, name: "Hungarian Grand Prix", slug: "budapest", country: "Hungary", city: "Budapest",
    circuitName: "Hungaroring", circuitKey: "Budapest",
    dateStart: "2026-07-24", dateEnd: "2026-07-26", utcOffset: 2,
    hasSprint: false, flag: "🇭🇺", sessions: EUROPE_STD,
  },
  {
    round: 14, name: "Dutch Grand Prix", slug: "zandvoort", country: "Netherlands", city: "Zandvoort",
    circuitName: "Circuit Zandvoort", circuitKey: "Zandvoort",
    dateStart: "2026-08-21", dateEnd: "2026-08-23", utcOffset: 2,
    hasSprint: true, flag: "🇳🇱", sessions: ZANDVOORT_SPR,
  },
  {
    round: 15, name: "Italian Grand Prix", slug: "monza", country: "Italy", city: "Monza",
    circuitName: "Autodromo Nazionale Monza", circuitKey: "Monza",
    dateStart: "2026-09-04", dateEnd: "2026-09-06", utcOffset: 2,
    hasSprint: false, flag: "🇮🇹", sessions: EUROPE_STD,
  },
  {
    round: 16, name: "Spanish Grand Prix", slug: "madrid", country: "Spain", city: "Madrid",
    circuitName: "IFEMA Madrid Circuit", circuitKey: "Madrid",
    dateStart: "2026-09-11", dateEnd: "2026-09-13", utcOffset: 2,
    hasSprint: false, flag: "🇪🇸", sessions: EUROPE_STD,
  },
  {
    round: 17, name: "Azerbaijan Grand Prix", slug: "baku", country: "Azerbaijan", city: "Baku",
    circuitName: "Baku City Circuit", circuitKey: "Baku",
    dateStart: "2026-09-24", dateEnd: "2026-09-26", utcOffset: 4,
    hasSprint: false, flag: "🇦🇿",
    sessions: std({ fp1: "13:30", s2: "17:00", s3: "13:30", q: "17:00", r: "15:00" }),
  },
  {
    round: 18, name: "Singapore Grand Prix", slug: "singapore", country: "Singapore", city: "Singapore",
    circuitName: "Marina Bay Street Circuit", circuitKey: "Singapore",
    dateStart: "2026-10-09", dateEnd: "2026-10-11", utcOffset: 8,
    hasSprint: true, flag: "🇸🇬", sessions: SINGAPORE_SPR,
  },
  {
    round: 19, name: "United States Grand Prix", slug: "austin", country: "USA", city: "Austin",
    circuitName: "Circuit of the Americas", circuitKey: "Austin",
    dateStart: "2026-10-23", dateEnd: "2026-10-25", utcOffset: -5,
    hasSprint: false, flag: "🇺🇸", sessions: AMERICAS_CDT,
  },
  {
    round: 20, name: "Mexico City Grand Prix", slug: "mexico", country: "Mexico", city: "Mexico City",
    circuitName: "Autodromo Hermanos Rodriguez", circuitKey: "Mexico City",
    dateStart: "2026-10-30", dateEnd: "2026-11-01", utcOffset: -6,
    hasSprint: false, flag: "🇲🇽", sessions: AMERICAS_CDT,
  },
  {
    round: 21, name: "São Paulo Grand Prix", slug: "sao-paulo", country: "Brazil", city: "São Paulo",
    circuitName: "Autodromo Jose Carlos Pace", circuitKey: "São Paulo",
    dateStart: "2026-11-06", dateEnd: "2026-11-08", utcOffset: -3,
    hasSprint: false, flag: "🇧🇷", sessions: BRAZIL,
  },
  {
    round: 22, name: "Las Vegas Grand Prix", slug: "las-vegas", country: "USA", city: "Las Vegas",
    circuitName: "Las Vegas Strip Circuit", circuitKey: "Las Vegas",
    dateStart: "2026-11-19", dateEnd: "2026-11-21", utcOffset: -8,
    hasSprint: false, flag: "🇺🇸", sessions: LAS_VEGAS,
  },
  {
    round: 23, name: "Qatar Grand Prix", slug: "qatar", country: "Qatar", city: "Lusail",
    circuitName: "Lusail International Circuit", circuitKey: "Qatar",
    dateStart: "2026-11-27", dateEnd: "2026-11-29", utcOffset: 3,
    hasSprint: false, flag: "🇶🇦", sessions: QATAR,
  },
  {
    round: 24, name: "Abu Dhabi Grand Prix", slug: "abu-dhabi", country: "UAE", city: "Abu Dhabi",
    circuitName: "Yas Marina Circuit", circuitKey: "Abu Dhabi",
    dateStart: "2026-12-04", dateEnd: "2026-12-06", utcOffset: 4,
    hasSprint: false, flag: "🇦🇪", sessions: ABU_DHABI,
  },
]

export function getRaceByRound(round: number): F1Race | undefined {
  return F1_2026_CALENDAR.find((race) => race.round === round)
}

export function getRaceBySlug(slug: string): F1Race | undefined {
  return F1_2026_CALENDAR.find((race) => race.slug === slug)
}

export const RACE_SLUGS = F1_2026_CALENDAR.map((r) => r.slug)

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
