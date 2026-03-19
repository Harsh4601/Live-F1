import { NextRequest, NextResponse } from 'next/server'
import { F1_2026_CALENDAR } from '@/lib/f1Calendar'

const LT_BASE = 'https://livetiming.formula1.com/static'
const ERGAST_BASE = 'https://api.jolpi.ca/ergast/f1'

interface DiscoveredSession {
  name: string
  path: string
  type: string
  status: string
  startDate: string
}

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

function normaliseMeetingName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
}

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

// Build meeting info from our 2026 calendar slug
function meetingInfoFromSlug(slug: string): { meetingBase: string; raceDate: Date } | null {
  const race = F1_2026_CALENDAR.find((r) => r.slug === slug)
  if (!race) return null
  const year = race.dateEnd.split('-')[0]
  const meetingBase = `${year}/${race.dateEnd}_${normaliseMeetingName(race.name)}/`
  return { meetingBase, raceDate: new Date(race.dateEnd + 'T12:00:00Z') }
}

// Build meeting info from Ergast API (historical races)
async function meetingInfoFromErgast(
  year: string,
  round: string,
): Promise<{ meetingBase: string; raceDate: Date; meeting: any } | null> {
  try {
    const res = await fetch(`${ERGAST_BASE}/${year}/${round}/races.json`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const race = data?.MRData?.RaceTable?.Races?.[0]
    if (!race) return null

    const raceDateStr: string = race.date // e.g. "2024-03-02"
    const meetingName = normaliseMeetingName(race.raceName)
    const meetingBase = `${year}/${raceDateStr}_${meetingName}/`

    return {
      meetingBase,
      raceDate: new Date(raceDateStr + 'T12:00:00Z'),
      meeting: {
        Name: race.raceName,
        Location: race.Circuit?.Location?.locality,
        Country: race.Circuit?.Location?.country,
        Circuit: race.Circuit?.circuitName,
      },
    }
  } catch {
    return null
  }
}

// Fall back to whatever the CDN is currently serving
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

  const meetingFolderDate = pathParts[1]?.split('_')[0] ?? ''
  const raceDateFromPath = meetingFolderDate.match(/^\d{4}-\d{2}-\d{2}$/)
    ? new Date(meetingFolderDate + 'T12:00:00Z')
    : null

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
    const params = request.nextUrl.searchParams
    const slug  = params.get('slug')
    const year  = params.get('year')
    const round = params.get('round')

    let meetingBase: string
    let raceDate: Date
    let meeting: any = null

    if (year && round) {
      // Historical race — fetch from Ergast
      const info = await meetingInfoFromErgast(year, round)
      if (!info) return NextResponse.json({ sessions: [] }, { status: 502 })
      meetingBase = info.meetingBase
      raceDate    = info.raceDate
      meeting     = info.meeting

      // Also try to enrich meeting metadata from CDN (best-effort)
      try {
        const cdnRes = await fetch(`${LT_BASE}/${meetingBase}SessionInfo.json`, {
          signal: AbortSignal.timeout(4000),
        })
        if (cdnRes.ok) {
          const si = await cdnRes.json()
          meeting = si.Meeting ?? meeting
        }
      } catch { /* non-critical */ }

    } else if (slug) {
      // 2026 race — derive from local calendar
      const info = meetingInfoFromSlug(slug)
      if (!info) return NextResponse.json({ sessions: [] }, { status: 404 })
      meetingBase = info.meetingBase
      raceDate    = info.raceDate

      try {
        const cdnRes = await fetch(`${LT_BASE}/${meetingBase}SessionInfo.json`, {
          signal: AbortSignal.timeout(4000),
        })
        if (cdnRes.ok) {
          const si = await cdnRes.json()
          meeting = si.Meeting ?? meeting
        }
      } catch { /* non-critical */ }

    } else {
      // No slug/year — serve whatever CDN is currently showing
      const cdnInfo = await meetingInfoFromCDN()
      if (!cdnInfo) return NextResponse.json({ sessions: [] }, { status: 502 })
      meetingBase = cdnInfo.meetingBase
      raceDate    = cdnInfo.raceDate
      meeting     = cdnInfo.meeting
    }

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
