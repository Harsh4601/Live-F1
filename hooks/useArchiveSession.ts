'use client'

import useSWR from 'swr'
import {
  fetchLTJson,
  ltUrl,
  type LTSessionInfo,
  transformSession,
  transformDrivers,
  transformWeather,
  transformRaceControl,
  buildLeaderboardFromLT,
} from '@/lib/f1LiveTiming'
import type { Session, Driver, Weather, RaceControl, LeaderboardEntry } from '@/lib/types'

const SWR_ARCHIVE = {
  revalidateOnFocus: false,
  errorRetryCount: 2,
  errorRetryInterval: 5000,
  revalidateOnReconnect: false,
}

function fetcher<T>(url: string) {
  return fetchLTJson<T>(url)
}

export function useArchiveSession(path: string | null) {
  const { data: sessionInfo } = useSWR<LTSessionInfo>(
    path ? ltUrl('SessionInfo', path) : null,
    fetcher,
    SWR_ARCHIVE,
  )

  const { data: rawDrivers } = useSWR<Record<string, any>>(
    path ? ltUrl('DriverList', path) : null,
    fetcher,
    SWR_ARCHIVE,
  )

  const { data: rawTiming } = useSWR<any>(
    path ? ltUrl('TimingData', path) : null,
    fetcher,
    SWR_ARCHIVE,
  )

  const { data: rawTimingApp } = useSWR<any>(
    path ? ltUrl('TimingAppData', path) : null,
    fetcher,
    SWR_ARCHIVE,
  )

  const { data: rawWeather } = useSWR<any>(
    path ? ltUrl('WeatherData', path) : null,
    fetcher,
    SWR_ARCHIVE,
  )

  const { data: rawRC } = useSWR<any>(
    path ? ltUrl('RaceControlMessages', path) : null,
    fetcher,
    SWR_ARCHIVE,
  )

  const session: Session | undefined = sessionInfo
    ? transformSession(sessionInfo)
    : undefined

  const drivers: Driver[] | undefined = rawDrivers
    ? transformDrivers(rawDrivers)
    : undefined

  const leaderboard: LeaderboardEntry[] =
    rawTiming && rawDrivers
      ? buildLeaderboardFromLT(rawTiming, rawDrivers, rawTimingApp)
      : []

  const weather: Weather | undefined = rawWeather
    ? transformWeather(rawWeather)
    : undefined

  const raceControl: RaceControl[] | undefined = rawRC
    ? transformRaceControl(rawRC)
    : undefined

  const isLoading = path != null && !sessionInfo

  return { session, drivers, leaderboard, weather, raceControl, isLoading }
}
