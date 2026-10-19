/// <reference types="vitest/config" />
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * GitHub Pages has no SPA rewrites; serving the app shell as 404.html lets
 * deep links like /halo/smart-home load the app instead of a GitHub error.
 */
function spaFallback(): Plugin {
  let outDir = 'dist'
  return {
    name: 'halo-spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

// HALO_BASE lets CI build for a GitHub Pages project path (e.g. /halo/).
const base = process.env.HALO_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [react(), spaFallback()],
  build: {
    // Safari 14+ gets the full experience; older browsers are handled separately.
    target: ['es2020', 'safari14'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}'],
    css: false,
  },
})
