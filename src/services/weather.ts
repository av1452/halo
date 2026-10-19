/**
 * Weather from Open-Meteo (https://open-meteo.com): free for non-commercial
 * use, no API key, CORS enabled. Only the chosen coordinates are sent.
 */
import { isArrayOf, isNumber, isRecord, isString } from '../utils/guards'

export interface Place {
  name: string
  region?: string
  latitude: number
  longitude: number
}

export interface WeatherReport {
  temperature: number
  high: number
  low: number
  code: number
  fetchedAt: number
}

type FetchFn = (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>

export class WeatherError extends Error {}

async function getJson(fetchFn: FetchFn, url: string): Promise<unknown> {
  let response
  try {
    response = await fetchFn(url)
  } catch {
    throw new WeatherError('Couldn’t reach the weather service. Check your connection.')
  }
  if (!response.ok) throw new WeatherError(`The weather service returned an error (${response.status}).`)
  return response.json()
}

export async function fetchWeather(place: Place, fetchFn: FetchFn = fetch, now = Date.now()): Promise<WeatherReport> {
  const params = new URLSearchParams({
    latitude: place.latitude.toFixed(3),
    longitude: place.longitude.toFixed(3),
    current: 'temperature_2m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '1',
  })
  const data = await getJson(fetchFn, `https://api.open-meteo.com/v1/forecast?${params}`)
  const current = isRecord(data) && isRecord(data.current) ? data.current : null
  const daily = isRecord(data) && isRecord(data.daily) ? data.daily : null
  const highs = daily && isArrayOf(isNumber)(daily.temperature_2m_max) ? daily.temperature_2m_max : null
  const lows = daily && isArrayOf(isNumber)(daily.temperature_2m_min) ? daily.temperature_2m_min : null
  if (!current || !isNumber(current.temperature_2m) || !isNumber(current.weather_code) || !highs?.length || !lows?.length) {
    throw new WeatherError('The weather service sent data Halo didn’t understand.')
  }
  return { temperature: current.temperature_2m, code: current.weather_code, high: highs[0], low: lows[0], fetchedAt: now }
}

export async function searchPlaces(query: string, fetchFn: FetchFn = fetch): Promise<Place[]> {
  const params = new URLSearchParams({ name: query.trim(), count: '5', language: 'en', format: 'json' })
  const data = await getJson(fetchFn, `https://geocoding-api.open-meteo.com/v1/search?${params}`)
  const results = isRecord(data) && Array.isArray(data.results) ? data.results : []
  return results.filter(isRecord).flatMap((r) =>
    isString(r.name) && isNumber(r.latitude) && isNumber(r.longitude)
      ? [{ name: r.name, region: [r.admin1, r.country].filter(isString).join(', ') || undefined, latitude: r.latitude, longitude: r.longitude }]
      : [],
  )
}

/** WMO weather interpretation codes → label and icon key. */
export function describeWeather(code: number): { label: string; icon: 'sun' | 'cloud-sun' | 'cloud' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm' } {
  if (code === 0) return { label: 'Clear', icon: 'sun' }
  if (code <= 2) return { label: 'Partly cloudy', icon: 'cloud-sun' }
  if (code === 3) return { label: 'Overcast', icon: 'cloud' }
  if (code <= 48) return { label: 'Fog', icon: 'fog' }
  if (code <= 57) return { label: 'Drizzle', icon: 'drizzle' }
  if (code <= 67 || (code >= 80 && code <= 82)) return { label: 'Rain', icon: 'rain' }
  if (code <= 77 || code === 85 || code === 86) return { label: 'Snow', icon: 'snow' }
  return { label: 'Thunderstorm', icon: 'storm' }
}
