import type { TemperatureUnit } from '../features/settings/preferencesStore'

export function toUnit(celsius: number, unit: TemperatureUnit) {
  return unit === 'fahrenheit' ? celsius * 1.8 + 32 : celsius
}

export function formatTemp(celsius: number, unit: TemperatureUnit, decimals = 0) {
  const value = toUnit(celsius, unit)
  return `${value.toFixed(decimals)}°${unit === 'fahrenheit' ? 'F' : 'C'}`
}

/** 125 → "2:05" */
export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
