import { expect, test } from '@playwright/test'

test('works offline after the first visit', async ({ page, context }, info) => {
  test.skip(info.project.name === 'ipad', 'covered by the iPhone WebKit run')
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)

  await context.setOffline(true)
  await page.goto('/media')
  await expect(page.getByRole('heading', { level: 1, name: 'Media' })).toBeVisible()
  await page.goto('/apps?filter=favorites')
  await expect(page.getByRole('heading', { level: 1, name: 'Apps' })).toBeVisible()
  await context.setOffline(false)
})

test('serves a valid manifest', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest')
  expect(res.ok()).toBe(true)
  const manifest = await res.json()
  expect(manifest.display).toBe('standalone')
  for (const icon of manifest.icons) expect((await request.get(`/${icon.src}`)).ok()).toBe(true)
})
