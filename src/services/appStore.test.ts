import { clearAppStoreCache, lookupApp, parseApp, searchApps, storeCountry } from './appStore'

const raw = {
  trackId: 42,
  trackName: 'Example',
  trackViewUrl: 'https://apps.apple.com/us/app/example/id42?uo=4',
  sellerName: 'Example Inc.',
  primaryGenreName: 'Utilities',
  artworkUrl512: 'https://is1-ssl.mzstatic.com/x/512.png',
  screenshotUrls: ['https://is1-ssl.mzstatic.com/a.png', 'http://insecure.example/b.png'],
  formattedPrice: 'Free',
  averageUserRating: 4.6,
  userRatingCount: 1200,
}
const respond = (body: unknown, status = 200) => vi.fn(async (_url: string) => ({ ok: status === 200, status, json: async () => body }))

describe('App Store service', () => {
  beforeEach(() => clearAppStoreCache())

  it('parses results and keeps only https media', () => {
    expect(parseApp(raw)).toMatchObject({ id: 42, name: 'Example', developer: 'Example Inc.', screenshots: ['https://is1-ssl.mzstatic.com/a.png'], url: 'https://apps.apple.com/app/id42' })
    expect(parseApp({ trackName: 'missing id' })).toBeNull()
  })

  it('searches software in the given storefront and caches results', async () => {
    const fetchFn = respond({ resultCount: 1, results: [raw] })
    expect(await searchApps('notes app', fetchFn, 'gb')).toHaveLength(1)
    expect(fetchFn.mock.calls[0][0]).toBe('https://itunes.apple.com/search?term=notes+app&entity=software&limit=15&country=gb')
    await searchApps('notes app', fetchFn, 'gb')
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('explains rate limiting and bad responses', async () => {
    await expect(lookupApp(1, respond({}, 429), 'us')).rejects.toThrow('limiting requests')
    await expect(lookupApp(2, respond({ nope: 1 }), 'us')).rejects.toThrow('unexpected response')
    expect(await lookupApp(3, respond({ results: [] }), 'us')).toBeNull()
  })

  it('derives the storefront from the locale', () => {
    expect(storeCountry('en-GB')).toBe('gb')
    expect(storeCountry('fr')).toBe('us')
  })
})
