import { expect, test } from '@playwright/test'

test('supported browsers never see the old-browser notice', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText('Halo needs a newer browser')).toHaveCount(0)
})

test('old browsers get a clear message instead of a blank page', async ({ page }) => {
  // Simulate Safari < 14: modern syntax fails to compile and the bundle can't run
  await page.addInitScript(() => {
    window.Function = function () {
      throw new SyntaxError('Unexpected token')
    } as unknown as FunctionConstructor
  })
  await page.route('**/assets/*.js', (route) => route.abort())
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('Halo needs a newer browser')
  await expect(page.getByRole('alert')).toContainText('iOS and iPadOS 14 or later')
})

test('reduce transparency makes every glass surface opaque', async ({ page }) => {
  await page.goto('/settings')
  await page.getByRole('switch', { name: 'Reduce transparency' }).check({ force: true })
  await expect(page.locator('html')).toHaveAttribute('data-transparency', 'reduced')
  const translucent = () =>
    page.locator('.glass, .glass-thin, .glass-thick, .glass-chrome').evaluateAll((els) =>
      els
        .map((el) => getComputedStyle(el))
        .filter((cs) => /, 0?\.\d+\)$/.test(cs.backgroundColor) || !['', 'none'].includes(cs.getPropertyValue('backdrop-filter') || cs.getPropertyValue('-webkit-backdrop-filter')))
        .map((cs) => cs.backgroundColor),
    )
  // Buttons fade their background over ~140ms, so poll until surfaces settle
  await expect.poll(translucent).toEqual([])
  expect(await page.locator('.glass, .glass-thin, .glass-thick, .glass-chrome').count()).toBeGreaterThan(5)
})
