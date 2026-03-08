'use client'

import type { LeaderboardEntry } from '@/lib/types'
import {
  formatLapTime,
  formatGap,
  formatInterval,
  formatSectorTime,
  getTyreColor,
  getTyreLabel,
} from '@/lib/utils'
import clsx from 'clsx'

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  sessionType: string | undefined
  isFinished?: boolean
}

export default function Leaderboard({ entries, sessionType, isFinished }: LeaderboardProps) {
  const isRace = sessionType === 'Race'

  if (entries.length === 0) {
    return (
      <div className="bg-f1-surface rounded-xl border border-f1-border p-12">
        <div className="flex flex-col items-center justify-center gap-3 text-f1-muted">
          <div className="w-10 h-10 border-4 border-f1-border border-t-f1-red rounded-full animate-spin" />
          <p className="text-sm uppercase tracking-widest">Loading timing data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-f1-surface rounded-xl border border-f1-border overflow-hidden">
      <div className="px-4 py-3 border-b border-f1-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isFinished ? (
            <>
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">
                Final Classification
              </h3>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-f1-red animate-pulse-red" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">
                Live Timing
              </h3>
            </>
          )}
        </div>
        <span className="text-xs text-f1-muted font-mono">
          {entries.length} drivers
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-f1-muted border-b border-f1-border bg-f1-dark/30">
              <th className="px-3 py-2.5 text-left w-16">Pos</th>
              <th className="px-3 py-2.5 text-left min-w-[160px]">Driver</th>
              {isRace && <th className="px-3 py-2.5 text-right">Interval</th>}
              {isRace && <th className="px-3 py-2.5 text-right">Gap</th>}
              <th className="px-3 py-2.5 text-right">Last Lap</th>
              <th className="px-3 py-2.5 text-right">Best Lap</th>
              <th className="px-3 py-2.5 text-right hidden xl:table-cell">S1</th>
              <th className="px-3 py-2.5 text-right hidden xl:table-cell">S2</th>
              <th className="px-3 py-2.5 text-right hidden xl:table-cell">S3</th>
              <th className="px-3 py-2.5 text-center w-20">Tyre</th>
              <th className="px-3 py-2.5 text-right w-16">Laps</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr
                key={entry.driver.driver_number}
                className={clsx(
                  'border-b border-f1-border/40 transition-colors hover:bg-white/[0.03]',
                  index < 3 && 'bg-white/[0.015]'
                )}
              >
                {/* Position + Team color */}
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: `#${entry.driver.team_colour || '666'}` }}
                    />
                    <span className={clsx(
                      'font-mono font-bold text-base w-6 text-center',
                      index === 0 && 'text-f1-red',
                      index === 1 && 'text-gray-300',
                      index === 2 && 'text-amber-600',
                    )}>
                      {entry.position}
                    </span>
                  </div>
                </td>

                {/* Driver name + team */}
                <td className="px-3 py-2">
                  <div>
                    <div className="font-bold text-white tracking-wide text-sm">
                      {entry.driver.name_acronym}
                    </div>
                    <div className="text-[11px] text-f1-muted truncate max-w-[140px]">
                      {entry.driver.team_name}
                    </div>
                  </div>
                </td>

                {/* Interval (race only) */}
                {isRace && (
                  <td className="px-3 py-2 text-right font-mono text-sm">
                    {entry.position === 1 ? (
                      <span className="text-f1-muted">{'\u2014'}</span>
                    ) : (
                      <span className="text-white/80">{formatInterval(entry.interval)}</span>
                    )}
                  </td>
                )}

                {/* Gap to leader (race only) */}
                {isRace && (
                  <td className="px-3 py-2 text-right font-mono text-sm">
                    {entry.position === 1 ? (
                      <span className="text-f1-red font-semibold text-xs">LEADER</span>
                    ) : (
                      <span className="text-white/60">{formatGap(entry.gapToLeader)}</span>
                    )}
                  </td>
                )}

                {/* Last lap */}
                <td className="px-3 py-2 text-right font-mono text-sm text-white/80">
                  {formatLapTime(entry.lastLap?.lap_duration)}
                </td>

                {/* Best lap */}
                <td className={clsx(
                  'px-3 py-2 text-right font-mono text-sm font-semibold',
                  entry.isOverallBest ? 'text-f1-purple' : 'text-white'
                )}>
                  {formatLapTime(entry.bestLapTime)}
                </td>

                {/* Sector times */}
                <td className="px-3 py-2 text-right font-mono text-xs text-white/50 hidden xl:table-cell">
                  {formatSectorTime(entry.lastLap?.duration_sector_1)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs text-white/50 hidden xl:table-cell">
                  {formatSectorTime(entry.lastLap?.duration_sector_2)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs text-white/50 hidden xl:table-cell">
                  {formatSectorTime(entry.lastLap?.duration_sector_3)}
                </td>

                {/* Tyre */}
                <td className="px-3 py-2">
                  <div className="flex items-center justify-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ring-1 ring-white/20"
                      style={{ backgroundColor: getTyreColor(entry.currentStint?.compound) }}
                    >
                      <span className={
                        ['MEDIUM', 'HARD'].includes(entry.currentStint?.compound?.toUpperCase() ?? '')
                          ? 'text-black'
                          : 'text-white'
                      }>
                        {getTyreLabel(entry.currentStint?.compound)}
                      </span>
                    </div>
                    <span className="text-xs text-f1-muted font-mono w-5 text-right">
                      {entry.tyreAge > 0 ? entry.tyreAge : '\u2014'}
                    </span>
                  </div>
                </td>

                {/* Laps completed */}
                <td className="px-3 py-2 text-right font-mono text-sm text-f1-muted">
                  {entry.lapNumber || '\u2014'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
