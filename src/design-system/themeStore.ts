import { createPersistedStore } from '../storage/persistedStore'
import { isBoolean, isOneOf, isRecord, isString } from '../utils/guards'
import { DEFAULT_THEME, type ThemeSettings } from './theme'

const isAppearance = isOneOf(['system', 'light', 'dark'] as const)
const isGlass = isOneOf(['subtle', 'balanced', 'vivid'] as const)

/** Accepts partial data, filling missing or invalid fields with defaults. */
export function validateTheme(raw: unknown): ThemeSettings | null {
  if (!isRecord(raw)) return null
  const d = DEFAULT_THEME
  return {
    appearance: isAppearance(raw.appearance) ? raw.appearance : d.appearance,
    accent: isString(raw.accent) ? raw.accent : d.accent,
    wallpaper: isString(raw.wallpaper) ? raw.wallpaper : d.wallpaper,
    glass: isGlass(raw.glass) ? raw.glass : d.glass,
    reduceMotion: isBoolean(raw.reduceMotion) ? raw.reduceMotion : d.reduceMotion,
    reduceTransparency: isBoolean(raw.reduceTransparency) ? raw.reduceTransparency : d.reduceTransparency,
    increaseContrast: isBoolean(raw.increaseContrast) ? raw.increaseContrast : d.increaseContrast,
  }
}

export const themeStore = createPersistedStore<ThemeSettings>({
  key: 'theme',
  version: 1,
  defaults: () => ({ ...DEFAULT_THEME }),
  validate: validateTheme,
})

export function updateTheme(patch: Partial<ThemeSettings>) {
  themeStore.set((prev) => ({ ...prev, ...patch }))
}
