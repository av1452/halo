import type { TemperatureUnit } from '../features/settings/preferencesStore'

export function toUnit(celsius: number, unit: TemperatureUnit) {
  return unit === 'fahrenheit' ? celsius * 1.8 + 32 : celsius
}

export function formatTemp(celsius: number, unit: TemperatureUnit, decimals = 0) {
  const value = toUnit(celsius, unit)
  return `${value.toFixed(decimals)}°${unit === 'fahrenheit' ? 'F' : 'C'}`
}
