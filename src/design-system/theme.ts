export type Appearance = 'system' | 'light' | 'dark'
export type GlassIntensity = 'subtle' | 'balanced' | 'vivid'

export interface AccentColor {
  id: string
  name: string
  /** Darker variant for light mode: ≥4.5:1 under white text and on light surfaces */
  light: string
  /** Brighter variant for dark mode: ≥4.5:1 as text on dark surfaces */
  dark: string
}

export interface Wallpaper {
  id: string
  name: string
  /** CSS background value for light mode */
  light: string
  /** CSS background value for dark mode */
  dark: string
}

// Variants were chosen with WCAG contrast calculations; theme.test.ts enforces them.
export const ACCENTS: readonly AccentColor[] = [
  { id: 'blue', name: 'Blue', light: '#0a6cd6', dark: '#0a84ff' },
  { id: 'indigo', name: 'Indigo', light: '#4f4dd6', dark: '#7d7aff' },
  { id: 'purple', name: 'Purple', light: '#8e3fc4', dark: '#bf5af2' },
  { id: 'pink', name: 'Pink', light: '#c8204a', dark: '#ff375f' },
  { id: 'orange', name: 'Orange', light: '#a85400', dark: '#ff9f0a' },
  { id: 'green', name: 'Green', light: '#1d7a3a', dark: '#30d158' },
  { id: 'teal', name: 'Teal', light: '#13758a', dark: '#40c8e0' },
  { id: 'graphite', name: 'Graphite', light: '#5f5f64', dark: '#98989d' },
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

function channel(c: number) {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

/** WCAG relative luminance of a #rrggbb colour. */
export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).split(', ').map(Number)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** White text where it meets AA on the accent, otherwise black. */
export function textOn(hex: string) {
  return contrastRatio('#ffffff', hex) >= 4.5 ? '#ffffff' : '#000000'
}

export function findAccent(id: string): AccentColor {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS[0]
}

export function findWallpaper(id: string): Wallpaper {
  return WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0]
}

/** Writes theme state onto <html> so the CSS tokens can react to it. */
export const CUSTOM_WALLPAPER = 'custom'

export function applyTheme(settings: ThemeSettings, prefersDark: boolean, root = document.documentElement, customWallpaperUrl?: string | null) {
  const mode = resolveAppearance(settings.appearance, prefersDark)
  const accent = findAccent(settings.accent)
  const wallpaper = findWallpaper(settings.wallpaper)

  root.dataset.theme = mode
  root.dataset.glass = settings.glass
  root.dataset.motion = settings.reduceMotion ? 'reduced' : 'full'
  root.dataset.transparency = settings.reduceTransparency ? 'reduced' : 'full'
  root.dataset.contrast = settings.increaseContrast ? 'more' : 'normal'
  const accentHex = mode === 'dark' ? accent.dark : accent.light
  root.style.setProperty('--accent', accentHex)
  root.style.setProperty('--accent-rgb', hexToRgb(accentHex))
  root.style.setProperty('--on-accent', textOn(accentHex))
  const gradient = mode === 'dark' ? wallpaper.dark : wallpaper.light
  root.style.setProperty(
    '--wallpaper',
    settings.wallpaper === CUSTOM_WALLPAPER && customWallpaperUrl ? `url("${customWallpaperUrl}") center / cover no-repeat, ${gradient}` : gradient,
  )

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', mode === 'dark' ? '#000000' : '#f2f2f7')
}
