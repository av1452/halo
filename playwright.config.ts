import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests run against the production build (vite preview), not the
 * dev server, in iPhone and iPad WebKit (closest to Safari) and desktop Chromium.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    // Halo's reduced-motion styles remove all transitions and animations,
    // which keeps tests deterministic: in CI, headless WebKit on Linux didn't
    // finish CSS transitions, so elements never became "stable" to click.
    reducedMotion: 'reduce',
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'iphone', use: { ...devices['iPhone 15 Pro'] } },
    { name: 'ipad', use: { ...devices['iPad Pro 11 landscape'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
})
