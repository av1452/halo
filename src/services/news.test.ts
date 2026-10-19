import { clearNewsCache, fetchTopStories } from './news'

it('fetches top stories, falling back to the discussion link and caching results', async () => {
  clearNewsCache()
  const fetchFn = vi.fn(async (url: string) => ({
    ok: true,
    json: async () =>
      url.endsWith('topstories.json') ? [1, 2] : url.includes('/1.json') ? { id: 1, title: 'Ask HN', score: 5 } : { id: 2, title: 'Link', url: 'https://ex.com', score: 9 },
  }))
  const stories = await fetchTopStories(2, fetchFn, 0)
  expect(stories).toEqual([
    { id: 1, title: 'Ask HN', url: 'https://news.ycombinator.com/item?id=1', score: 5 },
    { id: 2, title: 'Link', url: 'https://ex.com', score: 9 },
  ])
  await fetchTopStories(2, fetchFn, 1000)
  expect(fetchFn).toHaveBeenCalledTimes(3)
})
