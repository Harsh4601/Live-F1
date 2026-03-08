'use client'

import useSWR from 'swr'
import { buildUrl, fetcher } from '@/lib/api'
import type {
  Session, Meeting, Driver, Position, Interval,
  Lap, Stint, PitStop, RaceControl, Weather,
} from '@/lib/types'

const SWR_BASE = {
  revalidateOnFocus: false,
  errorRetryCount: 5,
  errorRetryInterval: 3000,
  dedupingInterval: 5000,
}

export function useLatestSession() {
  return useSWR<Session[]>(
    buildUrl('sessions', { session_key: 'latest' }),
    fetcher,
    { ...SWR_BASE, refreshInterval: 60000 }
  )
}

export function useMeeting(meetingKey: number | undefined) {
  return useSWR<Meeting[]>(
    meetingKey ? buildUrl('meetings', { meeting_key: meetingKey.toString() }) : null,
    fetcher,
    { ...SWR_BASE, refreshInterval: 0 }
  )
}

export function useDrivers(sessionKey: number | undefined) {
  return useSWR<Driver[]>(
    sessionKey ? buildUrl('drivers', { session_key: sessionKey.toString() }) : null,
    fetcher,
    { ...SWR_BASE, refreshInterval: 0 }
  )
}

export function usePositions(sessionKey: number | undefined) {
  return useSWR<Position[]>(
    sessionKey ? buildUrl('position', { session_key: sessionKey.toString() }) : null,
    fetcher,
    { ...SWR_BASE, refreshInterval: 10000 }
  )
}

export function useIntervals(sessionKey: number | undefined, enabled: boolean = true) {
  return useSWR<Interval[]>(
    sessionKey && enabled ? buildUrl('intervals', { session_key: sessionKey.toString() }) : null,
    fetcher,
    { ...SWR_BASE, refreshInterval: 10000 }
  )
}

export function useLaps(sessionKey: number | undefined) {
  return useSWR<Lap[]>(
    sessionKey ? buildUrl('laps', { session_key: sessionKey.toString() }) : null,
    fetcher,
    { ...SWR_BASE, refreshInterval: 15000 }
  )
}

export function useStints(sessionKey: number | undefined) {
  return useSWR<Stint[]>(
    sessionKey ? buildUrl('stints', { session_key: sessionKey.toString() }) : null,
    fetcher,
    { ...SWR_BASE, refreshInterval: 20000 }
  )
}

export function usePitStops(sessionKey: number | undefined) {
  return useSWR<PitStop[]>(
    sessionKey ? buildUrl('pit', { session_key: sessionKey.toString() }) : null,
    fetcher,
    { ...SWR_BASE, refreshInterval: 20000 }
  )
}

export function useRaceControl(sessionKey: number | undefined) {
  return useSWR<RaceControl[]>(
    sessionKey ? buildUrl('race_control', { session_key: sessionKey.toString() }) : null,
    fetcher,
    { ...SWR_BASE, refreshInterval: 10000 }
  )
}

export function useWeather(sessionKey: number | undefined) {
  return useSWR<Weather[]>(
    sessionKey ? buildUrl('weather', { session_key: sessionKey.toString() }) : null,
    fetcher,
    { ...SWR_BASE, refreshInterval: 30000 }
  )
}
