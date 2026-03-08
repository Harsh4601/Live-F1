'use client'

import clsx from 'clsx'

export interface SessionTab {
  name: string
  path: string
  type: string
  status: string
  startDate: string
}

interface SessionTabsProps {
  sessions: SessionTab[]
  activeIndex: number
  liveIndex: number | null
  onSelect: (index: number) => void
}

export default function SessionTabs({
  sessions,
  activeIndex,
  liveIndex,
  onSelect,
}: SessionTabsProps) {
  if (sessions.length === 0) return null

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
      {sessions.map((session, i) => {
        const isActive = i === activeIndex
        const isLive = i === liveIndex
        const isCompleted = session.status === 'Finalised'

        return (
          <button
            key={session.path}
            onClick={() => onSelect(i)}
            className={clsx(
              'relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all',
              isActive
                ? 'bg-f1-surface text-white border border-f1-red/60'
                : 'text-f1-muted hover:text-white hover:bg-f1-surface/50 border border-transparent',
            )}
          >
            {isLive && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            )}
            <span>{session.name}</span>
            {isCompleted && !isLive && (
              <span className="text-[9px] text-f1-muted/60 font-normal normal-case">done</span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-f1-red rounded-full" />
            )}
          </button>
        )
      })}
    </div>
  )
}
