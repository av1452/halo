import { isBoolean, isNumber, isRecord, isString, filterValid } from '../../utils/guards'
import { normalizeUrl } from '../../utils/url'

export interface Shortcut {
  id: string
  name: string
  /** Primary destination: a website, Universal Link, contact link or app URL scheme */
  url: string
  /** Website to offer if an app scheme cannot be confirmed to open */
  fallbackUrl?: string
  appStoreUrl?: string
  description?: string
  /** Key into the glyph registry; falls back to a lettermark */
  glyph?: string
  color: string
  folderId: string | null
  favorite: boolean
  createdAt: number
}

export interface Folder {
  id: string
  name: string
}

export interface RecentOpen {
  id: string
  at: number
}

export interface LauncherState {
  shortcuts: Shortcut[]
  folders: Folder[]
  recents: RecentOpen[]
}

export const MAX_RECENTS = 8

export const TILE_COLORS = ['#0a84ff', '#5e5ce6', '#bf5af2', '#ff375f', '#ff6b35', '#ff9f0a', '#30b158', '#40b3c8', '#1c1c1e', '#8e8e93'] as const

function optionalUrl(value: unknown): string | undefined {
  return isString(value) ? (normalizeUrl(value) ?? undefined) : undefined
}

export function parseShortcut(raw: unknown): Shortcut | null {
  if (!isRecord(raw) || !isString(raw.id) || !isString(raw.name) || !isString(raw.url)) return null
  const url = normalizeUrl(raw.url)
  if (!url) return null
  return {
    id: raw.id,
    name: raw.name.slice(0, 60),
    url,
    fallbackUrl: optionalUrl(raw.fallbackUrl),
    appStoreUrl: optionalUrl(raw.appStoreUrl),
    description: isString(raw.description) ? raw.description.slice(0, 280) : undefined,
    glyph: isString(raw.glyph) ? raw.glyph : undefined,
    color: isString(raw.color) && /^#[0-9a-f]{6}$/i.test(raw.color) ? raw.color : TILE_COLORS[0],
    folderId: isString(raw.folderId) ? raw.folderId : null,
    favorite: isBoolean(raw.favorite) ? raw.favorite : false,
    createdAt: isNumber(raw.createdAt) ? raw.createdAt : 0,
  }
}

function isShortcut(raw: unknown): raw is Shortcut {
  return parseShortcut(raw) !== null
}

function isFolder(raw: unknown): raw is Folder {
  return isRecord(raw) && isString(raw.id) && isString(raw.name)
}

function isRecent(raw: unknown): raw is RecentOpen {
  return isRecord(raw) && isString(raw.id) && isNumber(raw.at)
}

export function validateLauncher(raw: unknown): LauncherState | null {
  if (!isRecord(raw) || !Array.isArray(raw.shortcuts)) return null
  const folders = filterValid(raw.folders, isFolder)
  const folderIds = new Set(folders.map((f) => f.id))
  const shortcuts = filterValid(raw.shortcuts, isShortcut)
    .map((s) => parseShortcut(s)!)
    .map((s) => (s.folderId && !folderIds.has(s.folderId) ? { ...s, folderId: null } : s))
  const ids = new Set(shortcuts.map((s) => s.id))
  const recents = filterValid(raw.recents, isRecent).filter((r) => ids.has(r.id)).slice(0, MAX_RECENTS)
  return { shortcuts, folders, recents }
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
