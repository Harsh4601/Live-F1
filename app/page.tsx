'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import useSWR from 'swr'
import f1LogoRed from '../f1-logo-red.avif'
import { F1_2026_CALENDAR, getCurrentOrNextRace, getSessionUTC, type F1Race } from '@/lib/f1Calendar'
import { getTrackDataByKey, getTrackData } from '@/lib/trackCoordinates'
import TrackExploreModal from '@/components/TrackExploreModal'

const fetcher = (url: string) => fetch(url).then(r => r.ok ? r.json() : null)
const apiFetcher = (url: string) => fetch(url).then(r => r.ok ? r.json() : null)

const CURRENT_YEAR = 2026
const SUPPORTED_YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019]

const COUNTRY_FLAGS: Record<string, string> = {
  'Australia': '🇦🇺', 'China': '🇨🇳', 'Japan': '🇯🇵',
  'Bahrain': '🇧🇭', 'Saudi Arabia': '🇸🇦',
  'United States': '🇺🇸', 'USA': '🇺🇸',
  'Canada': '🇨🇦', 'Monaco': '🇲🇨', 'Spain': '🇪🇸',
  'Austria': '🇦🇹', 'United Kingdom': '🇬🇧', 'UK': '🇬🇧',
  'Belgium': '🇧🇪', 'Hungary': '🇭🇺', 'Netherlands': '🇳🇱',
  'Italy': '🇮🇹', 'Singapore': '🇸🇬', 'Azerbaijan': '🇦🇿',
  'Mexico': '🇲🇽', 'Brazil': '🇧🇷',
  'United Arab Emirates': '🇦🇪', 'UAE': '🇦🇪',
  'Qatar': '🇶🇦', 'France': '🇫🇷', 'Russia': '🇷🇺',
  'Germany': '🇩🇪', 'Portugal': '🇵🇹', 'Turkey': '🇹🇷',
  'Vietnam': '🇻🇳',
}

function countryFlag(country: string): string {
  return COUNTRY_FLAGS[country] ?? '🏁'
}

interface ErgastRace {
  round: string
  raceName: string
  Circuit: { circuitName: string; Location: { locality: string; country: string } }
  date: string
}

// ─── Historical calendar (non-2026 years from Ergast) ───

function HistoricalRaceCard({
  race,
  isSelected,
  onSelect,
}: {
  race: ErgastRace
  isSelected: boolean
  onSelect: () => void
}) {
  const flag = countryFlag(race.Circuit.Location.country)
  const dateLabel = new Date(race.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border transition-all p-3 group ${
        isSelected
          ? 'bg-f1-red/10 border-f1-red/60 ring-1 ring-f1-red/30'
          : 'bg-f1-surface border-f1-border hover:border-f1-red/40'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="text-[11px] font-mono font-bold w-7 text-center text-f1-red">
          R{String(race.round).padStart(2, '0')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base">{flag}</span>
            <span className="text-sm font-bold text-white truncate">
              {race.Circuit.Location.locality}
            </span>
          </div>
          <div className="text-[11px] font-mono text-f1-muted">{dateLabel}</div>
        </div>
      </div>
    </button>
  )
}

function HistoricalRaceDetail({ race, year }: { race: ErgastRace; year: number }) {
  const flag = countryFlag(race.Circuit.Location.country)
  const raceDate = new Date(race.date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  // Resolve track using locality name (e.g. "Melbourne", "Baku") via the alias resolver
  const track = useMemo(
    () => getTrackData(race.Circuit.Location.locality) ?? getTrackData(race.Circuit.circuitName),
    [race.Circuit.Location.locality, race.Circuit.circuitName],
  )

  const trackSVG = useMemo(() => {
    if (!track) return null
    const pts = track.points
    const xs = pts.map((p) => p.x)
    const ys = pts.map((p) => p.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs)
    const minY = Math.min(...ys), maxY = Math.max(...ys)
    const w = maxX - minX, h = maxY - minY
    const pad = Math.max(w, h) * 0.1
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
    return { viewBox: `${minX - pad} ${minY - pad} ${w + pad * 2} ${h + pad * 2}`, d, sw: Math.max(w, h) * 0.015 }
  }, [track])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-f1-surface rounded-xl border border-f1-border overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-f1-red via-f1-red/50 to-transparent" />
        <div className="p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">{flag}</span>
                <span className="text-f1-red text-xs font-mono font-bold uppercase tracking-wider">
                  Round {race.round} · {year}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white">{race.raceName}</h2>
              <p className="text-f1-muted text-sm mt-1">
                {race.Circuit.circuitName} &middot; {race.Circuit.Location.locality}
              </p>
              <p className="text-f1-muted text-xs mt-1 font-mono">{raceDate}</p>
            </div>
            <Link
              href={`/${year}/${race.round}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider bg-f1-dark hover:bg-f1-border text-white border border-f1-border transition-all flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
              </svg>
              View Results
            </Link>
          </div>
        </div>
      </div>

      {/* Circuit Layout */}
      {trackSVG && (
        <div className="bg-f1-surface rounded-xl border border-f1-border overflow-hidden">
          <div className="px-4 py-3 border-b border-f1-border flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">Circuit Layout</h3>
            <span className="text-[10px] text-f1-muted font-mono uppercase">{race.Circuit.circuitName}</span>
          </div>
          <div className="p-4">
            <svg viewBox={trackSVG.viewBox} className="w-full max-h-[300px]" preserveAspectRatio="xMidYMid meet">
              <path
                d={trackSVG.d}
                fill="none"
                stroke="#E10600"
                strokeWidth={trackSVG.sw}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.8}
              />
              <path
                d={trackSVG.d}
                fill="none"
                stroke="#E10600"
                strokeWidth={trackSVG.sw * 3}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.1}
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}

function HistoricalCalendarView({ year }: { year: number }) {
  const { data, isLoading } = useSWR(
    `https://api.jolpi.ca/ergast/f1/${year}/races.json`,
    apiFetcher,
    { revalidateOnFocus: false },
  )
  const races: ErgastRace[] = data?.MRData?.RaceTable?.Races ?? []
  const [selectedRound, setSelectedRound] = useState<string>('1')

  // Auto-select first race on year change or data load
  useMemo(() => {
    if (races.length > 0) setSelectedRound(races[0].round)
  }, [year, races.length])

  const selectedRace = races.find((r) => r.round === selectedRound) ?? races[0]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-f1-border border-t-f1-red rounded-full animate-spin" />
      </div>
    )
  }

  if (!races.length) {
    return (
      <div className="text-center py-24 text-f1-muted">No race data found for {year}</div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
      <div className="space-y-1.5 max-h-[calc(100vh-260px)] overflow-y-auto pr-1 scrollbar-thin">
        {races.map((race) => (
          <HistoricalRaceCard
            key={race.round}
            race={race}
            isSelected={race.round === selectedRound}
            onSelect={() => setSelectedRound(race.round)}
          />
        ))}
      </div>
      <div>
        {selectedRace && <HistoricalRaceDetail race={selectedRace} year={year} />}
      </div>
    </div>
  )
}

type PageTab = 'calendar' | 'standings'


function MiniTrackSVG({ circuitKey, className }: { circuitKey: string; className?: string }) {
  const track = getTrackDataByKey(circuitKey)
  if (!track) return null

  const pts = track.points
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const w = maxX - minX
  const h = maxY - minY
  const pad = Math.max(w, h) * 0.1
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  return (
    <svg
      viewBox={`${minX - pad} ${minY - pad} ${w + pad * 2} ${h + pad * 2}`}
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <path d={d} fill="none" stroke="currentColor" strokeWidth={Math.max(w, h) * 0.02} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

type RaceStatus = 'past' | 'live' | 'thisWeekend' | 'upcoming'

function getRaceStatus(race: F1Race, liveSessionStatus?: string | null): RaceStatus {
  const now = new Date()
  const start = new Date(race.dateStart)
  const end = new Date(race.dateEnd + 'T23:59:59')

  if (now > end) return 'past'

  if (now >= start && now <= end) {
    if (liveSessionStatus === 'Finalised' || liveSessionStatus === 'Ends') return 'past'
    if (liveSessionStatus === 'Started') return 'live'
    return 'thisWeekend'
  }

  return 'upcoming'
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'T12:00:00')
  const e = new Date(end + 'T12:00:00')
  const sMonth = s.toLocaleDateString('en-US', { month: 'short' })
  const eMonth = e.toLocaleDateString('en-US', { month: 'short' })

  if (sMonth === eMonth) {
    return `${sMonth} ${s.getDate()}-${e.getDate()}`
  }
  return `${sMonth} ${s.getDate()} - ${eMonth} ${e.getDate()}`
}

function RaceCard({
  race,
  status,
  isSelected,
  onSelect,
}: {
  race: F1Race
  status: RaceStatus
  isSelected: boolean
  onSelect: () => void
}) {
  const isPast = status === 'past'

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border transition-all ${
        isSelected
          ? 'bg-f1-red/10 border-f1-red/60 ring-1 ring-f1-red/30'
          : status === 'live'
            ? 'bg-f1-surface border-emerald-500/40 hover:border-emerald-500/60'
            : status === 'thisWeekend'
              ? 'bg-f1-surface border-yellow-500/30 hover:border-yellow-500/50'
              : isPast
                ? 'bg-f1-surface/60 border-f1-border/50 hover:border-f1-border'
                : 'bg-f1-surface border-f1-border hover:border-f1-red/40'
      } p-3 group`}
    >
      <div className="flex items-center gap-3">
        <div className={`text-[11px] font-mono font-bold w-7 text-center ${isPast ? 'text-f1-muted/50' : 'text-f1-red'}`}>
          R{String(race.round).padStart(2, '0')}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base">{race.flag}</span>
            <span className={`text-sm font-bold truncate ${isPast ? 'text-f1-muted' : 'text-white'}`}>
              {race.city}
            </span>
            {status === 'live' && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Live
              </span>
            )}
            {status === 'thisWeekend' && (
              <span className="text-[9px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                This Weekend
              </span>
            )}
            {race.hasSprint && (
              <span className="text-[9px] font-bold text-f1-purple bg-f1-purple/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Sprint
              </span>
            )}
          </div>
          <div className={`text-[11px] font-mono ${isPast ? 'text-f1-muted/50' : 'text-f1-muted'}`}>
            {formatDateRange(race.dateStart, race.dateEnd)}
          </div>
        </div>

        <MiniTrackSVG
          circuitKey={race.circuitKey}
          className={`w-10 h-10 flex-shrink-0 ${
            isSelected ? 'text-f1-red' : isPast ? 'text-f1-muted/30' : 'text-f1-muted/50 group-hover:text-f1-red/50'
          } transition-colors`}
        />
      </div>
    </button>
  )
}

function RaceDetail({ race, status }: { race: F1Race; status: RaceStatus }) {
  const [showExplore, setShowExplore] = useState(false)
  const track = getTrackDataByKey(race.circuitKey)

  const trackSVG = useMemo(() => {
    if (!track) return null
    const pts = track.points
    const xs = pts.map((p) => p.x)
    const ys = pts.map((p) => p.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const w = maxX - minX
    const h = maxY - minY
    const pad = Math.max(w, h) * 0.1
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
    return { viewBox: `${minX - pad} ${minY - pad} ${w + pad * 2} ${h + pad * 2}`, d, sw: Math.max(w, h) * 0.015 }
  }, [track])

  const sessionsByDay = useMemo(() => {
    const days: Record<number, typeof race.sessions> = {}
    for (const s of race.sessions) {
      if (!days[s.day]) days[s.day] = []
      days[s.day].push(s)
    }
    return days
  }, [race.sessions])

  const dayLabels = ['', 'Friday', 'Saturday', 'Sunday']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-f1-surface rounded-xl border border-f1-border overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-f1-red via-f1-red/50 to-transparent" />
        <div className="p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">{race.flag}</span>
                <span className="text-f1-red text-xs font-mono font-bold uppercase tracking-wider">
                  Round {race.round}
                </span>
                {race.hasSprint && (
                  <span className="text-[10px] font-bold text-f1-purple bg-f1-purple/20 px-2 py-0.5 rounded uppercase tracking-wider border border-f1-purple/30">
                    Sprint Weekend
                  </span>
                )}
                {status === 'live' && (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Live Now
                  </span>
                )}
                {status === 'thisWeekend' && (
                  <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded uppercase tracking-wider border border-yellow-400/20">
                    This Weekend
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white">{race.name}</h2>
              <p className="text-f1-muted text-sm mt-1">
                {race.circuitName} &middot; {race.city}
              </p>
              <p className="text-f1-muted text-xs mt-1 font-mono">
                {formatDateRange(race.dateStart, race.dateEnd)} 2026
              </p>
            </div>
            <Link
              href={`/${race.slug}`}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all flex-shrink-0 ${
                status === 'live'
                  ? 'bg-f1-red hover:bg-f1-red/80 text-white'
                  : 'bg-f1-dark hover:bg-f1-border text-white border border-f1-border'
              }`}
            >
              {status === 'live' && (
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              )}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
              </svg>
              {status === 'live' ? 'Live Dashboard' : status === 'past' ? 'View Results' : 'Dashboard'}
            </Link>
          </div>
        </div>
      </div>

      {/* Circuit Layout */}
      {trackSVG && (
        <div className="bg-f1-surface rounded-xl border border-f1-border overflow-hidden">
          <div className="px-4 py-3 border-b border-f1-border flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">Circuit Layout</h3>
            <span className="text-[10px] text-f1-muted font-mono uppercase">{race.circuitName}</span>
          </div>
          <div className="p-4">
            <svg viewBox={trackSVG.viewBox} className="w-full max-h-[300px]" preserveAspectRatio="xMidYMid meet">
              <path
                d={trackSVG.d}
                fill="none"
                stroke="#E10600"
                strokeWidth={trackSVG.sw}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.8}
              />
              <path
                d={trackSVG.d}
                fill="none"
                stroke="#E10600"
                strokeWidth={trackSVG.sw * 3}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.1}
              />
            </svg>
          </div>
          <div className="px-4 pb-4">
            <button
              onClick={() => setShowExplore(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-f1-red/40 bg-f1-red/5 hover:bg-f1-red/10 hover:border-f1-red/70 text-f1-red text-xs font-bold uppercase tracking-wider transition-all group"
            >
              <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              Explore Track
            </button>
          </div>
        </div>
      )}

      {showExplore && (
        <TrackExploreModal race={race} onClose={() => setShowExplore(false)} />
      )}

      {/* Session Schedule */}
      <div className="bg-f1-surface rounded-xl border border-f1-border overflow-hidden">
        <div className="px-4 py-3 border-b border-f1-border flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">Weekend Schedule</h3>
          <span className="text-[10px] text-f1-muted font-mono">Your local time</span>
        </div>
        <div className="divide-y divide-f1-border/50">
          {Object.entries(sessionsByDay).map(([day, sessions]) => {
            const firstSession = sessions[0]
            const sessionDate = getSessionUTC(race.dateStart, firstSession, race.utcOffset)
            const dateLabel = sessionDate.toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })

            return (
            <div key={day} className="p-4">
              <div className="text-[10px] text-f1-muted font-mono uppercase tracking-widest mb-3">
                {dateLabel}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sessions.map((session) => {
                  const utcDate = getSessionUTC(race.dateStart, session, race.utcOffset)
                  const localTime = utcDate.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })

                  return (
                  <div
                    key={session.shortName}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                      session.shortName === 'R'
                        ? 'bg-f1-red/10 border border-f1-red/30'
                        : session.shortName === 'SPR'
                          ? 'bg-f1-purple/10 border border-f1-purple/30'
                          : session.shortName === 'Q' || session.shortName === 'SQ'
                            ? 'bg-yellow-500/10 border border-yellow-500/20'
                            : 'bg-f1-dark/50 border border-f1-border/50'
                    }`}
                  >
                    <div className={`text-xs font-mono font-bold w-8 flex-shrink-0 ${
                      session.shortName === 'R'
                        ? 'text-f1-red'
                        : session.shortName === 'SPR'
                          ? 'text-f1-purple'
                          : session.shortName === 'Q' || session.shortName === 'SQ'
                            ? 'text-yellow-400'
                            : 'text-f1-muted'
                    }`}>
                      {session.shortName}
                    </div>
                    <span className="text-sm text-white flex-1">{session.name}</span>
                    <span className="text-xs font-mono text-f1-muted tabular-nums flex-shrink-0">
                      {localTime}
                    </span>
                  </div>
                  )
                })}
              </div>
            </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

// ─── Team colors for standings ───

const TEAM_COLORS: Record<string, string> = {
  red_bull: '#3671C6', redbull: '#3671C6',
  mercedes: '#27F4D2',
  ferrari: '#E8002D',
  mclaren: '#FF8000',
  aston_martin: '#229971', aston: '#229971',
  alpine: '#FF87BC',
  williams: '#64C4FF',
  rb: '#6692FF', alphatauri: '#6692FF', visa_cashapp: '#6692FF',
  haas: '#B6BABD',
  sauber: '#52E252', kick_sauber: '#52E252', stake: '#52E252',
}

function getTeamColor(constructorId: string): string {
  const id = constructorId.toLowerCase().replace(/[\s-]/g, '_')
  for (const [key, color] of Object.entries(TEAM_COLORS)) {
    if (id.includes(key)) return color
  }
  return '#666666'
}

// ─── Standings View ───

type StandingsTab = 'drivers' | 'constructors'

interface DriverStanding {
  position: string
  points: string
  wins: string
  Driver: {
    givenName: string
    familyName: string
    code: string
    nationality: string
  }
  Constructors: { name: string; constructorId: string }[]
}

interface ConstructorStanding {
  position: string
  points: string
  wins: string
  Constructor: {
    name: string
    constructorId: string
    nationality: string
  }
}

function StandingsView({ year }: { year?: number }) {
  const [tab, setTab] = useState<StandingsTab>('drivers')
  const apiYear = year ?? 'current'

  const { data: driverData, isLoading: driversLoading } = useSWR(
    `https://api.jolpi.ca/ergast/f1/${apiYear}/driverstandings.json`,
    apiFetcher,
    { revalidateOnFocus: false, refreshInterval: year ? 0 : 300000 }
  )
  const { data: constructorData, isLoading: constructorsLoading } = useSWR(
    `https://api.jolpi.ca/ergast/f1/${apiYear}/constructorstandings.json`,
    apiFetcher,
    { revalidateOnFocus: false, refreshInterval: year ? 0 : 300000 }
  )

  const driverStandings: DriverStanding[] =
    driverData?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? []
  const constructorStandings: ConstructorStanding[] =
    constructorData?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? []
  const seasonRound = driverData?.MRData?.StandingsTable?.StandingsLists?.[0]?.round
  const season = driverData?.MRData?.StandingsTable?.StandingsLists?.[0]?.season

  const maxDriverPoints = driverStandings.length > 0 ? Number(driverStandings[0].points) : 0
  const maxConstructorPoints = constructorStandings.length > 0 ? Number(constructorStandings[0].points) : 0

  const isLoading = tab === 'drivers' ? driversLoading : constructorsLoading

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 bg-f1-surface rounded-xl border border-f1-border p-1">
        {(['drivers', 'constructors'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              tab === t
                ? 'bg-f1-red text-white'
                : 'text-f1-muted hover:text-white hover:bg-f1-dark'
            }`}
          >
            {t === 'drivers' ? 'Drivers Championship' : 'Constructors Championship'}
          </button>
        ))}
      </div>

      {season && (
        <p className="text-f1-muted text-xs font-mono">
          {year
            ? `Final Standings · ${season} Season`
            : `After Round ${seasonRound} · ${season} Season`}
        </p>
      )}

      {isLoading ? (
        <div className="bg-f1-surface rounded-xl border border-f1-border p-12">
          <div className="flex flex-col items-center justify-center gap-3 text-f1-muted">
            <div className="w-10 h-10 border-4 border-f1-border border-t-f1-red rounded-full animate-spin" />
            <p className="text-sm uppercase tracking-widest">Loading standings...</p>
          </div>
        </div>
      ) : tab === 'drivers' ? (
        <div className="bg-f1-surface rounded-xl border border-f1-border overflow-hidden">
          <div className="px-4 py-3 border-b border-f1-border">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">
              {year ? `${year} Driver Standings` : 'Driver Standings'}
            </h3>
          </div>
          {driverStandings.length === 0 ? (
            <div className="p-8 text-center text-f1-muted text-sm">
              No standings data available yet for this season.
            </div>
          ) : (
            <div className="divide-y divide-f1-border/40">
              {driverStandings.map((d, i) => {
                const teamColor = d.Constructors[0]
                  ? getTeamColor(d.Constructors[0].constructorId)
                  : '#666'
                const barWidth = maxDriverPoints > 0
                  ? (Number(d.points) / maxDriverPoints) * 100
                  : 0

                return (
                  <div
                    key={d.Driver.code ?? i}
                    className={`relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02] ${
                      i < 3 ? 'bg-white/[0.015]' : ''
                    }`}
                  >
                    <div className="absolute inset-0 pointer-events-none">
                      <div
                        className="h-full opacity-[0.04]"
                        style={{ width: `${barWidth}%`, backgroundColor: teamColor }}
                      />
                    </div>

                    <div className="relative flex items-center gap-3 w-full">
                      <div
                        className="w-1 h-10 rounded-full flex-shrink-0"
                        style={{ backgroundColor: teamColor }}
                      />
                      <span className={`font-mono font-bold text-lg w-8 text-center ${
                        i === 0 ? 'text-f1-red' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-f1-muted'
                      }`}>
                        {d.position}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {d.Driver.givenName}{' '}
                            <span className="uppercase">{d.Driver.familyName}</span>
                          </span>
                          <span className="text-[10px] text-f1-muted font-mono">{d.Driver.code}</span>
                        </div>
                        <div className="text-[11px] text-f1-muted">
                          {d.Constructors[0]?.name ?? 'Unknown'}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-mono font-bold text-white text-lg tabular-nums">
                          {d.points}
                        </div>
                        <div className="text-[10px] text-f1-muted font-mono">
                          {d.wins} {Number(d.wins) === 1 ? 'win' : 'wins'}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-f1-surface rounded-xl border border-f1-border overflow-hidden">
          <div className="px-4 py-3 border-b border-f1-border">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">
              {year ? `${year} Constructor Standings` : 'Constructor Standings'}
            </h3>
          </div>
          {constructorStandings.length === 0 ? (
            <div className="p-8 text-center text-f1-muted text-sm">
              No standings data available yet for this season.
            </div>
          ) : (
            <div className="divide-y divide-f1-border/40">
              {constructorStandings.map((c, i) => {
                const teamColor = getTeamColor(c.Constructor.constructorId)
                const barWidth = maxConstructorPoints > 0
                  ? (Number(c.points) / maxConstructorPoints) * 100
                  : 0

                return (
                  <div
                    key={c.Constructor.constructorId}
                    className={`relative flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02] ${
                      i < 3 ? 'bg-white/[0.015]' : ''
                    }`}
                  >
                    <div className="absolute inset-0 pointer-events-none">
                      <div
                        className="h-full opacity-[0.06]"
                        style={{ width: `${barWidth}%`, backgroundColor: teamColor }}
                      />
                    </div>

                    <div className="relative flex items-center gap-3 w-full">
                      <div
                        className="w-1.5 h-12 rounded-full flex-shrink-0"
                        style={{ backgroundColor: teamColor }}
                      />
                      <span className={`font-mono font-bold text-xl w-8 text-center ${
                        i === 0 ? 'text-f1-red' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-f1-muted'
                      }`}>
                        {c.position}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-white text-base uppercase tracking-wide">
                          {c.Constructor.name}
                        </span>
                        <div className="text-[11px] text-f1-muted">{c.Constructor.nationality}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-mono font-bold text-white text-xl tabular-nums">
                          {c.points}
                        </div>
                        <div className="text-[10px] text-f1-muted font-mono">
                          {c.wins} {Number(c.wins) === 1 ? 'win' : 'wins'}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ───

export default function CalendarPage() {
  const currentRace = getCurrentOrNextRace()
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)
  const [selectedRound, setSelectedRound] = useState(currentRace.round)
  const [pageTab, setPageTab] = useState<PageTab>('calendar')
  const selectedRace = F1_2026_CALENDAR.find((r) => r.round === selectedRound) ?? currentRace

  const { data: liveData } = useSWR('/api/lt/live', fetcher, { refreshInterval: 30000 })
  const liveSessionStatus: string | null = liveData?.sessionStatus ?? null

  const currentWeekendRound = useMemo(() => {
    const now = new Date()
    return F1_2026_CALENDAR.find((r) => {
      const start = new Date(r.dateStart)
      const end = new Date(r.dateEnd + 'T23:59:59')
      return now >= start && now <= end
    })?.round ?? null
  }, [])

  function getStatusForRace(race: F1Race): RaceStatus {
    const isCurrentWeekend = race.round === currentWeekendRound
    return getRaceStatus(race, isCurrentWeekend ? liveSessionStatus : undefined)
  }

  const selectedStatus = getStatusForRace(selectedRace)

  const isHistoricalYear = selectedYear !== CURRENT_YEAR

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Image src={f1LogoRed} alt="Formula 1" className="h-7 w-auto" priority />
          <div>
            <h1 className="text-2xl font-bold text-white">
              <span className="sr-only">F1</span>{' '}
              {selectedYear === CURRENT_YEAR ? '2026' : selectedYear}
            </h1>
            <p className="text-f1-muted text-sm mt-0.5">
              {selectedYear === CURRENT_YEAR
                ? '24 Grands Prix · 6 Sprint Weekends'
                : `${selectedYear} Formula 1 Season`}
            </p>
          </div>
        </div>

        {/* Year selector */}
        <div className="flex items-center gap-2">
          <span className="text-f1-muted text-xs font-mono uppercase tracking-wider">Season</span>
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value))
                setSelectedRound(currentRace.round)
                setPageTab('calendar')
              }}
              className="appearance-none bg-f1-surface border border-f1-border text-white text-sm font-bold font-mono rounded-lg pl-4 pr-8 py-2 cursor-pointer hover:border-f1-red/50 transition-colors focus:outline-none focus:border-f1-red"
            >
              {SUPPORTED_YEARS.map((y) => (
                <option key={y} value={y} className="bg-f1-dark">
                  {y}{y === CURRENT_YEAR ? ' (Current)' : ''}
                </option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-f1-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Page tabs — Calendar + Standings for all years */}
      <div className="flex items-center gap-1 mb-6">
        {([
          { id: 'calendar' as PageTab, label: 'Calendar' },
          { id: 'standings' as PageTab, label: 'Standings' },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setPageTab(t.id)}
            className={`relative px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              pageTab === t.id
                ? 'bg-f1-surface text-white border border-f1-red/60'
                : 'text-f1-muted hover:text-white hover:bg-f1-surface/50 border border-transparent'
            }`}
          >
            {t.label}
            {pageTab === t.id && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-f1-red rounded-full" />
            )}
          </button>
        ))}
      </div>

      {pageTab === 'standings' ? (
        <StandingsView year={isHistoricalYear ? selectedYear : undefined} />
      ) : isHistoricalYear ? (
        <HistoricalCalendarView year={selectedYear} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
          <div className="space-y-1.5 max-h-[calc(100vh-260px)] overflow-y-auto pr-1 scrollbar-thin">
            {F1_2026_CALENDAR.map((race) => (
              <RaceCard
                key={race.round}
                race={race}
                status={getStatusForRace(race)}
                isSelected={race.round === selectedRound}
                onSelect={() => setSelectedRound(race.round)}
              />
            ))}
          </div>
          <div>
            <RaceDetail race={selectedRace} status={selectedStatus} />
          </div>
        </div>
      )}
    </div>
  )
}
