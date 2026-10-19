import { isNumber, isRecord } from '../utils/guards'
import { createPersistedStore } from './persistedStore'

interface Counter {
  count: number
}

let n = 0
function makeStore(overrides: { key?: string; version?: number; migrate?: (raw: unknown, from: number) => unknown } = {}) {
  return createPersistedStore<Counter>({
    key: overrides.key ?? `test-${++n}`,
    version: overrides.version ?? 1,
    defaults: () => ({ count: 0 }),
    validate: (raw) => (isRecord(raw) && isNumber(raw.count) ? { count: raw.count } : null),
    migrate: overrides.migrate,
  })
}

describe('createPersistedStore', () => {
  it('starts from defaults and persists updates in a versioned envelope', () => {
    const store = makeStore({ key: 'persist' })
    expect(store.get()).toEqual({ count: 0 })
    store.set((s) => ({ count: s.count + 1 }))
    expect(JSON.parse(localStorage.getItem('halo:persist')!)).toEqual({ v: 1, data: { count: 1 } })
  })

  it('restores saved data on creation', () => {
    localStorage.setItem('halo:restore', JSON.stringify({ v: 1, data: { count: 7 } }))
    expect(makeStore({ key: 'restore' }).get()).toEqual({ count: 7 })
  })

  it('falls back to defaults when stored data is corrupt', () => {
    localStorage.setItem('halo:corrupt', '{not json')
    expect(makeStore({ key: 'corrupt' }).get()).toEqual({ count: 0 })
    localStorage.setItem('halo:invalid', JSON.stringify({ v: 1, data: { count: 'seven' } }))
    expect(makeStore({ key: 'invalid' }).get()).toEqual({ count: 0 })
  })

  it('migrates data saved by an older version', () => {
    localStorage.setItem('halo:migrate', JSON.stringify({ v: 1, data: { total: 3 } }))
    const store = makeStore({
      key: 'migrate',
      version: 2,
      migrate: (raw) => ({ count: isRecord(raw) ? raw.total : 0 }),
    })
    expect(store.get()).toEqual({ count: 3 })
  })

  it('ignores data from a newer version instead of misreading it', () => {
    localStorage.setItem('halo:future', JSON.stringify({ v: 9, data: { count: 5 } }))
    expect(makeStore({ key: 'future' }).get()).toEqual({ count: 0 })
  })

  it('notifies subscribers and resets to defaults', () => {
    const store = makeStore()
    const listener = vi.fn()
    store.subscribe(listener)
    store.set({ count: 2 })
    store.reset()
    expect(listener).toHaveBeenCalledTimes(2)
    expect(store.get()).toEqual({ count: 0 })
  })

  it('rejects invalid data passed to load()', () => {
    const store = makeStore()
    expect(store.load({ count: 'x' })).toBe(false)
    expect(store.load({ count: 4 })).toBe(true)
    expect(store.get()).toEqual({ count: 4 })
  })
})
