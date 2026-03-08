import type { PitStop, Driver } from '@/lib/types'

interface PitStopLogProps {
  pitStops: PitStop[] | undefined
  drivers: Driver[] | undefined
}

export default function PitStopLog({ pitStops, drivers }: PitStopLogProps) {
  if (!pitStops || pitStops.length === 0) return null

  const driverMap = new Map<number, Driver>()
  drivers?.forEach(d => driverMap.set(d.driver_number, d))

  const sortedStops = [...pitStops].reverse()

  return (
    <div className="bg-f1-surface rounded-xl border border-f1-border overflow-hidden">
      <div className="px-4 py-3 border-b border-f1-border flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">
          Pit Stops
        </h3>
        <span className="text-xs text-f1-muted font-mono">{pitStops.length} stops</span>
      </div>

      <div className="max-h-[320px] overflow-y-auto p-3 space-y-2">
        {sortedStops.map((stop, index) => {
          const driver = driverMap.get(stop.driver_number)
          return (
            <div
              key={`${stop.date}-${index}`}
              className="flex items-center gap-3 bg-f1-dark/60 rounded-lg p-2.5"
            >
              <div
                className="w-1 h-10 rounded-full flex-shrink-0"
                style={{ backgroundColor: `#${driver?.team_colour || '666'}` }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">
                    {driver?.name_acronym || `#${stop.driver_number}`}
                  </span>
                  <span className="text-[11px] text-f1-muted font-mono bg-f1-surface rounded px-1.5 py-0.5">
                    Lap {stop.lap_number}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <div>
                    <span className="text-[10px] text-f1-muted uppercase">Lane </span>
                    <span className="font-mono text-xs text-white/70">
                      {stop.lane_duration?.toFixed(1)}s
                    </span>
                  </div>
                  {stop.stop_duration != null && (
                    <div>
                      <span className="text-[10px] text-f1-muted uppercase">Stop </span>
                      <span className="font-mono text-xs text-f1-red font-semibold">
                        {stop.stop_duration.toFixed(1)}s
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
