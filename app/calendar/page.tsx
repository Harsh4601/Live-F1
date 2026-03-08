'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { F1_2026_CALENDAR, getCurrentOrNextRace, type F1Race } from '@/lib/f1Calendar'
import { getTrackDataByKey, type TrackPoint } from '@/lib/trackCoordinates'

const fetcher = (url: string) => fetch(url).then(r => r.ok ? r.json() : null)

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
          </div>
        </div>
      </div>

      {/* Track Map */}
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
        </div>
      )}

      {/* Session Schedule */}
      <div className="bg-f1-surface rounded-xl border border-f1-border overflow-hidden">
        <div className="px-4 py-3 border-b border-f1-border">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">Weekend Schedule</h3>
        </div>
        <div className="divide-y divide-f1-border/50">
          {Object.entries(sessionsByDay).map(([day, sessions]) => (
            <div key={day} className="p-4">
              <div className="text-[10px] text-f1-muted font-mono uppercase tracking-widest mb-3">
                {dayLabels[Number(day)]} &middot; Day {day}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sessions.map((session) => (
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
                    <div className={`text-xs font-mono font-bold w-8 ${
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
                    <span className="text-sm text-white">{session.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Dashboard Link */}
      {status === 'live' && (
        <Link
          href="/"
          className="block bg-f1-red hover:bg-f1-red-dark text-white font-bold text-center py-3.5 rounded-xl transition-colors uppercase tracking-wider text-sm"
        >
          Go to Live Dashboard
        </Link>
      )}
      {status === 'thisWeekend' && (
        <Link
          href="/"
          className="block bg-f1-surface hover:bg-f1-surface-light text-white font-bold text-center py-3.5 rounded-xl transition-colors uppercase tracking-wider text-sm border border-f1-border"
        >
          View Dashboard
        </Link>
      )}
    </div>
  )
}

export default function CalendarPage() {
  const currentRace = getCurrentOrNextRace()
  const [selectedRound, setSelectedRound] = useState(currentRace.round)
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

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-f1-muted hover:text-white text-xs font-mono uppercase tracking-wider transition-colors"
            >
              &larr; Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2">
            <span className="text-f1-red font-display tracking-wider">F1</span> 2026 Calendar
          </h1>
          <p className="text-f1-muted text-sm mt-0.5">24 Grands Prix &middot; 6 Sprint Weekends</p>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* Race list sidebar */}
        <div className="space-y-1.5 max-h-[calc(100vh-180px)] overflow-y-auto pr-1 scrollbar-thin">
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

        {/* Race detail */}
        <div>
          <RaceDetail race={selectedRace} status={selectedStatus} />
        </div>
      </div>
    </div>
  )
}
