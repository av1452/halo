/**
 * Minimal promise wrapper around a single IndexedDB object store, used for
 * data too large for LocalStorage (e.g. a custom wallpaper image).
 * Every call rejects cleanly when IndexedDB is unavailable.
 */

const DB_NAME = 'halo'
const DB_VERSION = 1
const STORE = 'blobs'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open IndexedDB'))
  }).catch((error: unknown) => {
    dbPromise = null
    throw error
  })
  return dbPromise
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const request = fn(tx.objectStore(STORE))
        request.onsuccess = () => resolve(request.result as T)
        request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
      }),
  )
}

export function idbGet<T>(key: string): Promise<T | undefined> {
  return run<T | undefined>('readonly', (s) => s.get(key))
}

export function idbSet(key: string, value: unknown): Promise<void> {
  return run<IDBValidKey>('readwrite', (s) => s.put(value, key)).then(() => undefined)
}

export function idbDelete(key: string): Promise<void> {
  return run<undefined>('readwrite', (s) => s.delete(key))
}

export function idbClear(): Promise<void> {
  return run<undefined>('readwrite', (s) => s.clear())
}
