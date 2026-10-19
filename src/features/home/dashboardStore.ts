import { createPersistedStore } from '../../storage/persistedStore'
import { filterValid, isOneOf, isRecord, isString } from '../../utils/guards'

export const WIDGET_TYPES = ['clock', 'weather', 'apps', 'smart-home', 'now-playing', 'reminders', 'calendar', 'notes', 'quick-actions', 'news'] as const
export type WidgetType = (typeof WIDGET_TYPES)[number]
export type WidgetSize = 'regular' | 'wide'

export interface WidgetInstance {
  id: string
  type: WidgetType
  size: WidgetSize
}

const isType = isOneOf(WIDGET_TYPES)
const isSize = isOneOf(['regular', 'wide'] as const)

function isWidget(raw: unknown): raw is WidgetInstance {
  return isRecord(raw) && isString(raw.id) && isType(raw.type) && isSize(raw.size)
}

export const DEFAULT_LAYOUT: WidgetInstance[] = [
  { id: 'w-clock', type: 'clock', size: 'regular' },
  { id: 'w-weather', type: 'weather', size: 'regular' },
  { id: 'w-apps', type: 'apps', size: 'wide' },
  { id: 'w-smart-home', type: 'smart-home', size: 'wide' },
  { id: 'w-now-playing', type: 'now-playing', size: 'regular' },
  { id: 'w-reminders', type: 'reminders', size: 'regular' },
  { id: 'w-calendar', type: 'calendar', size: 'regular' },
  { id: 'w-quick-actions', type: 'quick-actions', size: 'regular' },
]

export const dashboardStore = createPersistedStore<WidgetInstance[]>({
  key: 'dashboard',
  version: 1,
  defaults: () => DEFAULT_LAYOUT.map((w) => ({ ...w })),
  validate: (raw) => {
    if (!Array.isArray(raw)) return null
    const seen = new Set<string>()
    // One of each widget type; drop duplicates and unknown types
    return filterValid(raw, isWidget).filter((w) => !seen.has(w.type) && seen.add(w.type))
  },
})

export function addWidget(type: WidgetType) {
  dashboardStore.set((list) => (list.some((w) => w.type === type) ? list : [...list, { id: `w-${type}`, type, size: 'regular' }]))
}

export function removeWidget(id: string) {
  dashboardStore.set((list) => list.filter((w) => w.id !== id))
}

export function moveWidget(id: string, delta: -1 | 1) {
  dashboardStore.set((list) => {
    const i = list.findIndex((w) => w.id === id)
    const j = i + delta
    if (i < 0 || j < 0 || j >= list.length) return list
    const next = [...list]
    ;[next[i], next[j]] = [next[j], next[i]]
    return next
  })
}

export function toggleWidgetSize(id: string) {
  dashboardStore.set((list) => list.map((w) => (w.id === id ? { ...w, size: w.size === 'wide' ? 'regular' : 'wide' } : w)))
}
