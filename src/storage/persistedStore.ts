import { useSyncExternalStore } from 'react'
import { isNumber, isRecord } from '../utils/guards'
import { readRaw, storageKey, writeRaw, removeRaw } from './local'

export interface PersistedStoreOptions<T> {
  /** LocalStorage key (prefixed with "halo:") and export/import key */
  key: string
  /** Bump when the stored shape changes; pair with migrate() */
  version: number
  defaults: () => T
  /** Returns a clean value or null when the data cannot be trusted */
  validate: (raw: unknown) => T | null
  /** Upgrades data saved by an older version before validation */
  migrate?: (raw: unknown, fromVersion: number) => unknown
}

export interface PersistedStore<T> {
  readonly key: string
  get(): T
  set(next: T | ((prev: T) => T)): void
  reset(): void
  subscribe(listener: () => void): () => void
  /** Validates and loads foreign data (e.g. an import); returns false if rejected */
  load(raw: unknown, version?: number): boolean
  use(): T
}

interface Envelope {
  v: number
  data: unknown
}

function isEnvelope(value: unknown): value is Envelope {
  return isRecord(value) && isNumber(value.v) && 'data' in value
}

const registry = new Map<string, PersistedStore<unknown>>()

export function createPersistedStore<T>(options: PersistedStoreOptions<T>): PersistedStore<T> {
  const { key, version, defaults, validate, migrate } = options
  const listeners = new Set<() => void>()

  function decode(raw: unknown, fromVersion: number): T | null {
    const upgraded = fromVersion < version && migrate ? migrate(raw, fromVersion) : raw
    if (fromVersion > version) return null
    return validate(upgraded)
  }

  function readInitial(): T {
    const stored = readRaw(key)
    if (!isEnvelope(stored)) return defaults()
    return decode(stored.data, stored.v) ?? defaults()
  }

  let state = readInitial()

  function emit() {
    listeners.forEach((l) => l())
  }

  function commit(next: T) {
    if (Object.is(next, state)) return
    state = next
    writeRaw(key, { v: version, data: state } satisfies Envelope)
    emit()
  }

  // Keep tabs and windows in sync
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== storageKey(key)) return
      state = readInitial()
      emit()
    })
  }

  const store: PersistedStore<T> = {
    key,
    get: () => state,
    set(next) {
      commit(typeof next === 'function' ? (next as (prev: T) => T)(state) : next)
    },
    reset() {
      removeRaw(key)
      state = defaults()
      emit()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    load(raw, fromVersion = version) {
      const value = decode(raw, fromVersion)
      if (value === null) return false
      commit(value)
      return true
    },
    use() {
      return useSyncExternalStore(store.subscribe, store.get, store.get)
    },
  }

  registry.set(key, store as PersistedStore<unknown>)
  return store
}

/** Every persisted store, used by data export, import and reset. */
export function allStores(): PersistedStore<unknown>[] {
  return Array.from(registry.values())
}

export function storeVersion(key: string): number | undefined {
  const stored = readRaw(key)
  return isEnvelope(stored) ? stored.v : undefined
}
