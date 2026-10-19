export type Appearance = 'system' | 'light' | 'dark'
export type GlassIntensity = 'subtle' | 'balanced' | 'vivid'

export interface AccentColor {
  id: string
  name: string
  hex: string
}

export interface Wallpaper {
  id: string
  name: string
  /** CSS background value for light mode */
  light: string
  /** CSS background value for dark mode */
  dark: string
}

export const ACCENTS: readonly AccentColor[] = [
  { id: 'blue', name: 'Blue', hex: '#0a84ff' },
  { id: 'indigo', name: 'Indigo', hex: '#5e5ce6' },
  { id: 'purple', name: 'Purple', hex: '#bf5af2' },
  { id: 'pink', name: 'Pink', hex: '#ff375f' },
  { id: 'orange', name: 'Orange', hex: '#ff9f0a' },
  { id: 'green', name: 'Green', hex: '#30b158' },
  { id: 'teal', name: 'Teal', hex: '#40b3c8' },
  { id: 'graphite', name: 'Graphite', hex: '#8e8e93' },
]

export const WALLPAPERS: readonly Wallpaper[] = [
  {
    id: 'dusk',
    name: 'Dusk',
    light: 'radial-gradient(120% 80% at 10% 0%, #8fb8ff 0%, transparent 60%), radial-gradient(90% 70% at 100% 100%, #f4a6c1 0%, transparent 60%), linear-gradient(160deg, #6f8ff0 0%, #a07fd8 50%, #f0a0b8 100%)',
    dark: 'radial-gradient(120% 80% at 10% 0%, #22357a 0%, transparent 60%), radial-gradient(90% 70% at 100% 100%, #5a2148 0%, transparent 60%), linear-gradient(160deg, #10183a 0%, #2a1a48 50%, #3a1530 100%)',
  },
  {
    id: 'lagoon',
    name: 'Lagoon',
    light: 'radial-gradient(100% 70% at 0% 100%, #7fe3d0 0%, transparent 60%), linear-gradient(200deg, #6cc4f0 0%, #4f8fe0 55%, #57c7b0 100%)',
    dark: 'radial-gradient(100% 70% at 0% 100%, #0f4a48 0%, transparent 60%), linear-gradient(200deg, #0b2a44 0%, #0b1f3a 55%, #0d3b36 100%)',
  },
  {
    id: 'ember',
    name: 'Ember',
    light: 'radial-gradient(90% 70% at 90% 0%, #ffd27a 0%, transparent 60%), linear-gradient(170deg, #ff9a6b 0%, #f0607a 55%, #9a5fd0 100%)',
    dark: 'radial-gradient(90% 70% at 90% 0%, #5a3510 0%, transparent 60%), linear-gradient(170deg, #3d1a12 0%, #3a1222 55%, #23143e 100%)',
  },
  {
    id: 'meadow',
    name: 'Meadow',
    light: 'radial-gradient(110% 80% at 20% 10%, #d8f5a0 0%, transparent 60%), linear-gradient(150deg, #9fdc8c 0%, #5fbf9a 55%, #4a9cc0 100%)',
    dark: 'radial-gradient(110% 80% at 20% 10%, #24401a 0%, transparent 60%), linear-gradient(150deg, #142a18 0%, #0f2a26 55%, #0e2234 100%)',
  },
  {
    id: 'graphite',
    name: 'Graphite',
    light: 'radial-gradient(100% 80% at 50% 0%, #ffffff 0%, transparent 70%), linear-gradient(180deg, #d9dce3 0%, #b9bec9 100%)',
    dark: 'radial-gradient(100% 80% at 50% 0%, #3a3a40 0%, transparent 70%), linear-gradient(180deg, #1c1c20 0%, #0c0c0e 100%)',
  },
]

export interface ThemeSettings {
  appearance: Appearance
  accent: string
  wallpaper: string
  glass: GlassIntensity
  reduceMotion: boolean
  reduceTransparency: boolean
  increaseContrast: boolean
}

export const DEFAULT_THEME: ThemeSettings = {
  appearance: 'system',
  accent: 'blue',
  wallpaper: 'dusk',
  glass: 'balanced',
  reduceMotion: false,
  reduceTransparency: false,
  increaseContrast: false,
}

export function resolveAppearance(appearance: Appearance, prefersDark: boolean): 'light' | 'dark' {
  if (appearance === 'system') return prefersDark ? 'dark' : 'light'
  return appearance
}

export function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.replace(/./g, (c) => c + c) : clean
  const n = parseInt(full, 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

export function findAccent(id: string): AccentColor {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS[0]
}

export function findWallpaper(id: string): Wallpaper {
  return WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0]
}

/** Writes theme state onto <html> so the CSS tokens can react to it. */
export function applyTheme(settings: ThemeSettings, prefersDark: boolean, root = document.documentElement) {
  const mode = resolveAppearance(settings.appearance, prefersDark)
  const accent = findAccent(settings.accent)
  const wallpaper = findWallpaper(settings.wallpaper)

  root.dataset.theme = mode
  root.dataset.glass = settings.glass
  root.dataset.motion = settings.reduceMotion ? 'reduced' : 'full'
  root.dataset.transparency = settings.reduceTransparency ? 'reduced' : 'full'
  root.dataset.contrast = settings.increaseContrast ? 'more' : 'normal'
  root.style.setProperty('--accent', accent.hex)
  root.style.setProperty('--accent-rgb', hexToRgb(accent.hex))
  root.style.setProperty('--wallpaper', mode === 'dark' ? wallpaper.dark : wallpaper.light)

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', mode === 'dark' ? '#000000' : '#f2f2f7')
}
