import { expect, test } from '@playwright/test'
import { blockExternal, expectNoHorizontalOverflow, primaryNav, SECTIONS } from './helpers'

test.beforeEach(async ({ page }) => blockExternal(page))

test('navigates between every section without full reloads', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => ((window as unknown as { haloMarker: number }).haloMarker = 1))
  for (const { label, path } of SECTIONS) {
    await primaryNav(page).getByRole('link', { name: label, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`${path === '/' ? '/$' : path}$`))
    await expect(primaryNav(page).getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoHorizontalOverflow(page)
  }
  // The marker survives only if no document reload happened
  expect(await page.evaluate(() => (window as unknown as { haloMarker?: number }).haloMarker)).toBe(1)
})

test('supports back and forward', async ({ page }) => {
  await page.goto('/apps')
  await primaryNav(page).getByRole('link', { name: 'Media' }).click()
  await page.goBack()
  await expect(page).toHaveURL(/\/apps$/)
  await page.goForward()
  await expect(page).toHaveURL(/\/media$/)
})

test('loads deep links directly and shows a fallback for unknown routes', async ({ page }) => {
  await page.goto('/smart-home?room=kitchen')
  await expect(page.getByRole('list', { name: 'Kitchen devices' })).toBeVisible()
  await page.goto('/no/such/page')
  await expect(page.getByRole('heading', { name: 'This page doesn’t exist' })).toBeVisible()
})
