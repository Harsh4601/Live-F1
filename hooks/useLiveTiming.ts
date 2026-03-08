'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import useSWR from 'swr'
import {
  fetchLTJson,
  ltUrl,
  type LTSessionInfo,
  transformSession,
  transformDrivers,
  transformWeather,
  transformRaceControl,
  buildLeaderboardFromLT,
  extractLapCount,
} from '@/lib/f1LiveTiming'
import type { Session, Driver, Weather, RaceControl, LeaderboardEntry } from '@/lib/types'

const SWR_BASE = {
  revalidateOnFocus: false,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
}

interface LivePayload {
  connected: boolean
  topics: string[]
  lastUpdate: number
  data: Record<string, any>
  error?: string
}

async function liveFetcher(url: string): Promise<LivePayload> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Live endpoint ${res.status}`)
  return res.json()
}

function ltFetcher<T>(url: string) {
  return fetchLTJson<T>(url)
}

function buildFallbackPath(sessionInfo: LTSessionInfo): string | null {
  try {
    const pathParts = sessionInfo.Path.replace(/\/$/, '').split('/')
    if (pathParts.length < 3) return null
    const meetingBase = pathParts.slice(0, 2).join('/') + '/'

    const raceDate = new Date(sessionInfo.StartDate)
    const sessionNames = ['Qualifying', 'Sprint_Qualifying', 'Sprint', 'Practice_3', 'Practice_2', 'Practice_1']

    for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
      const d = new Date(raceDate)
      d.setDate(d.getDate() - dayOffset)
      const dateStr = d.toISOString().split('T')[0]
      for (const name of sessionNames) {
        return `${meetingBase}${dateStr}_${name}/`
      }
    }
  } catch {
    // ignore
  }
  return null
}

export function useLiveTiming() {
  const [pollingStopped, setPollingStopped] = useState(false)
  const finalisedDataRef = useRef<LivePayload | null>(null)

  // Determine poll rate: 3s when live, 0 when race is over
  const pollInterval = pollingStopped ? 0 : 3000

  // ── 1. Poll the SignalR live endpoint (stop when finalised) ──
  const { data: live, error: liveError } = useSWR<LivePayload>(
    '/api/lt/live',
    liveFetcher,
    { ...SWR_BASE, refreshInterval: pollInterval }
  )

  const signalrConnected = live?.connected === true
  const signalrHasData = signalrConnected && Object.keys(live?.data ?? {}).length > 0

  const signalrSessionStatus: string | undefined =
    live?.data?.SessionStatus?.Status ?? live?.data?.SessionInfo?.SessionStatus

  const isFinished = signalrHasData && signalrSessionStatus === 'Finalised'

  const isLive =
    signalrHasData &&
    (signalrSessionStatus === 'Started' ||
     signalrSessionStatus === 'Finalised' ||
     signalrSessionStatus === 'Ends')

  // When session finishes: capture final snapshot and stop polling
  useEffect(() => {
    if (signalrSessionStatus === 'Finalised') {
      if (live && !finalisedDataRef.current) {
        finalisedDataRef.current = live
      }
      setPollingStopped(true)
    } else if (signalrSessionStatus === 'Started') {
      finalisedDataRef.current = null
      setPollingStopped(false)
    }
  }, [signalrSessionStatus, live])

  // Use frozen snapshot when finalised, otherwise use live polling data
  const effectiveData = finalisedDataRef.current ?? live

  // ── 2. Also poll static SessionInfo for fallback / upcoming banner ──
  const { data: staticSessionInfo, error: staticError } = useSWR<LTSessionInfo>(
    ltUrl('SessionInfo'),
    ltFetcher,
    { ...SWR_BASE, refreshInterval: pollingStopped ? 0 : 10000 }
  )

  // ── 3. Fallback path for completed sessions (when no live data) ──
  const fallbackPath = useMemo(() => {
    if (isLive || !staticSessionInfo) return null
    return buildFallbackPath(staticSessionInfo)
  }, [isLive, staticSessionInfo])

  const { data: fallbackSessionInfo } = useSWR<LTSessionInfo>(
    !isLive && fallbackPath ? ltUrl('SessionInfo', fallbackPath) : null,
    ltFetcher,
    SWR_BASE
  )

  const isFallbackValid =
    fallbackSessionInfo?.SessionStatus === 'Finalised' ||
    fallbackSessionInfo?.SessionStatus === 'Started'

  const archivePath = isFallbackValid ? fallbackPath! : null

  // ── 4. Static file fetches (only when NOT live) ──
  const archiveRefresh = 30000

  const { data: rawDriversArchive } = useSWR<Record<string, any>>(
    !isLive && archivePath ? ltUrl('DriverList', archivePath) : null,
    ltFetcher,
    { ...SWR_BASE, refreshInterval: 60000 }
  )
  const { data: rawTimingArchive } = useSWR<any>(
    !isLive && archivePath ? ltUrl('TimingData', archivePath) : null,
    ltFetcher,
    { ...SWR_BASE, refreshInterval: archiveRefresh }
  )
  const { data: rawTimingAppArchive } = useSWR<any>(
    !isLive && archivePath ? ltUrl('TimingAppData', archivePath) : null,
    ltFetcher,
    { ...SWR_BASE, refreshInterval: archiveRefresh * 2 }
  )
  const { data: rawWeatherArchive } = useSWR<any>(
    !isLive && archivePath ? ltUrl('WeatherData', archivePath) : null,
    ltFetcher,
    { ...SWR_BASE, refreshInterval: 60000 }
  )
  const { data: rawRCArchive } = useSWR<any>(
    !isLive && archivePath ? ltUrl('RaceControlMessages', archivePath) : null,
    ltFetcher,
    { ...SWR_BASE, refreshInterval: archiveRefresh }
  )

  // ── 5. Pick data source: live SignalR vs archive static files ──
  const d = effectiveData?.data ?? {}

  const sessionInfoForTransform: LTSessionInfo | undefined = isLive
    ? d.SessionInfo
    : isFallbackValid
      ? fallbackSessionInfo
      : staticSessionInfo

  const session: Session | undefined = sessionInfoForTransform
    ? transformSession(sessionInfoForTransform)
    : undefined

  const rawDrivers = isLive ? d.DriverList : rawDriversArchive
  const rawTiming = isLive ? d.TimingData : rawTimingArchive
  const rawTimingApp = isLive ? d.TimingAppData : rawTimingAppArchive
  const rawWeather = isLive ? d.WeatherData : rawWeatherArchive
  const rawRC = isLive ? d.RaceControlMessages : rawRCArchive

  const drivers: Driver[] | undefined = rawDrivers
    ? transformDrivers(rawDrivers)
    : undefined

  const leaderboard: LeaderboardEntry[] =
    rawTiming && rawDrivers
      ? buildLeaderboardFromLT(rawTiming, rawDrivers, rawTimingApp)
      : []

  const weather: Weather | undefined = rawWeather
    ? transformWeather(rawWeather)
    : undefined

  const raceControl: RaceControl[] | undefined = rawRC
    ? transformRaceControl(rawRC)
    : undefined

  const lapCount = isLive ? extractLapCount(d.LapCount) : null

  const upcomingSession =
    !isLive && staticSessionInfo?.SessionStatus === 'Inactive'
      ? staticSessionInfo
      : null

  return {
    session,
    sessionInfo: sessionInfoForTransform,
    upcomingSession,
    drivers,
    leaderboard,
    weather,
    raceControl,
    lapCount,
    isActive: isLive,
    isFinished,
    isAvailable: !liveError && !staticError && !!sessionInfoForTransform,
    isLoading: !live && !liveError && !staticSessionInfo && !staticError,
    sourceName: isLive
      ? isFinished
        ? 'F1 Live Timing (Final)'
        : 'F1 Live Timing (SignalR)'
      : 'F1 Live Timing (Archive)',
  }
}
