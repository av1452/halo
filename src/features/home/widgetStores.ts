import { createPersistedStore } from '../../storage/persistedStore'
import { filterValid, isBoolean, isNumber, isRecord, isString } from '../../utils/guards'
import type { Place, WeatherReport } from '../../services/weather'

// ---------- Weather ----------

export interface WeatherSettings {
  place: Place | null
  cache: (WeatherReport & { placeKey: string }) | null
}

export const placeKey = (p: Place) => `${p.latitude.toFixed(3)},${p.longitude.toFixed(3)}`

function parsePlace(raw: unknown): Place | null {
  return isRecord(raw) && isString(raw.name) && isNumber(raw.latitude) && isNumber(raw.longitude)
    ? { name: raw.name, region: isString(raw.region) ? raw.region : undefined, latitude: raw.latitude, longitude: raw.longitude }
    : null
}

export const weatherStore = createPersistedStore<WeatherSettings>({
  key: 'weather',
  version: 1,
  defaults: () => ({ place: null, cache: null }),
  validate: (raw) => {
    if (!isRecord(raw)) return null
    const c = raw.cache
    const cache =
      isRecord(c) && isString(c.placeKey) && [c.temperature, c.high, c.low, c.code, c.fetchedAt].every(isNumber)
        ? (c as unknown as WeatherSettings['cache'])
        : null
    return { place: parsePlace(raw.place), cache }
  },
})

// ---------- Reminders ----------

export interface Reminder {
  id: string
  text: string
  done: boolean
  /** Local date, YYYY-MM-DD */
  due?: string
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isReminder(raw: unknown): raw is Reminder {
  return isRecord(raw) && isString(raw.id) && isString(raw.text) && isBoolean(raw.done) && (raw.due === undefined || (isString(raw.due) && DATE_RE.test(raw.due)))
}

export const remindersStore = createPersistedStore<Reminder[]>({
  key: 'reminders',
  version: 1,
  defaults: () => [],
  validate: (raw) => (Array.isArray(raw) ? filterValid(raw, isReminder) : null),
})

export function addReminder(text: string, due?: string) {
  const trimmed = text.trim().slice(0, 140)
  if (!trimmed) return
  remindersStore.set((list) => [...list, { id: `r-${Date.now().toString(36)}`, text: trimmed, done: false, due: due && DATE_RE.test(due) ? due : undefined }])
}

export function toggleReminder(id: string) {
  remindersStore.set((list) => list.map((r) => (r.id === id ? { ...r, done: !r.done } : r)))
}

export function clearCompletedReminders() {
  remindersStore.set((list) => list.filter((r) => !r.done))
}

/** YYYY-MM-DD for a Date in local time */
export function localDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ---------- Notes ----------

export const notesStore = createPersistedStore<string>({
  key: 'notes',
  version: 1,
  defaults: () => '',
  validate: (raw) => (isString(raw) ? raw.slice(0, 5000) : null),
})
