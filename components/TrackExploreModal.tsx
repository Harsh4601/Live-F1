'use client'

import { useMemo, useEffect } from 'react'
import { getTrackDataByKey } from '@/lib/trackCoordinates'
import { TRACK_META } from '@/lib/trackMeta'
import type { F1Race } from '@/lib/f1Calendar'

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: 'red' | 'yellow' | 'blue' | 'purple'
}) {
  const valueColor =
    accent === 'red'    ? 'text-f1-red' :
    accent === 'yellow' ? 'text-yellow-400' :
    accent === 'blue'   ? 'text-blue-400' :
    accent === 'purple' ? 'text-f1-purple' :
    'text-white'

  return (
    <div className="bg-f1-surface rounded-xl border border-f1-border px-4 py-3.5 flex flex-col gap-1">
      <div className="text-[10px] text-f1-muted font-mono uppercase tracking-widest">{label}</div>
      <div className={`text-xl font-bold tabular-nums leading-none ${valueColor}`}>{value}</div>
      {sub && <div className="text-[11px] text-f1-muted font-mono">{sub}</div>}
    </div>
  )
}

export default function TrackExploreModal({
  race,
  onClose,
}: {
  race: F1Race
  onClose: () => void
}) {
  const track = getTrackDataByKey(race.circuitKey)
  const meta = TRACK_META[race.circuitKey] ?? null

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const svgData = useMemo(() => {
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
    const pad = Math.max(w, h) * 0.12
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
    const sw = Math.max(w, h) * 0.015

    // Start/Finish line marker — perpendicular to track direction at pts[0]
    const sfPt = pts[0]
    const nextPt = pts[Math.min(2, pts.length - 1)]
    const dx = nextPt.x - sfPt.x
    const dy = nextPt.y - sfPt.y
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const nx = -dy / len
    const ny = dx / len
    const ml = Math.max(w, h) * 0.055
    const sfLine = {
      x1: sfPt.x - nx * ml,
      y1: sfPt.y - ny * ml,
      x2: sfPt.x + nx * ml,
      y2: sfPt.y + ny * ml,
    }

    return { viewBox: `${minX - pad} ${minY - pad} ${w + pad * 2} ${h + pad * 2}`, d, sw, sfLine, sfPt }
  }, [track])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-f1-dark border border-f1-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Red top accent bar */}
        <div className="h-[3px] bg-gradient-to-r from-f1-red via-f1-red/60 to-transparent rounded-t-2xl" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-f1-border">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{race.flag}</span>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">{race.circuitName}</h2>
              <p className="text-f1-muted text-xs font-mono mt-0.5">
                {race.city} &middot; {race.country}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-f1-muted hover:text-white transition-colors p-2 rounded-lg hover:bg-f1-surface"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* SVG Track Layout */}
        <div className="px-6 pt-5 pb-3">
          {svgData ? (
            <>
              <div className="relative bg-f1-surface/40 rounded-xl overflow-hidden border border-f1-border/60 p-4">
                <svg
                  viewBox={svgData.viewBox}
                  className="w-full max-h-60"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Outer glow */}
                  <path
                    d={svgData.d}
                    fill="none"
                    stroke="#E10600"
                    strokeWidth={svgData.sw * 5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity={0.07}
                  />
                  {/* Track line */}
                  <path
                    d={svgData.d}
                    fill="none"
                    stroke="#E10600"
                    strokeWidth={svgData.sw}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity={0.9}
                  />
                  {/* Start/Finish line (white perpendicular bar) */}
                  <line
                    x1={svgData.sfLine.x1}
                    y1={svgData.sfLine.y1}
                    x2={svgData.sfLine.x2}
                    y2={svgData.sfLine.y2}
                    stroke="#ffffff"
                    strokeWidth={svgData.sw * 1.8}
                    strokeLinecap="round"
                    opacity={0.95}
                  />
                  {/* S/F dot */}
                  <circle
                    cx={svgData.sfPt.x}
                    cy={svgData.sfPt.y}
                    r={svgData.sw * 1.5}
                    fill="#ffffff"
                    opacity={0.95}
                  />
                </svg>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-2.5 px-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-[3px] bg-white rounded-full" />
                  <span className="text-[10px] text-f1-muted font-mono uppercase tracking-wider">Start / Finish</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-[3px] bg-f1-red rounded-full" />
                  <span className="text-[10px] text-f1-muted font-mono uppercase tracking-wider">Track Layout</span>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-f1-surface rounded-xl border border-f1-border p-10 text-center text-f1-muted text-sm">
              Track layout unavailable
            </div>
          )}
        </div>

        {/* Stats */}
        {meta ? (
          <div className="px-6 pb-6 space-y-3">
            {/* Row 1 — primary */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Circuit Length" value={`${meta.length} km`} />
              <StatCard label="Corners" value={String(meta.corners)} />
              <StatCard label="DRS Zones" value={String(meta.drsZones)} accent="red" />
            </div>

            {/* Row 2 — secondary */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Circuit Type"
                value={meta.circuitType}
                accent={meta.circuitType === 'Street' ? 'yellow' : 'blue'}
              />
              <StatCard label="First Grand Prix" value={String(meta.firstGP)} />
            </div>

            {/* Lap Record */}
            {meta.lapRecord ? (
              <div className="rounded-xl border border-f1-red/30 bg-f1-red/5 px-5 py-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-[10px] text-f1-red font-mono uppercase tracking-widest mb-1.5">
                    Lap Record
                  </div>
                  <div className="text-white font-mono font-bold text-3xl tabular-nums tracking-tight">
                    {meta.lapRecord.time}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white text-base font-bold">{meta.lapRecord.driver}</div>
                  <div className="text-f1-muted text-xs font-mono mt-0.5">{meta.lapRecord.year}</div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-f1-border bg-f1-surface/50 px-5 py-4 text-center">
                <div className="text-[10px] text-f1-muted font-mono uppercase tracking-widest mb-1">
                  Lap Record
                </div>
                <div className="text-f1-muted text-sm">New circuit — no record set yet</div>
              </div>
            )}
          </div>
        ) : (
          <div className="px-6 pb-6 pt-2 text-center text-f1-muted text-sm">
            Circuit data unavailable
          </div>
        )}
      </div>
    </div>
  )
}
