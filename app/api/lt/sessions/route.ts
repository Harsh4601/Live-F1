import { NextResponse } from 'next/server'

const LT_BASE = 'https://livetiming.formula1.com/static'

interface DiscoveredSession {
  name: string
  path: string
  type: string
  status: string
  startDate: string
}

const SESSION_TEMPLATES = [
  { name: 'Practice 1', type: 'Practice', suffix: 'Practice_1', dayOffset: -2 },
  { name: 'Practice 2', type: 'Practice', suffix: 'Practice_2', dayOffset: -2 },
  { name: 'Practice 3', type: 'Practice', suffix: 'Practice_3', dayOffset: -1 },
  { name: 'Sprint Qualifying', type: 'Sprint Qualifying', suffix: 'Sprint_Qualifying', dayOffset: -1 },
  { name: 'Sprint', type: 'Sprint', suffix: 'Sprint', dayOffset: -1 },
  { name: 'Qualifying', type: 'Qualifying', suffix: 'Qualifying', dayOffset: -1 },
  { name: 'Race', type: 'Race', suffix: 'Race', dayOffset: 0 },
]

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const infoRes = await fetch(`${LT_BASE}/SessionInfo.json`, { cache: 'no-store' })
    if (!infoRes.ok) {
      return NextResponse.json({ sessions: [] }, { status: 502 })
    }
    const sessionInfo = await infoRes.json()
    const meetingPath = sessionInfo.Path
    const pathParts = meetingPath.replace(/\/$/, '').split('/')
    const meetingBase = pathParts.slice(0, 2).join('/') + '/'

    const raceDate = new Date(sessionInfo.StartDate)

    const probes = SESSION_TEMPLATES.map(async (tmpl) => {
      const d = new Date(raceDate)
      d.setDate(d.getDate() + tmpl.dayOffset)
      const dateStr = d.toISOString().split('T')[0]
      const sessionPath = `${meetingBase}${dateStr}_${tmpl.suffix}/`

      try {
        const res = await fetch(`${LT_BASE}/${sessionPath}SessionInfo.json`, {
          signal: AbortSignal.timeout(3000),
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
    })

    const results = await Promise.all(probes)
    const sessions = results.filter(Boolean) as DiscoveredSession[]

    return NextResponse.json(
      { meeting: sessionInfo.Meeting, sessions },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    )
  } catch {
    return NextResponse.json({ sessions: [] }, { status: 502 })
  }
}
