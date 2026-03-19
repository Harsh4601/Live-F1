import { redirect } from 'next/navigation'
import { getRaceBySlug, getCurrentOrNextRace, getSessionUTC, type F1Race } from '@/lib/f1Calendar'
import LiveDashboard from '@/app/dashboard/LiveDashboard'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ slug: string }>
}

function UpcomingRacePage({ race }: { race: F1Race }) {
  const dayLabels = ['', 'Friday', 'Saturday', 'Sunday']

  const sessionsByDay: Record<number, typeof race.sessions> = {}
  for (const s of race.sessions) {
    if (!sessionsByDay[s.day]) sessionsByDay[s.day] = []
    sessionsByDay[s.day].push(s)
  }

  const sessionColor = (shortName: string) => {
    if (shortName === 'R')   return 'border-f1-red/40 bg-f1-red/5 text-f1-red'
    if (shortName === 'SPR') return 'border-f1-purple/40 bg-f1-purple/5 text-f1-purple'
    if (shortName === 'Q' || shortName === 'SQ') return 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400'
    return 'border-f1-border/60 bg-f1-surface text-f1-muted'
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 py-10 space-y-6">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-f1-muted hover:text-white text-xs font-mono uppercase tracking-wider transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Calendar
      </Link>

      {/* Header card */}
      <div className="bg-f1-surface rounded-2xl border border-f1-border overflow-hidden">
        <div className="h-[3px] bg-gradient-to-r from-f1-red via-f1-red/50 to-transparent" />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{race.flag}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-f1-red text-xs font-mono font-bold uppercase tracking-wider">
                      Round {race.round}
                    </span>
                    {race.hasSprint && (
                      <span className="text-[10px] font-bold text-f1-purple bg-f1-purple/20 px-2 py-0.5 rounded uppercase tracking-wider border border-f1-purple/30">
                        Sprint Weekend
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-white">{race.name}</h1>
                  <p className="text-f1-muted text-sm mt-0.5">{race.circuitName} · {race.city}</p>
                </div>
              </div>
            </div>

            {/* Upcoming badge */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 bg-f1-dark border border-f1-border rounded-xl px-4 py-2.5">
                <svg className="w-4 h-4 text-f1-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-white font-mono text-sm font-bold">
                  {new Date(race.dateStart + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  {' – '}
                  {new Date(race.dateEnd + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <span className="text-[10px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-3 py-1 rounded-lg font-bold uppercase tracking-wider">
                Race Not Started Yet
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Session schedule */}
      <div className="bg-f1-surface rounded-2xl border border-f1-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-f1-border flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/80">Weekend Schedule</h2>
          <span className="text-[10px] text-f1-muted font-mono">Your local time</span>
        </div>
        <div className="divide-y divide-f1-border/50">
          {Object.entries(sessionsByDay).map(([day, sessions]) => {
            const firstSession = sessions[0]
            const sessionDate = getSessionUTC(race.dateStart, firstSession, race.utcOffset)
            const dateLabel = sessionDate.toLocaleDateString(undefined, {
              weekday: 'long', month: 'short', day: 'numeric',
            })
            return (
              <div key={day} className="p-5">
                <div className="text-[10px] text-f1-muted font-mono uppercase tracking-widest mb-3">
                  {dayLabels[Number(day)]} · {dateLabel}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sessions.map((session) => {
                    const utcDate = getSessionUTC(race.dateStart, session, race.utcOffset)
                    const localTime = utcDate.toLocaleTimeString(undefined, {
                      hour: '2-digit', minute: '2-digit', hour12: true,
                    })
                    return (
                      <div
                        key={session.shortName}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border ${sessionColor(session.shortName)}`}
                      >
                        <div className="text-xs font-mono font-bold w-8 flex-shrink-0">
                          {session.shortName}
                        </div>
                        <span className="text-sm text-white flex-1">{session.name}</span>
                        <span className="text-xs font-mono tabular-nums flex-shrink-0 text-f1-muted">
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

      <p className="text-center text-f1-muted text-xs font-mono pb-4">
        Live timing will be available once the weekend begins · Not affiliated with Formula 1
      </p>
    </div>
  )
}

export default async function RaceDashboardPage({ params }: PageProps) {
  const { slug } = await params

  if (slug === 'dashboard') {
    redirect(`/${getCurrentOrNextRace().slug}`)
  }

  const race = getRaceBySlug(slug)
  if (!race) {
    redirect('/')
  }

  const today = new Date().toISOString().split('T')[0]
  const isFuture = race.dateStart > today

  if (isFuture) {
    return <UpcomingRacePage race={race} />
  }

  return (
    <LiveDashboard
      sessionsApiUrl={`/api/lt/sessions?slug=${race.slug}`}
      dateStart={race.dateStart}
      dateEnd={race.dateEnd}
    />
  )
}
