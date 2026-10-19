import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { blockExternal, SECTIONS } from './helpers'

test.beforeEach(async ({ page }) => blockExternal(page))

for (const scheme of ['light', 'dark'] as const) {
  for (const { label, path } of SECTIONS) {
    test(`${label} has no serious accessibility violations (${scheme})`, async ({ page }, info) => {
      test.skip(info.project.name === 'ipad', 'layout covered by iPhone and desktop runs')
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0]?.target.join(' ')}`)).toEqual([])
    })
  }
}

test('dialogs trap focus and return it to the trigger', async ({ page }) => {
  await page.goto('/apps')
  // Open with the keyboard: Safari doesn't focus buttons on click, so focus
  // return is only meaningful (and only needed) for keyboard users.
  await page.getByRole('button', { name: 'Add shortcut' }).focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'New Shortcut' })
  await expect(dialog.getByLabel('Name')).toBeFocused()
  for (let i = 0; i < 40; i++) await page.keyboard.press('Tab')
  expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Add shortcut' })).toBeFocused()
})
