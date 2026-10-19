import { expect, test } from '@playwright/test'
import { blockExternal } from './helpers'

test.beforeEach(async ({ page }) => blockExternal(page))

test('a custom shortcut survives a reload', async ({ page }) => {
  await page.goto('/apps')
  await page.getByRole('button', { name: 'Add shortcut' }).click()
  const dialog = page.getByRole('dialog', { name: 'New Shortcut' })
  await dialog.getByLabel('Name').fill('Field Notes')
  await dialog.getByLabel('Address').fill('fieldnotes.example')
  await dialog.getByRole('button', { name: 'Add' }).click()
  await page.reload()
  await expect(page.getByRole('link', { name: 'Field Notes' })).toHaveAttribute('href', 'https://fieldnotes.example/')
})

test('smart home demo state survives a reload', async ({ page }) => {
  await page.goto('/smart-home')
  const lamp = page.getByRole('list', { name: 'Living Room devices' }).getByRole('button', { name: 'Floor Lamp', exact: true })
  await lamp.click()
  await expect(lamp).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(page.getByRole('list', { name: 'Living Room devices' }).getByRole('button', { name: 'Floor Lamp', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('dashboard edits and theme survive a reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Edit' }).click()
  await page.getByRole('button', { name: 'Remove Calendar' }).click()
  await page.getByRole('button', { name: 'Done' }).click()
  await page.goto('/settings')
  await page.getByRole('radio', { name: 'Dark' }).click()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Clock' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Calendar' })).toHaveCount(0)
})

test('search finds and opens a device', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Search Halo' }).first().click()
  await page.getByRole('combobox', { name: 'Search Halo' }).fill('front door')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/smart-home\?device=k-entry/)
  await expect(page.getByRole('dialog', { name: 'Front Door' })).toBeVisible()
})
