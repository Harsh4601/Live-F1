import { NextRequest, NextResponse } from 'next/server'
import { F1_2026_CALENDAR } from '@/lib/f1Calendar'

const LT_BASE = 'https://livetiming.formula1.com/static'

interface DiscoveredSession {
  name: string
  path: string
  type: string
  status: string
  startDate: string
}

// dayOffsets relative to Race day (0).
// Sprint weekends: P1 + Sprint Qualifying on day 1 (offset -2), Sprint + Qualifying on day 2 (-1).
// We probe both -2 and -1 for ambiguous sessions so the correct one is found regardless of format.
const SESSION_TEMPLATES = [
  { name: 'Practice 1',        type: 'Practice',          suffix: 'Practice_1',        tryOffsets: [-2, -1] },
  { name: 'Practice 2',        type: 'Practice',          suffix: 'Practice_2',        tryOffsets: [-2, -1] },
  { name: 'Practice 3',        type: 'Practice',          suffix: 'Practice_3',        tryOffsets: [-1, -2] },
  { name: 'Sprint Qualifying', type: 'Sprint Qualifying', suffix: 'Sprint_Qualifying', tryOffsets: [-2, -1] },
  { name: 'Sprint',            type: 'Sprint',            suffix: 'Sprint',            tryOffsets: [-1, -2] },
  { name: 'Qualifying',        type: 'Qualifying',        suffix: 'Qualifying',        tryOffsets: [-1, -2] },
  { name: 'Race',              type: 'Race',              suffix: 'Race',              tryOffsets: [0, -1]  },
]

export const dynamic = 'force-dynamic'

// Normalise a race name to the underscore format F1 CDN uses in folder names.
// e.g. "Australian Grand Prix" → "Australian_Grand_Prix"
//      "São Paulo Grand Prix"  → "Sao_Paulo_Grand_Prix"
function normaliseMeetingName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics (ã → a, é → e, etc.)
    .replace(/[^a-zA-Z0-9\s]/g, '')  // remove non-alphanumeric
    .trim()
    .replace(/\s+/g, '_')
}

// Probe one session template across all its candidate day-offsets in parallel.
async function probeTemplate(
  meetingBase: string,
  raceDate: Date,
  tmpl: (typeof SESSION_TEMPLATES)[number],
): Promise<DiscoveredSession | null> {
  const results = await Promise.all(
    tmpl.tryOffsets.map(async (offset) => {
      const d = new Date(raceDate)
      d.setUTCDate(d.getUTCDate() + offset)
      const dateStr = d.toISOString().split('T')[0]
      const sessionPath = `${meetingBase}${dateStr}_${tmpl.suffix}/`
      try {
        const res = await fetch(`${LT_BASE}/${sessionPath}SessionInfo.json`, {
          signal: AbortSignal.timeout(6000),
        })
        if (!res.ok) return null
        const info = await res.json()
        return {
          name: info.Name || tmpl.name,
          path: sessionPath,
          type: info.Type || tmpl.type,
          status: info.SessionStatus || 'Unknown',
          startDate: info.StartDate || '',
        } as DiscoveredSession
      } catch {
        return null
      }
    }),
  )
  return results.find(Boolean) ?? null
}

// Derive meeting base + race date from a calendar slug.
function meetingInfoFromSlug(slug: string): { meetingBase: string; raceDate: Date } | null {
  const race = F1_2026_CALENDAR.find((r) => r.slug === slug)
  if (!race) return null
  const year = race.dateEnd.split('-')[0]
  const meetingName = normaliseMeetingName(race.name)
  const meetingBase = `${year}/${race.dateEnd}_${meetingName}/`
  const raceDate = new Date(race.dateEnd + 'T12:00:00Z')
  return { meetingBase, raceDate }
}

// Derive meeting base + race date from the live CDN SessionInfo.json.
async function meetingInfoFromCDN(): Promise<{
  meetingBase: string
  raceDate: Date
  meeting: any
} | null> {
  const infoRes = await fetch(`${LT_BASE}/SessionInfo.json`, { cache: 'no-store' })
  if (!infoRes.ok) return null
  const sessionInfo = await infoRes.json()
  const meetingPath: string = sessionInfo.Path ?? ''
  const pathParts = meetingPath.replace(/\/$/, '').split('/')
  const meetingBase = pathParts.slice(0, 2).join('/') + '/'

  // The meeting folder prefix IS the race date on the F1 CDN.
  const meetingFolderDate = pathParts[1]?.split('_')[0] ?? ''
  const raceDateFromPath = meetingFolderDate.match(/^\d{4}-\d{2}-\d{2}$/)
    ? new Date(meetingFolderDate + 'T12:00:00Z')
    : null

  // Fallback: adjust sessionInfo.StartDate based on the current session type.
  const currentSessionFolder = pathParts[2] ?? ''
  let raceDateFallback = new Date(sessionInfo.StartDate)
  if (currentSessionFolder.includes('Practice_1') || currentSessionFolder.includes('Practice_2')) {
    raceDateFallback.setUTCDate(raceDateFallback.getUTCDate() + 2)
  } else if (
    currentSessionFolder.includes('Practice_3') ||
    currentSessionFolder.includes('Qualifying') ||
    currentSessionFolder.includes('Sprint')
  ) {
    raceDateFallback.setUTCDate(raceDateFallback.getUTCDate() + 1)
  }

  return {
    meetingBase,
    raceDate: raceDateFromPath ?? raceDateFallback,
    meeting: sessionInfo.Meeting,
  }
}

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug')

    let meetingBase: string
    let raceDate: Date
    let meeting: any = null

    if (slug) {
      // Specific race requested — build path from calendar data.
      const info = meetingInfoFromSlug(slug)
      if (!info) {
        return NextResponse.json({ sessions: [] }, { status: 404 })
      }
      meetingBase = info.meetingBase
      raceDate = info.raceDate

      // Also try to get the meeting metadata from CDN for the header (best-effort).
      try {
        const cdnInfo = await fetch(`${LT_BASE}/${meetingBase}SessionInfo.json`, {
          signal: AbortSignal.timeout(4000),
        })
        if (cdnInfo.ok) {
          const si = await cdnInfo.json()
          meeting = si.Meeting
        }
      } catch { /* ignore — meeting metadata is non-critical */ }
    } else {
      // No slug — fall back to whatever the CDN is currently serving.
      const cdnInfo = await meetingInfoFromCDN()
      if (!cdnInfo) {
        return NextResponse.json({ sessions: [] }, { status: 502 })
      }
      meetingBase = cdnInfo.meetingBase
      raceDate = cdnInfo.raceDate
      meeting = cdnInfo.meeting
    }

    // Probe all session templates in parallel.
    const probes = SESSION_TEMPLATES.map((tmpl) => probeTemplate(meetingBase, raceDate, tmpl))
    const results = await Promise.all(probes)
    const sessions = (results.filter(Boolean) as DiscoveredSession[]).sort(
      (a, b) => (a.startDate > b.startDate ? 1 : -1),
    )

    return NextResponse.json(
      { meeting, sessions },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    )
  } catch {
    return NextResponse.json({ sessions: [] }, { status: 502 })
  }
}
