/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// HALO_BASE lets CI build for a GitHub Pages project path (e.g. /halo/).
const base = process.env.HALO_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [react()],
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
