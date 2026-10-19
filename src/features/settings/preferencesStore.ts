import { createPersistedStore } from '../../storage/persistedStore'
import { isBoolean, isOneOf, isRecord, isString } from '../../utils/guards'

export type TemperatureUnit = 'celsius' | 'fahrenheit'

export interface Preferences {
  /** Optional first name used in the Home greeting; stays on this device */
  displayName: string
  openLinksInNewTab: boolean
  temperatureUnit: TemperatureUnit
  use24HourClock: boolean
}

export const DEFAULT_PREFERENCES: Preferences = {
  displayName: '',
  openLinksInNewTab: true,
  temperatureUnit: 'celsius',
  use24HourClock: false,
}

const isUnit = isOneOf(['celsius', 'fahrenheit'] as const)

export function validatePreferences(raw: unknown): Preferences | null {
  if (!isRecord(raw)) return null
  const d = DEFAULT_PREFERENCES
  return {
    displayName: isString(raw.displayName) ? raw.displayName.slice(0, 40) : d.displayName,
    openLinksInNewTab: isBoolean(raw.openLinksInNewTab) ? raw.openLinksInNewTab : d.openLinksInNewTab,
    temperatureUnit: isUnit(raw.temperatureUnit) ? raw.temperatureUnit : d.temperatureUnit,
    use24HourClock: isBoolean(raw.use24HourClock) ? raw.use24HourClock : d.use24HourClock,
  }
}

export const preferencesStore = createPersistedStore<Preferences>({
  key: 'preferences',
  version: 1,
  defaults: () => ({ ...DEFAULT_PREFERENCES }),
  validate: validatePreferences,
})

export function updatePreferences(patch: Partial<Preferences>) {
  preferencesStore.set((prev) => ({ ...prev, ...patch }))
}
