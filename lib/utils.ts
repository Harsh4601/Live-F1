export function formatLapTime(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return '\u2014'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins > 0) {
    return `${mins}:${secs.toFixed(3).padStart(6, '0')}`
  }
  return secs.toFixed(3)
}

export function formatGap(gap: number | string | null | undefined): string {
  if (gap == null) return '\u2014'
  if (typeof gap === 'string') return gap
  if (gap === 0) return 'LEADER'
  return `+${gap.toFixed(3)}`
}

export function formatInterval(interval: number | string | null | undefined): string {
  if (interval == null) return '\u2014'
  if (typeof interval === 'string') return interval
  return `+${interval.toFixed(3)}`
}

export function formatSectorTime(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return '\u2014'
  return seconds.toFixed(3)
}

export function getTyreColor(compound: string | undefined): string {
  switch (compound?.toUpperCase()) {
    case 'SOFT': return '#FF1801'
    case 'MEDIUM': return '#FFF200'
    case 'HARD': return '#FFFFFF'
    case 'INTERMEDIATE': return '#39B54A'
    case 'WET': return '#0067FF'
    default: return '#555555'
  }
}

export function getTyreLabel(compound: string | undefined): string {
  switch (compound?.toUpperCase()) {
    case 'SOFT': return 'S'
    case 'MEDIUM': return 'M'
    case 'HARD': return 'H'
    case 'INTERMEDIATE': return 'I'
    case 'WET': return 'W'
    default: return '?'
  }
}

export function getFlagColor(flag: string | null | undefined): string {
  switch (flag?.toUpperCase()) {
    case 'GREEN': return '#22C55E'
    case 'YELLOW': return '#EAB308'
    case 'DOUBLE YELLOW': return '#F59E0B'
    case 'RED': return '#EF4444'
    case 'CHEQUERED': return '#FFFFFF'
    case 'BLACK AND WHITE': return '#9CA3AF'
    case 'BLUE': return '#3B82F6'
    default: return '#6B7280'
  }
}

export function getLatestPerDriver<T extends { driver_number: number }>(
  data: T[] | undefined
): Record<number, T> {
  if (!data) return {}
  const map: Record<number, T> = {}
  for (const item of data) {
    map[item.driver_number] = item
  }
  return map
}

export function getLatestStintPerDriver(
  stints: { driver_number: number; stint_number: number; [k: string]: unknown }[] | undefined
): Record<number, typeof stints extends (infer U)[] | undefined ? U : never> {
  if (!stints) return {}
  const map: Record<number, (typeof stints)[number]> = {}
  for (const stint of stints) {
    const existing = map[stint.driver_number]
    if (!existing || stint.stint_number > existing.stint_number) {
      map[stint.driver_number] = stint
    }
  }
  return map
}

export function getBestLapPerDriver(
  laps: { driver_number: number; lap_duration: number | null; is_pit_out_lap: boolean }[] | undefined
): Record<number, number> {
  if (!laps) return {}
  const map: Record<number, number> = {}
  for (const lap of laps) {
    if (lap.lap_duration && lap.lap_duration > 0 && !lap.is_pit_out_lap) {
      const existing = map[lap.driver_number]
      if (!existing || lap.lap_duration < existing) {
        map[lap.driver_number] = lap.lap_duration
      }
    }
  }
  return map
}
