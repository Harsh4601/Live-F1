'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import {
  useLatestSession,
  useMeeting,
  useDrivers,
  usePositions,
  useIntervals,
  useLaps,
  useStints,
  usePitStops,
  useRaceControl,
  useWeather,
} from '@/hooks/useOpenF1'
import { useLiveTiming } from '@/hooks/useLiveTiming'
import { useArchiveSession } from '@/hooks/useArchiveSession'
import {
  getLatestPerDriver,
  getLatestStintPerDriver,
  getBestLapPerDriver,
} from '@/lib/utils'
import { OpenF1LockedError } from '@/lib/api'
import type { LeaderboardEntry, Stint } from '@/lib/types'
import RaceHeader from '@/components/RaceHeader'
import Leaderboard from '@/components/Leaderboard'
import WeatherWidget from '@/components/WeatherWidget'
import RaceControlFeed from '@/components/RaceControlFeed'
import PitStopLog from '@/components/PitStopLog'
import SessionTabs, { type SessionTab } from '@/components/SessionTabs'
import TrackMap from '@/components/TrackMap'
import type { LTSessionInfo } from '@/lib/f1LiveTiming'

// ─── Sessions discovery fetcher ───

interface SessionsPayload {
  meeting: any
  sessions: SessionTab[]
}

async function sessionsFetcher(url: string): Promise<SessionsPayload> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

// ─── Upcoming Banner ───

function UpcomingBanner({ sessionInfo }: { sessionInfo: LTSessionInfo }) {
  const offsetParts = sessionInfo.GmtOffset.split(':')
  const offsetHours = parseInt(offsetParts[0])
  const localStart = new Date(sessionInfo.StartDate)
  const utcStart = new Date(localStart.getTime() - offsetHours * 60 * 60 * 1000)
  const userLocal = utcStart.toLocaleString(undefined, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  return (
    <div className="bg-f1-red/10 border border-f1-red/30 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-f1-red animate-pulse-red" />
        <div>
          <p className="text-white font-bold text-sm">
            {sessionInfo.Name} &mdash; {sessionInfo.Meeting.Name}
          </p>
          <p className="text-f1-muted text-xs mt-0.5">
            Starts at <span className="text-white font-mono">{userLocal}</span>
            {' '}&middot; Dashboard will auto-switch to live data when the session begins
          </p>
        </div>
      </div>
      <div className="bg-f1-red/20 border border-f1-red/40 rounded-lg px-3 py-1.5">
        <span className="text-f1-red text-xs font-bold uppercase tracking-wider">Waiting for start</span>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───

export default function Dashboard() {
  // ── 1. Discover weekend sessions ──
  const { data: weekendData } = useSWR<SessionsPayload>(
    '/api/lt/sessions',
    sessionsFetcher,
    { revalidateOnFocus: false, refreshInterval: 120000 },
  )

  const weekendSessions = weekendData?.sessions ?? []

  // Correct stale session statuses — F1 static files sometimes report 'Started'
  // long after a session has finished. Treat sessions that started 5+ hours ago
  // as 'Finalised' unless SignalR actively confirms otherwise.
  const effectiveSessions = useMemo(() => {
    const now = Date.now()
    return weekendSessions.map(s => {
      if (s.status === 'Started' && s.startDate) {
        const elapsedMs = now - new Date(s.startDate).getTime()
        if (elapsedMs > 5 * 3_600_000) {
          return { ...s, status: 'Finalised' }
        }
      }
      return s
    })
  }, [weekendSessions])

  // ── 2. Live data sources (must come before tab state to avoid reference error) ──
  const { data: sessions, error: openF1Error, isLoading: openF1Loading } = useLatestSession()
  const openF1Locked = openF1Error instanceof OpenF1LockedError || (openF1Error && !sessions)
  const lt = useLiveTiming()
  const useOpenF1 = !openF1Locked && !!sessions?.[0]

  // ── 3. Tab state ──
  // Index of actively running session (green pulse dot)
  // Requires SignalR to confirm a session is actually live — static status alone is unreliable
  const liveIndex = useMemo(() => {
    if (!lt.isActive || lt.isFinished) return null
    const idx = effectiveSessions.findIndex(
      (s) => s.status === 'Started' || s.status === 'Ends',
    )
    return idx >= 0 ? idx : null
  }, [effectiveSessions, lt.isActive, lt.isFinished])

  // Index of recently finished session (SignalR still has data)
  const finishedIndex = useMemo(() => {
    if (!lt.isFinished || !lt.isActive) return null
    const idx = effectiveSessions.findIndex((s) => s.type === 'Race')
    return idx >= 0 ? idx : null
  }, [effectiveSessions, lt.isFinished, lt.isActive])

  const defaultIndex = useMemo(() => {
    if (liveIndex != null) return liveIndex
    if (finishedIndex != null) return finishedIndex
    const lastFinished = effectiveSessions
      .map((s, i) => ({ s, i }))
      .filter((x) => x.s.status === 'Finalised')
      .pop()
    return lastFinished?.i ?? (effectiveSessions.length > 0 ? effectiveSessions.length - 1 : 0)
  }, [effectiveSessions, liveIndex, finishedIndex])

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useEffect(() => {
    if (liveIndex != null) setSelectedIndex(liveIndex)
    else if (finishedIndex != null && selectedIndex == null) setSelectedIndex(finishedIndex)
  }, [liveIndex, finishedIndex])

  const activeIndex = selectedIndex ?? defaultIndex
  const activeTab = effectiveSessions[activeIndex] ?? null
  const isViewingLive = activeTab != null && lt.isActive && (
    activeTab.status === 'Started' ||
    activeTab.status === 'Ends' ||
    activeTab.type === 'Race'
  )
  const isViewingArchive = activeTab != null && !isViewingLive
  const isViewingFinished =
    (isViewingLive && lt.isFinished) ||
    (isViewingArchive && activeTab?.status === 'Finalised')

  const handleTabSelect = useCallback((i: number) => setSelectedIndex(i), [])

  // ── 4. Archive data (only when viewing a past session) ──
  const archivePath = isViewingArchive ? activeTab.path : null
  const archive = useArchiveSession(archivePath)

  // ── 5. OpenF1 hooks (for when it's available) ──
  const liveSession = useOpenF1 ? sessions![0] : lt.session
  const sessionKey = useOpenF1 ? liveSession?.session_key : undefined

  const { data: meetings } = useMeeting(useOpenF1 ? liveSession?.meeting_key : undefined)
  const meeting = meetings?.[0]

  const { data: openF1Drivers } = useDrivers(sessionKey)
  const { data: positions } = usePositions(sessionKey)
  const isLiveRace = liveSession?.session_type === 'Race'
  const { data: intervals } = useIntervals(sessionKey, isLiveRace)
  const { data: laps } = useLaps(sessionKey)
  const { data: stints } = useStints(sessionKey)
  const { data: pitStops } = usePitStops(sessionKey)
  const { data: openF1RaceControl } = useRaceControl(sessionKey)
  const { data: weatherData } = useWeather(sessionKey)
  const openF1Weather = weatherData?.[weatherData.length - 1]

  // ── 6. Build OpenF1 leaderboard ──
  const openF1Leaderboard = useMemo<LeaderboardEntry[]>(() => {
    if (!useOpenF1 || !openF1Drivers || !positions) return []

    const uniqueDrivers = Array.from(
      new Map(openF1Drivers.map((d) => [d.driver_number, d])).values(),
    )
    const latestPositions = getLatestPerDriver(positions)
    const latestIntervals = intervals ? getLatestPerDriver(intervals) : {}
    const latestLaps = laps ? getLatestPerDriver(laps) : {}
    const currentStints = getLatestStintPerDriver(stints as Stint[] | undefined)
    const bestLaps = getBestLapPerDriver(laps)
    const bestTimes = Object.values(bestLaps).filter((t) => t > 0)
    const overallBest = bestTimes.length > 0 ? Math.min(...bestTimes) : Infinity

    return uniqueDrivers
      .map((driver) => {
        const pos = latestPositions[driver.driver_number]
        const interval = latestIntervals[driver.driver_number]
        const lap = latestLaps[driver.driver_number]
        const stint = currentStints[driver.driver_number] as Stint | undefined
        const bestLap = bestLaps[driver.driver_number]
        return {
          position: pos?.position ?? 99,
          driver,
          interval: interval?.interval ?? null,
          gapToLeader: interval?.gap_to_leader ?? null,
          lastLap: lap ?? null,
          bestLapTime: bestLap ?? null,
          isOverallBest: bestLap != null && bestLap === overallBest,
          currentStint: stint ?? null,
          tyreAge:
            stint && lap ? lap.lap_number - stint.lap_start + stint.tyre_age_at_start : 0,
          lapNumber: lap?.lap_number ?? 0,
        }
      })
      .sort((a, b) => a.position - b.position)
  }, [useOpenF1, openF1Drivers, positions, intervals, laps, stints])

  // ── 7. Resolve final data based on view mode ──
  let session = liveSession
  let leaderboard: LeaderboardEntry[] = []
  let weather = useOpenF1 ? openF1Weather : lt.weather
  let raceControl = useOpenF1 ? openF1RaceControl : lt.raceControl
  let drivers = useOpenF1 ? openF1Drivers : lt.drivers
  let sourceName = useOpenF1 ? 'OpenF1' : lt.isAvailable ? lt.sourceName : null

  if (isViewingArchive && archive.session) {
    session = archive.session
    leaderboard = archive.leaderboard
    weather = archive.weather
    raceControl = archive.raceControl
    drivers = archive.drivers
    sourceName = 'F1 Live Timing (Archive)'
  } else {
    leaderboard = useOpenF1 ? openF1Leaderboard : lt.leaderboard
  }

  // ── 8. Loading states ──
  const isLoading =
    weekendSessions.length === 0 && !weekendData
      ? !liveSession && (openF1Loading || lt.isLoading)
      : isViewingArchive
        ? archive.isLoading
        : !liveSession && (openF1Loading || lt.isLoading)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-f1-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-f1-muted text-xs uppercase tracking-[0.2em]">
            Connecting to data feed...
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-f1-red font-display text-xl mb-2">No Session Found</p>
          <p className="text-f1-muted text-sm">Could not retrieve session data from any source</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
      {/* Top bar: lap counter + source indicator */}
      <div className="flex items-center justify-between">
        {!isViewingArchive && !useOpenF1 && lt.lapCount && lt.lapCount.total > 0 && (
          <div className="flex items-center gap-2.5">
            <span className="text-f1-muted text-xs font-mono uppercase tracking-wider">Lap</span>
            <span className="text-white font-mono text-lg font-bold tabular-nums">
              {lt.lapCount.current}
              <span className="text-f1-muted">/{lt.lapCount.total}</span>
            </span>
          </div>
        )}
        <div className="flex-1" />
        <Link
          href="/calendar"
          className="text-f1-muted hover:text-white text-[11px] font-mono uppercase tracking-wider transition-colors mr-4 flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Calendar
        </Link>
        {sourceName && (
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isViewingArchive
                  ? 'bg-blue-400'
                  : isViewingFinished
                    ? 'bg-white'
                    : useOpenF1
                      ? 'bg-emerald-400'
                      : lt.isActive
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-f1-red animate-pulse-red'
              }`}
            />
            <span className="text-[11px] text-f1-muted font-mono uppercase tracking-wider">
              {sourceName}
              {!isViewingArchive && !useOpenF1 && lt.isActive && !isViewingFinished && ' \u00B7 Live'}
              {isViewingFinished && ' \u00B7 Finished'}
            </span>
          </div>
        )}
      </div>

      {/* Session tabs */}
      {effectiveSessions.length > 1 && (
        <SessionTabs
          sessions={effectiveSessions}
          activeIndex={activeIndex}
          liveIndex={liveIndex}
          onSelect={handleTabSelect}
        />
      )}

      <RaceHeader session={session} meeting={!isViewingArchive && useOpenF1 ? meeting : undefined} isFinished={isViewingFinished} />

      {/* Upcoming session banner */}
      {!isViewingArchive && lt.upcomingSession && (
        <UpcomingBanner sessionInfo={lt.upcomingSession} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="min-w-0">
          <Leaderboard entries={leaderboard} sessionType={session.session_type} isFinished={isViewingFinished} />
        </div>

        <div className="space-y-6">
          {leaderboard.length > 0 && (
            <TrackMap
              entries={leaderboard}
              circuitName={session?.circuit_short_name ?? session?.location}
              lapCount={!isViewingArchive && lt.lapCount && lt.lapCount.total > 0 ? lt.lapCount : undefined}
            />
          )}
          <WeatherWidget weather={weather} />
          <RaceControlFeed messages={raceControl} drivers={drivers} />
          {!isViewingArchive && useOpenF1 && (
            <PitStopLog pitStops={pitStops} drivers={drivers} />
          )}
        </div>
      </div>

      <footer className="text-center py-4 border-t border-f1-border/50">
        <p className="text-f1-muted text-xs">
          Powered by{' '}
          {useOpenF1 && !isViewingArchive ? (
            <a
              href="https://openf1.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-f1-red hover:underline"
            >
              OpenF1 API
            </a>
          ) : (
            <span className="text-f1-red">F1 Live Timing</span>
          )}
          {' '}&middot; Not affiliated with Formula 1
        </p>
      </footer>
    </div>
  )
}
