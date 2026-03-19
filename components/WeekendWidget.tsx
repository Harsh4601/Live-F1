'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calendar, MapPin, Timer, CloudSun, Radio, Flag } from 'lucide-react'
import { useLiveTiming } from '@/hooks/useLiveTiming'
import { getSessionUTC, type F1Race } from '@/lib/f1Calendar'
import { formatGap, formatInterval } from '@/lib/utils'
import type { LeaderboardEntry } from '@/lib/types'

type RaceStatus = 'past' | 'live' | 'thisWeekend' | 'upcoming'

function formatWeekendRange(start: string, end: string): string {
  const s = new Date(start + 'T12:00:00')
  const e = new Date(end + 'T12:00:00')
  const sMonth = s.toLocaleDateString('en-US', { month: 'short' })
  const eMonth = e.toLocaleDateString('en-US', { month: 'short' })
  if (sMonth === eMonth) return `${sMonth} ${s.getDate()}–${e.getDate()}`
  return `${sMonth} ${s.getDate()} – ${eMonth} ${e.getDate()}`
}

function Top3Row({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const medal =
    index === 0 ? 'text-f1-red' : index === 1 ? 'text-gray-300' : 'text-amber-600'

  return (
    <div className="flex items-center gap-3 bg-f1-dark/60 rounded-lg px-3 py-2 border border-white/5">
      <div
        className="w-1.5 h-8 rounded-full flex-shrink-0"
        style={{ backgroundColor: `#${entry.driver.team_colour || '666'}` }}
      />
      <div className={`font-mono font-extrabold tabular-nums w-6 text-center ${medal}`}>
        {entry.position}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <div className="font-bold text-white text-sm tracking-wide truncate">
              {entry.driver.name_acronym}
            </div>
            <div className="text-[11px] text-f1-muted truncate">
              {entry.driver.team_name}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            {entry.position === 1 ? (
              <span className="text-[10px] font-bold text-f1-red uppercase tracking-wider">Leader</span>
            ) : (
              <div className="font-mono text-xs text-white/80 tabular-nums">
                {formatInterval(entry.interval)}
                <span className="text-f1-muted"> / </span>
                {formatGap(entry.gapToLeader)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WeekendWidget({
  race,
  status,
}: {
  race: F1Race
  status: RaceStatus
}) {
  const lt = useLiveTiming()
  const isLiveNow = status === 'live' && lt.isActive && !lt.isFinished && lt.leaderboard.length > 0

  const top3 = useMemo(() => (isLiveNow ? lt.leaderboard.slice(0, 3) : []), [isLiveNow, lt.leaderboard])

  const nextSessions = useMemo(() => {
    const now = Date.now()
    return race.sessions.map((s) => {
      const utc = getSessionUTC(race.dateStart, s, race.utcOffset)
      return { ...s, utc, isPast: utc.getTime() < now }
    })
  }, [race])

  const liveTickerItems = useMemo(() => {
    const items: { key: string; icon: any; label: string; value: string }[] = []

    if (lt.lapCount?.total && lt.lapCount.total > 0) {
      items.push({
        key: 'laps',
        icon: Timer,
        label: 'Lap',
        value: `${lt.lapCount.current}/${lt.lapCount.total}`,
      })
    }

    if (lt.weather) {
      items.push({
        key: 'weather',
        icon: CloudSun,
        label: 'Track Weather',
        value: `${lt.weather.air_temperature}°C air · ${lt.weather.track_temperature}°C track · ${lt.weather.rainfall ? 'Rain' : 'Dry'}`,
      })
    }

    const latestRC = lt.raceControl?.[lt.raceControl.length - 1]
    if (latestRC?.message) {
      items.push({
        key: 'rc',
        icon: Radio,
        label: 'Race Control',
        value: latestRC.message,
      })
    }

    if (items.length === 0) {
      items.push({
        key: 'connecting',
        icon: Flag,
        label: 'Live',
        value: 'Connecting to feed…',
      })
    }

    return items
  }, [lt.lapCount, lt.weather, lt.raceControl])

  const [tickerIndex, setTickerIndex] = useState(0)
  useEffect(() => {
    if (!isLiveNow) return
    const id = window.setInterval(() => {
      setTickerIndex((i) => (i + 1) % liveTickerItems.length)
    }, 4500)
    return () => window.clearInterval(id)
  }, [isLiveNow, liveTickerItems.length])

  const ticker = liveTickerItems[Math.min(tickerIndex, liveTickerItems.length - 1)]

  const badge =
    status === 'live'
      ? { text: 'Live', cls: 'bg-f1-red/20 text-f1-red border-f1-red/30', dot: 'bg-f1-red' }
      : status === 'thisWeekend'
        ? { text: 'This Weekend', cls: 'bg-yellow-400/10 text-yellow-300 border-yellow-400/20', dot: 'bg-yellow-300' }
        : { text: 'Up Next', cls: 'bg-white/5 text-white/80 border-white/10', dot: 'bg-f1-red' }

  return (
    <div className="bg-f1-surface rounded-xl border border-f1-border overflow-hidden mb-6">
      <div className="h-1 bg-gradient-to-r from-f1-red via-f1-red/50 to-transparent" />
      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${badge.cls}`}>
                <span className="relative flex h-2 w-2">
                  {(status === 'live' || status === 'upcoming') && (
                    <span className={`absolute inline-flex h-full w-full rounded-full opacity-70 ${badge.dot} ${status === 'live' ? 'animate-ping' : 'animate-ping'}`} />
                  )}
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${badge.dot} ${
                      status === 'live' ? 'animate-pulse-red' : status === 'upcoming' ? 'animate-pulse' : ''
                    }`}
                  />
                </span>
                {badge.text}
              </span>
              <span className="text-[10px] text-f1-muted font-mono uppercase tracking-wider">
                Round {race.round}
              </span>
            </div>

            <div className="flex items-baseline gap-2 flex-wrap min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-white truncate">
                {race.flag} {race.name}
              </h2>
              <span className="text-f1-muted text-xs font-mono">
                {formatWeekendRange(race.dateStart, race.dateEnd)}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-f1-muted flex-wrap">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-f1-red/70" />
                {race.circuitName} · {race.city}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-f1-red/70" />
                Weekend schedule in your local time
              </span>
            </div>
          </div>

          {isLiveNow ? (
            <div className="w-full lg:w-[520px] space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {top3.map((e, i) => (
                  <Top3Row key={e.driver.driver_number} entry={e} index={i} />
                ))}
              </div>

              <div className="bg-f1-dark/50 border border-white/5 rounded-lg px-3 py-2 flex items-start gap-2">
                {ticker?.icon && <ticker.icon size={14} className="text-f1-red/80 mt-0.5 flex-shrink-0" />}
                <div className="min-w-0">
                  <div className="text-[10px] text-f1-muted uppercase tracking-widest">{ticker.label}</div>
                  <div className="text-[12px] text-white/85 leading-snug break-words">
                    {ticker.value}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full lg:w-[520px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {nextSessions.length === 0 ? (
                  <div className="bg-f1-dark/60 border border-white/5 rounded-lg p-3">
                    <div className="text-[10px] text-f1-muted uppercase tracking-widest">Schedule</div>
                    <div className="text-sm text-white/80 mt-1">No upcoming sessions found.</div>
                  </div>
                ) : (
                  nextSessions.map((s) => (
                    <div
                      key={`${s.shortName}-${s.day}`}
                      className={`border border-white/5 rounded-lg p-3 transition-colors ${
                        s.isPast ? 'bg-f1-dark/30 opacity-70' : 'bg-f1-dark/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[10px] text-f1-muted uppercase tracking-widest">
                            {s.shortName}
                          </div>
                          <div className="text-sm text-white font-bold truncate">{s.name}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-mono text-xs text-white/80 tabular-nums">
                            {s.utc.toLocaleString(undefined, {
                              weekday: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

