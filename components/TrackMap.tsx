'use client'

import { useMemo, useRef, useState } from 'react'
import type { LeaderboardEntry } from '@/lib/types'
import {
  getTrackData,
  computeCumulativeDistances,
  getPointAtFraction,
} from '@/lib/trackCoordinates'

interface TrackMapProps {
  entries: LeaderboardEntry[]
  circuitName?: string
  lapCount?: { current: number; total: number }
}

function parseGapSeconds(gap: string | number | null): number | null {
  if (gap == null) return null
  if (typeof gap === 'number') return gap
  const s = gap.replace(/[+\s]/g, '')
  if (s === '' || s === 'LAP' || s === 'INTERVAL') return null
  if (s.includes('LAP')) {
    const n = parseInt(s)
    return isNaN(n) ? 90 : n * 90
  }
  const v = parseFloat(s)
  return isNaN(v) ? null : v
}

const TEAM_COLORS: Record<string, string> = {
  'Red Bull Racing': '#3671C6',
  'Ferrari': '#E8002D',
  'McLaren': '#FF8000',
  'Mercedes': '#27F4D2',
  'Aston Martin': '#229971',
  'Alpine': '#FF87BC',
  'Williams': '#64C4FF',
  'RB': '#6692FF',
  'Kick Sauber': '#52E252',
  'Haas F1 Team': '#B6BABD',
}

function getTeamColor(entry: LeaderboardEntry): string {
  if (entry.driver.team_colour) return `#${entry.driver.team_colour}`
  return TEAM_COLORS[entry.driver.team_name] ?? '#888888'
}

export default function TrackMap({ entries, circuitName, lapCount }: TrackMapProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [hoveredDriver, setHoveredDriver] = useState<number | null>(null)

  const track = useMemo(() => getTrackData(circuitName), [circuitName])

  const { viewBox, pathD, driverPositions } = useMemo(() => {
    if (!track || entries.length === 0) {
      return { viewBox: '0 0 100 100', pathD: '', driverPositions: [] }
    }

    const pts = track.points
    const xs = pts.map((p) => p.x)
    const ys = pts.map((p) => p.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const w = maxX - minX
    const h = maxY - minY
    const pad = Math.max(w, h) * 0.12

    const vb = `${minX - pad} ${minY - pad} ${w + pad * 2} ${h + pad * 2}`

    const d = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ') + ' Z'

    const cumDists = computeCumulativeDistances(pts)

    const avgLapTime = 80
    const sorted = [...entries].sort((a, b) => a.position - b.position)
    const leader = sorted[0]
    if (!leader) return { viewBox: vb, pathD: d, driverPositions: [] }

    const progress = lapCount ? (lapCount.current / lapCount.total) : 0.5
    const leaderFraction = (progress * 20 + 0.3) % 1.0

    // Separate active (with gap data) and inactive (retired/no data) drivers
    const activeDrivers: typeof sorted = []
    const inactiveDrivers: typeof sorted = []
    for (const entry of sorted) {
      const gap = entry.position === 1 ? 0 : parseGapSeconds(entry.gapToLeader)
      if (gap != null) {
        activeDrivers.push(entry)
      } else {
        inactiveDrivers.push(entry)
      }
    }

    const positions: Array<{
      entry: LeaderboardEntry
      x: number
      y: number
      color: string
      isInactive: boolean
    }> = []

    // Place active drivers based on gap to leader
    for (const entry of activeDrivers) {
      const gapSec = entry.position === 1 ? 0 : (parseGapSeconds(entry.gapToLeader) ?? 0)
      const gapFraction = (gapSec / avgLapTime)
      let frac = (leaderFraction - gapFraction) % 1.0
      if (frac < 0) frac += 1.0

      const point = getPointAtFraction(pts, cumDists, frac)
      positions.push({
        entry,
        x: point.x,
        y: point.y,
        color: getTeamColor(entry),
        isInactive: false,
      })
    }

    // Place inactive drivers evenly in pit lane area (near start/finish)
    for (let i = 0; i < inactiveDrivers.length; i++) {
      const frac = 0.02 + (i * 0.015)
      const point = getPointAtFraction(pts, cumDists, frac % 1.0)
      positions.push({
        entry: inactiveDrivers[i],
        x: point.x,
        y: point.y,
        color: getTeamColor(inactiveDrivers[i]),
        isInactive: true,
      })
    }

    return { viewBox: vb, pathD: d, driverPositions: positions }
  }, [track, entries, lapCount])

  if (!track || entries.length === 0) {
    return (
      <div className="bg-f1-surface rounded-xl border border-f1-border p-6">
        <div className="text-f1-muted text-sm text-center">Track map unavailable</div>
      </div>
    )
  }

  const hoveredEntry = hoveredDriver != null
    ? driverPositions.find((d) => d.entry.driver.driver_number === hoveredDriver)
    : null

  const dotRadius = 0.00015
  const labelOffset = 0.00028

  return (
    <div className="bg-f1-surface rounded-xl border border-f1-border overflow-hidden">
      <div className="px-4 py-3 border-b border-f1-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-f1-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a10 10 0 0 1 0 20" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
          <h3 className="text-white text-sm font-bold uppercase tracking-wider">Track Map</h3>
        </div>
        <span className="text-f1-muted text-[10px] font-mono uppercase">
          {track.name}
        </span>
      </div>

      <div ref={canvasRef} className="relative p-2">
        <svg
          viewBox={viewBox}
          className="w-full"
          style={{ aspectRatio: '4/3' }}
        >
          {/* Track outline */}
          <path
            d={pathD}
            fill="none"
            stroke="#444444"
            strokeWidth={0.00018}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Sector markers */}
          {[track.sector1End, track.sector2End].map((frac, i) => {
            const pt = getPointAtFraction(
              track.points,
              computeCumulativeDistances(track.points),
              frac,
            )
            return (
              <g key={`sector-${i}`}>
                <line
                  x1={pt.x - 0.0002}
                  y1={pt.y - 0.0002}
                  x2={pt.x + 0.0002}
                  y2={pt.y + 0.0002}
                  stroke="#444444"
                  strokeWidth={0.00004}
                />
                <text
                  x={pt.x + 0.0003}
                  y={pt.y}
                  fill="#555555"
                  fontSize={0.0002}
                  fontFamily="monospace"
                >
                  S{i + 2}
                </text>
              </g>
            )
          })}

          {/* Start/Finish line */}
          {(() => {
            const sfPt = track.points[0]
            return (
              <g>
                <rect
                  x={sfPt.x - 0.00008}
                  y={sfPt.y - 0.00015}
                  width={0.00016}
                  height={0.0003}
                  fill="#FFFFFF"
                  opacity={0.3}
                  rx={0.00002}
                />
              </g>
            )
          })()}

          {/* Driver dots */}
          {driverPositions.map(({ entry, x, y, color, isInactive }) => {
            const isHovered = hoveredDriver === entry.driver.driver_number
            const r = isHovered ? dotRadius * 1.6 : dotRadius
            const opacity = isInactive ? 0.35 : 1

            return (
              <g
                key={entry.driver.driver_number}
                onMouseEnter={() => setHoveredDriver(entry.driver.driver_number)}
                onMouseLeave={() => setHoveredDriver(null)}
                style={{ cursor: 'pointer' }}
                opacity={opacity}
              >
                {/* Glow effect */}
                <circle
                  cx={x}
                  cy={y}
                  r={r * 2}
                  fill={color}
                  opacity={isHovered ? 0.3 : 0.15}
                />
                {/* Main dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill={color}
                  stroke={isHovered ? '#FFFFFF' : 'none'}
                  strokeWidth={0.00003}
                />
                {/* Driver abbreviation */}
                <text
                  x={x}
                  y={y - labelOffset}
                  fill="#FFFFFF"
                  fontSize={isHovered ? 0.00016 : 0.00012}
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="auto"
                  opacity={isHovered ? 1 : 0.85}
                >
                  {entry.driver.name_acronym}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Tooltip on hover */}
        {hoveredEntry && (
          <div className="absolute bottom-3 left-3 bg-black/90 border border-f1-border rounded-lg px-3 py-2 pointer-events-none">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: hoveredEntry.color }}
              />
              <span className="text-white text-xs font-bold">
                P{hoveredEntry.entry.position} {hoveredEntry.entry.driver.broadcast_name || hoveredEntry.entry.driver.full_name}
              </span>
            </div>
            <div className="text-f1-muted text-[10px] mt-1 font-mono">
              {hoveredEntry.entry.driver.team_name}
              {hoveredEntry.entry.gapToLeader != null && hoveredEntry.entry.position > 1 && (
                <span className="ml-2 text-f1-red">
                  +{typeof hoveredEntry.entry.gapToLeader === 'number'
                    ? hoveredEntry.entry.gapToLeader.toFixed(3)
                    : hoveredEntry.entry.gapToLeader}s
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mini legend */}
      <div className="px-4 py-2 border-t border-f1-border/50 flex flex-wrap gap-x-3 gap-y-1">
        {driverPositions.slice(0, 10).map(({ entry, color }) => (
          <div
            key={entry.driver.driver_number}
            className="flex items-center gap-1 cursor-pointer"
            onMouseEnter={() => setHoveredDriver(entry.driver.driver_number)}
            onMouseLeave={() => setHoveredDriver(null)}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[9px] text-f1-muted font-mono">
              {entry.driver.name_acronym}
            </span>
          </div>
        ))}
        {driverPositions.length > 10 && (
          <span className="text-[9px] text-f1-muted/50 font-mono">
            +{driverPositions.length - 10} more
          </span>
        )}
      </div>
    </div>
  )
}
