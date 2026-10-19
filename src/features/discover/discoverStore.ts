import { createPersistedStore } from '../../storage/persistedStore'
import { filterValid, isNumber, isRecord, isString } from '../../utils/guards'

/** Enough to show an app in Favorites/Recents without refetching it. */
export interface SavedApp {
  id: number
  name: string
  developer: string
  iconUrl?: string
}

export interface DiscoverState {
  favorites: SavedApp[]
  recents: SavedApp[]
}

function isSavedApp(raw: unknown): raw is SavedApp {
  return isRecord(raw) && isNumber(raw.id) && isString(raw.name) && isString(raw.developer) && (raw.iconUrl === undefined || (isString(raw.iconUrl) && raw.iconUrl.startsWith('https://')))
}

export const discoverStore = createPersistedStore<DiscoverState>({
  key: 'discover',
  version: 1,
  defaults: () => ({ favorites: [], recents: [] }),
  validate: (raw) => (isRecord(raw) ? { favorites: filterValid(raw.favorites, isSavedApp), recents: filterValid(raw.recents, isSavedApp).slice(0, 10) } : null),
})

export function toggleDiscoverFavorite(app: SavedApp) {
  discoverStore.set((s) => ({
    ...s,
    favorites: s.favorites.some((f) => f.id === app.id) ? s.favorites.filter((f) => f.id !== app.id) : [app, ...s.favorites],
  }))
}

export function recordViewed(app: SavedApp) {
  discoverStore.set((s) => ({ ...s, recents: [app, ...s.recents.filter((r) => r.id !== app.id)].slice(0, 10) }))
}
