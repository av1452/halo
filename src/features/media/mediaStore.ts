import { createPersistedStore } from '../../storage/persistedStore'
import { isArrayOf, isRecord, isString } from '../../utils/guards'

export interface MediaPrefs {
  favorites: string[]
  recents: string[]
}

const isStringArray = isArrayOf(isString)

export const mediaStore = createPersistedStore<MediaPrefs>({
  key: 'media',
  version: 1,
  defaults: () => ({ favorites: ['apple-music', 'spotify', 'youtube', 'apple-podcasts'], recents: [] }),
  validate: (raw) =>
    isRecord(raw)
      ? { favorites: isStringArray(raw.favorites) ? raw.favorites : [], recents: isStringArray(raw.recents) ? raw.recents.slice(0, 6) : [] }
      : null,
})

export function toggleMediaFavorite(id: string) {
  mediaStore.set((s) => ({ ...s, favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id] }))
}

export function recordMediaOpen(id: string) {
  mediaStore.set((s) => ({ ...s, recents: [id, ...s.recents.filter((r) => r !== id)].slice(0, 6) }))
}
