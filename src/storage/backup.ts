import { isNumber, isRecord, isString } from '../utils/guards'
import { allStores, storeVersion } from './persistedStore'

export const BACKUP_FORMAT = 'halo-backup'
export const BACKUP_FORMAT_VERSION = 1
const MAX_BACKUP_BYTES = 2_000_000

export interface BackupFile {
  format: typeof BACKUP_FORMAT
  formatVersion: number
  exportedAt: string
  appVersion: string
  stores: Record<string, { v: number; data: unknown }>
}

export interface ImportReport {
  applied: string[]
  skipped: string[]
}

export function createBackup(appVersion: string, now = new Date()): BackupFile {
  const stores: BackupFile['stores'] = {}
  for (const store of allStores()) {
    stores[store.key] = { v: storeVersion(store.key) ?? 1, data: store.get() }
  }
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: now.toISOString(),
    appVersion,
    stores,
  }
}

export class BackupError extends Error {}

/** Parses and structurally validates a backup without applying it. */
export function parseBackup(text: string): BackupFile {
  if (text.length > MAX_BACKUP_BYTES) throw new BackupError('This file is too large to be a Halo backup.')
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new BackupError('This file isn’t valid JSON.')
  }
  if (!isRecord(json) || json.format !== BACKUP_FORMAT) {
    throw new BackupError('This file isn’t a Halo backup.')
  }
  if (!isNumber(json.formatVersion) || json.formatVersion > BACKUP_FORMAT_VERSION) {
    throw new BackupError('This backup was made by a newer version of Halo.')
  }
  if (!isRecord(json.stores)) throw new BackupError('This backup has no data.')
  return {
    format: BACKUP_FORMAT,
    formatVersion: json.formatVersion,
    exportedAt: isString(json.exportedAt) ? json.exportedAt : '',
    appVersion: isString(json.appVersion) ? json.appVersion : 'unknown',
    stores: json.stores as BackupFile['stores'],
  }
}

/**
 * Applies each section independently. A section that fails validation is
 * skipped and existing data for it is left untouched.
 */
export function applyBackup(backup: BackupFile): ImportReport {
  const report: ImportReport = { applied: [], skipped: [] }
  const known = new Map(allStores().map((s) => [s.key, s]))
  for (const [key, entry] of Object.entries(backup.stores)) {
    const store = known.get(key)
    const ok = store && isRecord(entry) && isNumber(entry.v) && store.load(entry.data, entry.v)
    ;(ok ? report.applied : report.skipped).push(key)
  }
  return report
}

export function resetAllStores() {
  allStores().forEach((s) => s.reset())
}

export function exportFileName(date = new Date()) {
  return `halo-backup-${date.toISOString().slice(0, 10)}.json`
}
