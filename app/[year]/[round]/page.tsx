import { redirect } from 'next/navigation'
import LiveDashboard from '@/app/dashboard/LiveDashboard'

interface PageProps {
  params: Promise<{ year: string; round: string }>
}

const SUPPORTED_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025]

export default async function HistoricalRacePage({ params }: PageProps) {
  const { year: yearStr, round: roundStr } = await params
  const year = Number(yearStr)
  const round = Number(roundStr)

  if (!SUPPORTED_YEARS.includes(year) || isNaN(round) || round < 1 || round > 24) {
    redirect('/')
  }

  // Fetch race info from Ergast to get the race date for our props
  let dateStart = `${year}-01-01`
  let dateEnd   = `${year}-12-31`

  try {
    const res = await fetch(
      `https://api.jolpi.ca/ergast/f1/${year}/${round}/races.json`,
      { next: { revalidate: 86400 } }, // cache for 24h — historical data never changes
    )
    if (res.ok) {
      const data = await res.json()
      const race = data?.MRData?.RaceTable?.Races?.[0]
      if (race?.date) {
        // Race day is the end date; approximate Friday (start) as race day − 2
        const raceDate = new Date(race.date + 'T12:00:00Z')
        const fridayDate = new Date(raceDate)
        fridayDate.setUTCDate(fridayDate.getUTCDate() - 2)
        dateStart = fridayDate.toISOString().split('T')[0]
        dateEnd   = race.date
      }
    }
  } catch { /* use fallback dates — isHistorical will prevent live-mode anyway */ }

  return (
    <LiveDashboard
      sessionsApiUrl={`/api/lt/sessions?year=${year}&round=${round}`}
      dateStart={dateStart}
      dateEnd={dateEnd}
      isHistorical={true}
    />
  )
}
