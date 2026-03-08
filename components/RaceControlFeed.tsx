import type { RaceControl, Driver } from '@/lib/types'
import { getFlagColor } from '@/lib/utils'
import { Flag, ShieldAlert, AlertTriangle, Radio } from 'lucide-react'

interface RaceControlFeedProps {
  messages: RaceControl[] | undefined
  drivers: Driver[] | undefined
}

export default function RaceControlFeed({ messages }: RaceControlFeedProps) {
  const recentMessages = messages ? [...messages].reverse().slice(0, 25) : []

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Flag': return Flag
      case 'SafetyCar': return ShieldAlert
      case 'CarEvent': return AlertTriangle
      default: return Radio
    }
  }

  return (
    <div className="bg-f1-surface rounded-xl border border-f1-border overflow-hidden">
      <div className="px-4 py-3 border-b border-f1-border flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">
          Race Control
        </h3>
        {messages && (
          <span className="text-xs text-f1-muted font-mono">{messages.length} msgs</span>
        )}
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {recentMessages.length === 0 ? (
          <div className="p-4">
            <p className="text-f1-muted text-sm">No messages yet...</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {recentMessages.map((msg, index) => {
              const IconComponent = getCategoryIcon(msg.category)
              const flagColor = getFlagColor(msg.flag)
              return (
                <div
                  key={`${msg.date}-${index}`}
                  className="bg-f1-dark/60 rounded-lg p-2.5 border-l-2 animate-slide-in"
                  style={{ borderLeftColor: flagColor }}
                >
                  <div className="flex items-start gap-2">
                    <IconComponent
                      size={13}
                      className="mt-0.5 flex-shrink-0"
                      style={{ color: flagColor }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] text-white/90 leading-relaxed break-words">
                        {msg.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {msg.lap_number && (
                          <span className="text-[10px] text-f1-muted font-mono bg-f1-surface rounded px-1.5 py-0.5">
                            Lap {msg.lap_number}
                          </span>
                        )}
                        <span className="text-[10px] text-f1-muted/50">
                          {new Date(msg.date).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
