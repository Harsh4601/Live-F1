import type { Session, Meeting } from '@/lib/types'
import { MapPin, Clock, Calendar } from 'lucide-react'
import Image from 'next/image'
import f1LogoRed from '../f1-logo-red.avif'

interface RaceHeaderProps {
  session: Session | undefined
  meeting: Meeting | undefined
  isFinished?: boolean
}

export default function RaceHeader({ session, meeting, isFinished }: RaceHeaderProps) {
  if (!session) return null

  const isLive = !isFinished && session.date_end && new Date(session.date_end) > new Date()

  return (
    <div className="bg-f1-surface rounded-xl border border-f1-border overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-f1-red to-transparent" />
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Image
                  src={f1LogoRed}
                  alt="Formula 1"
                  className="h-6 w-auto md:h-7"
                />
                <span className="font-display text-sm md:text-base tracking-[0.35em] text-white/80 uppercase">
                  {session.year}
                </span>
              </div>
              {isFinished ? (
                <span className="flex items-center gap-1.5 bg-white/10 text-white px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border border-white/20">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Finished
                </span>
              ) : isLive ? (
                <span className="flex items-center gap-1.5 bg-f1-red/20 text-f1-red px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border border-f1-red/30">
                  <span className="w-2 h-2 bg-f1-red rounded-full animate-pulse-red" />
                  Live
                </span>
              ) : null}
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-white">
              {meeting?.meeting_name || `${session.country_name} Grand Prix`}
            </h2>

            <div className="flex items-center gap-4 mt-3 text-sm text-f1-muted flex-wrap">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-f1-red/70" />
                {session.circuit_short_name}, {session.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-f1-red/70" />
                {session.year}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-f1-red text-white rounded-lg px-5 py-3 text-center shadow-lg shadow-f1-red/20">
              <div className="text-[10px] uppercase tracking-widest opacity-80 mb-0.5">Session</div>
              <div className="font-bold text-lg leading-tight">{session.session_name}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-center">
              <div className="text-[10px] uppercase tracking-widest text-f1-muted mb-0.5">Circuit</div>
              <div className="font-bold text-base leading-tight">{session.circuit_short_name}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
