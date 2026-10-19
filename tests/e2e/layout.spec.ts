import { expect, test } from '@playwright/test'
import { blockExternal } from './helpers'

test.beforeEach(async ({ page }) => blockExternal(page))

test('uses a tab bar on phones and a sidebar on larger screens', async ({ page }, info) => {
  await page.goto('/')
  // Both navs are in the DOM (sidebar first); CSS shows one. getByRole would skip the hidden one.
  const navs = page.locator('nav[aria-label="Primary"]')
  await expect(navs).toHaveCount(2)
  const sidebarVisible = await navs.nth(0).isVisible()
  const tabBarVisible = await navs.nth(1).isVisible()
  if (info.project.name === 'iphone') {
    expect(tabBarVisible).toBe(true)
    expect(sidebarVisible).toBe(false)
  } else {
    expect(tabBarVisible).toBe(false)
    expect(sidebarVisible).toBe(true)
  }
})

test('the tab bar does not cover the last content on phones', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone', 'phone layout only')
  await page.goto('/settings')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  const lastRow = page.getByText('Independent project')
  const tabBar = page.locator('nav[aria-label="Primary"]').nth(1)
  const [row, bar] = [await lastRow.boundingBox(), await tabBar.boundingBox()]
  expect(row!.y + row!.height).toBeLessThanOrEqual(bar!.y)
})

test('the dashboard uses multiple columns on iPad', async ({ page }, info) => {
  test.skip(info.project.name !== 'ipad', 'tablet layout only')
  await page.goto('/')
  const clock = await page.getByRole('region', { name: 'Clock' }).boundingBox()
  const weather = await page.getByRole('region', { name: 'Weather' }).boundingBox()
  expect(Math.abs(clock!.y - weather!.y)).toBeLessThan(4) // side by side
})
