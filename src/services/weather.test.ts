import { describeWeather, fetchWeather, searchPlaces, WeatherError } from './weather'

const place = { name: 'Lisbon', latitude: 38.7167, longitude: -9.1333 }
const ok = (body: unknown) => async (_url: string) => ({ ok: true, status: 200, json: async () => body })

describe('weather service', () => {
  it('parses an Open-Meteo forecast', async () => {
    const fetchFn = vi.fn(ok({ current: { temperature_2m: 18.4, weather_code: 2 }, daily: { temperature_2m_max: [21], temperature_2m_min: [12] } }))
    const report = await fetchWeather(place, fetchFn, 1000)
    expect(report).toEqual({ temperature: 18.4, code: 2, high: 21, low: 12, fetchedAt: 1000 })
    expect(fetchFn.mock.calls[0][0]).toContain('latitude=38.717&longitude=-9.133')
  })

  it('reports network, HTTP and malformed-data failures', async () => {
    await expect(fetchWeather(place, async () => Promise.reject(new TypeError('offline')))).rejects.toThrow('Couldn’t reach')
    await expect(fetchWeather(place, async () => ({ ok: false, status: 429, json: async () => ({}) }))).rejects.toThrow('(429)')
    await expect(fetchWeather(place, ok({ nope: true }))).rejects.toBeInstanceOf(WeatherError)
  })

  it('searches places and skips incomplete results', async () => {
    const places = await searchPlaces('spring', ok({ results: [{ name: 'Springfield', admin1: 'Illinois', country: 'United States', latitude: 39.8, longitude: -89.6 }, { name: 'Broken' }] }))
    expect(places).toEqual([{ name: 'Springfield', region: 'Illinois, United States', latitude: 39.8, longitude: -89.6 }])
    expect(await searchPlaces('zzz', ok({}))).toEqual([])
  })

  it('maps WMO codes', () => {
    expect(describeWeather(0).label).toBe('Clear')
    expect(describeWeather(63).icon).toBe('rain')
    expect(describeWeather(95).icon).toBe('storm')
  })
})
