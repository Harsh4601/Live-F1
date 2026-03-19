import { TRACK_COORDINATES } from './trackData'

export interface TrackPoint {
  x: number
  y: number
}

export interface TrackData {
  name: string
  points: TrackPoint[]
  sector1End: number
  sector2End: number
}

function geoToXY(coords: number[][]): TrackPoint[] {
  return coords.map(([lng, lat]) => ({ x: lng, y: -lat }))
}

const CIRCUIT_NAMES: Record<string, string> = {
  'Melbourne': 'Albert Park Circuit',
  'Shanghai': 'Shanghai International Circuit',
  'Suzuka': 'Suzuka International Racing Course',
  'Bahrain': 'Bahrain International Circuit',
  'Jeddah': 'Jeddah Corniche Circuit',
  'Miami': 'Miami International Autodrome',
  'Montreal': 'Circuit Gilles-Villeneuve',
  'Monaco': 'Circuit de Monaco',
  'Barcelona': 'Circuit de Barcelona-Catalunya',
  'Austria': 'Red Bull Ring',
  'Silverstone': 'Silverstone Circuit',
  'Spa': 'Circuit de Spa-Francorchamps',
  'Budapest': 'Hungaroring',
  'Zandvoort': 'Circuit Zandvoort',
  'Monza': 'Autodromo Nazionale Monza',
  'Baku': 'Baku City Circuit',
  'Singapore': 'Marina Bay Street Circuit',
  'Austin': 'Circuit of the Americas',
  'Mexico City': 'Autodromo Hermanos Rodriguez',
  'Sao Paulo': 'Autodromo Jose Carlos Pace',
  'Las Vegas': 'Las Vegas Strip Circuit',
  'Qatar': 'Lusail International Circuit',
  'Abu Dhabi': 'Yas Marina Circuit',
  'Madrid': 'IFEMA Madrid Circuit',
}

const CIRCUIT_ALIASES: Record<string, string> = {
  'albert park': 'Melbourne',
  'melbourne': 'Melbourne',
  'shanghai': 'Shanghai',
  'suzuka': 'Suzuka',
  'bahrain': 'Bahrain',
  'sakhir': 'Bahrain',
  'jeddah': 'Jeddah',
  'miami': 'Miami',
  'montreal': 'Montreal',
  'monaco': 'Monaco',
  'barcelona': 'Barcelona',
  'catalunya': 'Barcelona',
  'spielberg': 'Austria',
  'austria': 'Austria',
  'red bull ring': 'Austria',
  'silverstone': 'Silverstone',
  'spa': 'Spa',
  'spa-francorchamps': 'Spa',
  'budapest': 'Budapest',
  'hungaroring': 'Budapest',
  'zandvoort': 'Zandvoort',
  'monza': 'Monza',
  'baku': 'Baku',
  'singapore': 'Singapore',
  'marina bay': 'Singapore',
  'austin': 'Austin',
  'cota': 'Austin',
  'mexico': 'Mexico City',
  'mexico city': 'Mexico City',
  'sao paulo': 'Sao Paulo',
  'são paulo': 'Sao Paulo',
  'interlagos': 'Sao Paulo',
  'las vegas': 'Las Vegas',
  'qatar': 'Qatar',
  'lusail': 'Qatar',
  'abu dhabi': 'Abu Dhabi',
  'yas marina': 'Abu Dhabi',
  'madrid': 'Madrid',
}

function resolveCircuitKey(input?: string): string | null {
  if (!input) return null
  const lower = input.toLowerCase()

  if (TRACK_COORDINATES[input]) return input

  const alias = CIRCUIT_ALIASES[lower]
  if (alias) return alias

  for (const [key] of Object.entries(TRACK_COORDINATES)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return key
    }
  }

  for (const [pattern, key] of Object.entries(CIRCUIT_ALIASES)) {
    if (lower.includes(pattern)) return key
  }

  return null
}

export function getResolvedTrackKey(input?: string): string | null {
  return resolveCircuitKey(input)
}

export function getTrackData(circuitName?: string): TrackData | null {
  const key = resolveCircuitKey(circuitName)
  if (!key) return null

  const coords = TRACK_COORDINATES[key]
  if (!coords) return null

  return {
    name: CIRCUIT_NAMES[key] || key,
    points: geoToXY(coords),
    sector1End: 0.28,
    sector2End: 0.60,
  }
}

export function getTrackDataByKey(circuitKey: string): TrackData | null {
  const coords = TRACK_COORDINATES[circuitKey]
  if (!coords) return null

  return {
    name: CIRCUIT_NAMES[circuitKey] || circuitKey,
    points: geoToXY(coords),
    sector1End: 0.28,
    sector2End: 0.60,
  }
}

export function computeCumulativeDistances(points: TrackPoint[]): number[] {
  const dists = [0]
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dy = points[i].y - points[i - 1].y
    dists.push(dists[i - 1] + Math.sqrt(dx * dx + dy * dy))
  }
  return dists
}

export function getPointAtFraction(
  points: TrackPoint[],
  cumDists: number[],
  fraction: number,
): TrackPoint {
  const totalLen = cumDists[cumDists.length - 1]
  const targetDist = fraction * totalLen

  for (let i = 1; i < cumDists.length; i++) {
    if (cumDists[i] >= targetDist) {
      const segLen = cumDists[i] - cumDists[i - 1]
      if (segLen === 0) return points[i]
      const t = (targetDist - cumDists[i - 1]) / segLen
      return {
        x: points[i - 1].x + t * (points[i].x - points[i - 1].x),
        y: points[i - 1].y + t * (points[i].y - points[i - 1].y),
      }
    }
  }
  return points[points.length - 1]
}
