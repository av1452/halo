/**
 * Top stories from the public Hacker News API (no key, CORS enabled).
 * Requests contain no personal data. Results are cached in memory briefly.
 */
import { isArrayOf, isNumber, isRecord, isString } from '../utils/guards'

export interface Story {
  id: number
  title: string
  url: string
  score: number
}

type FetchFn = (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>
const BASE = 'https://hacker-news.firebaseio.com/v0'
const TTL_MS = 15 * 60_000
let cache: { at: number; stories: Story[] } | null = null

export function clearNewsCache() {
  cache = null
}

export async function fetchTopStories(count = 5, fetchFn: FetchFn = fetch, now = Date.now()): Promise<Story[]> {
  if (cache && now - cache.at < TTL_MS) return cache.stories
  const list = await fetchFn(`${BASE}/topstories.json`).then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP error'))))
  if (!isArrayOf(isNumber)(list)) throw new Error('Unexpected response')
  const items = await Promise.all(list.slice(0, count).map((id) => fetchFn(`${BASE}/item/${id}.json`).then((r) => r.json()).catch(() => null)))
  const stories = items.flatMap((item) =>
    isRecord(item) && isNumber(item.id) && isString(item.title)
      ? [{
          id: item.id,
          title: item.title,
          url: isString(item.url) && /^https?:\/\//.test(item.url) ? item.url : `https://news.ycombinator.com/item?id=${item.id}`,
          score: isNumber(item.score) ? item.score : 0,
        }]
      : [],
  )
  cache = { at: now, stories }
  return stories
}
