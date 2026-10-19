/**
 * Safe LocalStorage access. Safari private browsing (older versions), blocked
 * cookies and full quotas all throw, so every call degrades to a no-op.
 */

const PREFIX = 'halo:'

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

export function readRaw(key: string): unknown {
  try {
    const raw = storage()?.getItem(PREFIX + key)
    return raw == null ? undefined : JSON.parse(raw)
  } catch {
    return undefined
  }
}

export function writeRaw(key: string, value: unknown): boolean {
  try {
    storage()?.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeRaw(key: string) {
  try {
    storage()?.removeItem(PREFIX + key)
  } catch {
    // ignore
  }
}

export function storageKey(key: string) {
  return PREFIX + key
}
