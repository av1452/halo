// Renders the SVG icons in public/icons to the PNG sizes the manifest and
// iOS need. Run with `npm run icons` after changing the artwork.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const dir = fileURLToPath(new URL('../public/icons/', import.meta.url))
const jobs = [
  { src: 'halo.svg', out: 'halo-192.png', size: 192 },
  { src: 'halo.svg', out: 'halo-512.png', size: 512 },
  { src: 'halo-maskable.svg', out: 'halo-maskable-512.png', size: 512 },
  // iOS applies its own rounded mask, so the touch icon is full-bleed
  { src: 'halo-maskable.svg', out: 'apple-touch-icon.png', size: 180 },
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const { src, out, size } of jobs) {
  const svg = readFileSync(dir + src, 'utf8')
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`)
  await page.locator('svg').screenshot({ path: dir + out, omitBackground: true })
  console.log(`wrote ${out}`)
}
await browser.close()
