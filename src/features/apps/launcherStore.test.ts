import { addFolder, addShortcut, filterShortcuts, launcherStore, moveShortcut, recordOpen, removeFolder, removeShortcut } from './launcherStore'
import { validateLauncher } from './model'

const draft = { name: 'Docs', url: 'https://docs.example.com/', color: '#0a84ff', folderId: null, favorite: false }

describe('launcher store', () => {
  afterEach(() => launcherStore.reset())

  it('adds and removes shortcuts, cleaning up recents', () => {
    const s = addShortcut(draft)
    expect(launcherStore.get().shortcuts.at(-1)).toMatchObject({ id: s.id, name: 'Docs' })
    recordOpen(s.id)
    expect(launcherStore.get().recents[0].id).toBe(s.id)
    removeShortcut(s.id)
    expect(launcherStore.get().shortcuts.find((x) => x.id === s.id)).toBeUndefined()
    expect(launcherStore.get().recents).toHaveLength(0)
  })

  it('moves a shortcut relative to the visible list', () => {
    const ids = launcherStore.get().shortcuts.map((s) => s.id)
    moveShortcut(ids[1], -1, ids)
    expect(launcherStore.get().shortcuts.map((s) => s.id).slice(0, 2)).toEqual([ids[1], ids[0]])
  })

  it('keeps shortcuts when their folder is deleted', () => {
    const folder = addFolder('Temp')
    const s = addShortcut({ ...draft, folderId: folder.id })
    removeFolder(folder.id)
    expect(launcherStore.get().shortcuts.find((x) => x.id === s.id)?.folderId).toBeNull()
  })

  it('filters by query, favorites and folder', () => {
    const list = launcherStore.get().shortcuts
    expect(filterShortcuts(list, 'git', 'all').map((s) => s.name)).toEqual(['GitHub'])
    expect(filterShortcuts(list, '', 'favorites').every((s) => s.favorite)).toBe(true)
    expect(filterShortcuts(list, '', 'f-play').every((s) => s.folderId === 'f-play')).toBe(true)
  })
})

describe('validateLauncher', () => {
  it('drops unsafe or malformed shortcuts and orphaned references', () => {
    const result = validateLauncher({
      folders: [{ id: 'f1', name: 'Kept' }],
      shortcuts: [
        { id: 'a', name: 'Good', url: 'example.com', folderId: 'f1' },
        { id: 'b', name: 'Bad', url: 'javascript:alert(1)' },
        { id: 'c', name: 'Orphan', url: 'https://x.com', folderId: 'gone' },
        'nonsense',
      ],
      recents: [{ id: 'b', at: 1 }, { id: 'a', at: 2 }],
    })
    expect(result?.shortcuts.map((s) => s.id)).toEqual(['a', 'c'])
    expect(result?.shortcuts[0].url).toBe('https://example.com/')
    expect(result?.shortcuts[1].folderId).toBeNull()
    expect(result?.recents).toEqual([{ id: 'a', at: 2 }])
  })
})
