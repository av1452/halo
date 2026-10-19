import { createPersistedStore } from '../../storage/persistedStore'
import { defaultLauncher } from './defaults'
import { MAX_RECENTS, newId, validateLauncher, type Folder, type LauncherState, type Shortcut } from './model'

export const launcherStore = createPersistedStore<LauncherState>({
  key: 'launcher',
  version: 1,
  defaults: defaultLauncher,
  validate: validateLauncher,
})

const update = (fn: (s: LauncherState) => LauncherState) => launcherStore.set(fn)

export type ShortcutDraft = Omit<Shortcut, 'id' | 'createdAt'>

export function addShortcut(draft: ShortcutDraft): Shortcut {
  const shortcut: Shortcut = { ...draft, id: newId('s'), createdAt: Date.now() }
  update((s) => ({ ...s, shortcuts: [...s.shortcuts, shortcut] }))
  return shortcut
}

export function updateShortcut(id: string, patch: Partial<ShortcutDraft>) {
  update((s) => ({ ...s, shortcuts: s.shortcuts.map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
}

export function removeShortcut(id: string) {
  update((s) => ({
    ...s,
    shortcuts: s.shortcuts.filter((x) => x.id !== id),
    recents: s.recents.filter((r) => r.id !== id),
  }))
}

export function toggleFavorite(id: string) {
  update((s) => ({ ...s, shortcuts: s.shortcuts.map((x) => (x.id === id ? { ...x, favorite: !x.favorite } : x)) }))
}

/** Moves a shortcut one step relative to the shortcuts currently visible. */
export function moveShortcut(id: string, direction: -1 | 1, visibleIds: string[]) {
  const pos = visibleIds.indexOf(id)
  const neighbour = visibleIds[pos + direction]
  if (pos < 0 || !neighbour) return
  update((s) => {
    const list = [...s.shortcuts]
    const a = list.findIndex((x) => x.id === id)
    const b = list.findIndex((x) => x.id === neighbour)
    ;[list[a], list[b]] = [list[b], list[a]]
    return { ...s, shortcuts: list }
  })
}

export function recordOpen(id: string, now = Date.now()) {
  update((s) => ({
    ...s,
    recents: [{ id, at: now }, ...s.recents.filter((r) => r.id !== id)].slice(0, MAX_RECENTS),
  }))
}

export function clearRecents() {
  update((s) => ({ ...s, recents: [] }))
}

export function addFolder(name: string): Folder {
  const folder = { id: newId('f'), name: name.trim().slice(0, 40) }
  update((s) => ({ ...s, folders: [...s.folders, folder] }))
  return folder
}

export function renameFolder(id: string, name: string) {
  update((s) => ({ ...s, folders: s.folders.map((f) => (f.id === id ? { ...f, name: name.trim().slice(0, 40) } : f)) }))
}

/** Deleting a folder keeps its shortcuts and moves them out of the folder. */
export function removeFolder(id: string) {
  update((s) => ({
    ...s,
    folders: s.folders.filter((f) => f.id !== id),
    shortcuts: s.shortcuts.map((x) => (x.folderId === id ? { ...x, folderId: null } : x)),
  }))
}

export function filterShortcuts(shortcuts: Shortcut[], query: string, filter: 'all' | 'favorites' | string): Shortcut[] {
  const q = query.trim().toLowerCase()
  return shortcuts.filter((s) => {
    if (filter === 'favorites' && !s.favorite) return false
    if (filter !== 'all' && filter !== 'favorites' && s.folderId !== filter) return false
    if (!q) return true
    return s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q)
  })
}
