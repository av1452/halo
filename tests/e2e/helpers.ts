import { expect, type Page } from '@playwright/test'

export const SECTIONS = [
  { label: 'Home', path: '/' },
  { label: 'Apps', path: '/apps' },
  { label: 'Smart Home', path: '/smart-home' },
  { label: 'Media', path: '/media' },
  { label: 'Discover', path: '/discover' },
  { label: 'Settings', path: '/settings' },
]

/** The primary nav that is actually visible at this viewport. */
export function primaryNav(page: Page) {
  return page.getByRole('navigation', { name: 'Primary' }).filter({ visible: true })
}

export async function expectNoHorizontalOverflow(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.scrollingElement!.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(scrollWidth, 'page should not scroll horizontally').toBeLessThanOrEqual(innerWidth)
}

/** Blocks third-party requests so tests are deterministic and offline-safe. */
export async function blockExternal(page: Page) {
  await page.route(/^https?:\/\/(?!localhost)/, (route) => route.abort())
}
