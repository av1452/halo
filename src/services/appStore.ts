/**
 * Apple's public iTunes Search API (documented, no key, CORS enabled).
 * Apple asks clients to stay around 20 calls per minute, so results are
 * cached in memory and searches only run when the user submits them.
 * Requests send the search term or app ID and nothing else.
 */
import { isArrayOf, isNumber, isRecord, isString } from '../utils/guards'

export interface AppStoreApp {
  id: number
  name: string
  developer: string
  genre: string
  description: string
  iconUrl: string
  screenshots: string[]
  price: string
  rating?: number
  ratingCount?: number
  url: string
}

type FetchFn = (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>

export class AppStoreError extends Error {}

const cache = new Map<string, AppStoreApp[]>()
const isStringArray = isArrayOf(isString)
const httpsOnly = (u: string) => u.startsWith('https://')

export function parseApp(raw: unknown): AppStoreApp | null {
  if (!isRecord(raw) || !isNumber(raw.trackId) || !isString(raw.trackName) || !isString(raw.trackViewUrl)) return null
  const screenshots = [raw.screenshotUrls, raw.ipadScreenshotUrls].flatMap((s) => (isStringArray(s) ? s : [])).filter(httpsOnly)
  const icon = [raw.artworkUrl512, raw.artworkUrl100, raw.artworkUrl60].find(isString)
  return {
    id: raw.trackId,
    name: raw.trackName,
    developer: isString(raw.sellerName) ? raw.sellerName : isString(raw.artistName) ? raw.artistName : '',
    genre: isString(raw.primaryGenreName) ? raw.primaryGenreName : '',
    description: isString(raw.description) ? raw.description : '',
    iconUrl: icon && httpsOnly(icon) ? icon : '',
    screenshots: screenshots.slice(0, 6),
    price: isString(raw.formattedPrice) ? raw.formattedPrice : '',
    rating: isNumber(raw.averageUserRating) ? raw.averageUserRating : undefined,
    ratingCount: isNumber(raw.userRatingCount) ? raw.userRatingCount : undefined,
    url: `https://apps.apple.com/app/id${raw.trackId}`,
  }
}

async function request(url: string, fetchFn: FetchFn): Promise<AppStoreApp[]> {
  const hit = cache.get(url)
  if (hit) return hit
  let res
  try {
    res = await fetchFn(url)
  } catch {
    throw new AppStoreError('Couldn’t reach the App Store. Check your connection.')
  }
  if (!res.ok) throw new AppStoreError(res.status === 403 || res.status === 429 ? 'The App Store is limiting requests. Try again in a minute.' : `The App Store returned an error (${res.status}).`)
  const data = await res.json().catch(() => null)
  if (!isRecord(data) || !Array.isArray(data.results)) throw new AppStoreError('The App Store sent an unexpected response.')
  const apps = data.results.map(parseApp).filter((a): a is AppStoreApp => a !== null)
  cache.set(url, apps)
  return apps
}

/** Region for store links and prices, from the browser locale (e.g. en-GB → gb). */
export function storeCountry(locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US') {
  const region = locale.split('-')[1]
  return region && /^[a-z]{2}$/i.test(region) ? region.toLowerCase() : 'us'
}

export function searchApps(term: string, fetchFn: FetchFn = fetch, country = storeCountry()) {
  const params = new URLSearchParams({ term: term.trim(), entity: 'software', limit: '15', country })
  return request(`https://itunes.apple.com/search?${params}`, fetchFn)
}

export async function lookupApp(id: number, fetchFn: FetchFn = fetch, country = storeCountry()): Promise<AppStoreApp | null> {
  const [app] = await request(`https://itunes.apple.com/lookup?id=${id}&country=${country}`, fetchFn)
  return app ?? null
}

export function clearAppStoreCache() {
  cache.clear()
}
