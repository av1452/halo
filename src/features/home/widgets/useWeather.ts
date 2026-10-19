import { useEffect, useState } from 'react'
import { useNow } from '../../../hooks/useNow'
import { fetchWeather, WeatherError } from '../../../services/weather'
import { placeKey, weatherStore } from '../widgetStores'

const MAX_AGE_MS = 30 * 60_000

interface FetchOutcome {
  /** Which request this outcome belongs to */
  token: string
  error: string | null
}

/**
 * Loads weather for the saved place when the cached report is missing or
 * older than 30 minutes. `loading` is derived: a request is in flight when
 * the current token has no outcome yet.
 */
export function useWeather() {
  const { place, cache } = weatherStore.use()
  const now = useNow()
  const [manual, setManual] = useState(0)
  const [outcome, setOutcome] = useState<FetchOutcome | null>(null)
  const key = place ? placeKey(place) : null
  const report = cache && cache.placeKey === key ? cache : null
  const stale = !report || now.getTime() - report.fetchedAt > MAX_AGE_MS
  const wantsFetch = !!place && (stale || manual > 0)
  const token = `${key}|${manual}|${stale}`

  useEffect(() => {
    if (!place || !wantsFetch) return
    let cancelled = false
    fetchWeather(place)
      .then((data) => {
        weatherStore.set((s) => ({ ...s, cache: { ...data, placeKey: placeKey(place) } }))
        if (!cancelled) setOutcome({ token, error: null })
      })
      .catch((e: unknown) => {
        if (!cancelled) setOutcome({ token, error: e instanceof WeatherError ? e.message : 'Weather is unavailable right now.' })
      })
    return () => {
      cancelled = true
    }
  }, [place, wantsFetch, token])

  const settled = outcome?.token === token
  return {
    place,
    report,
    loading: wantsFetch && !settled,
    error: settled ? outcome.error : null,
    refresh: () => setManual((m) => m + 1),
  }
}
