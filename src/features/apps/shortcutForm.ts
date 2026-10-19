import { classifyUrl, isAppStoreUrl, normalizeUrl } from '../../utils/url'
import type { ShortcutDraft } from './launcherStore'
import { TILE_COLORS } from './model'

export interface FormState {
  name: string
  url: string
  fallbackUrl: string
  appStoreUrl: string
  description: string
  glyph: string
  color: string
  folderId: string
  favorite: boolean
}

export type Errors = Partial<Record<keyof FormState, string>>

export function toForm(s?: Partial<ShortcutDraft>): FormState {
  return {
    name: s?.name ?? '',
    url: s?.url ?? '',
    fallbackUrl: s?.fallbackUrl ?? '',
    appStoreUrl: s?.appStoreUrl ?? '',
    description: s?.description ?? '',
    glyph: s?.glyph ?? '',
    color: s?.color ?? TILE_COLORS[0],
    folderId: s?.folderId ?? '',
    favorite: s?.favorite ?? false,
  }
}

export function validateShortcutForm(form: FormState): { draft?: ShortcutDraft; errors: Errors } {
  const errors: Errors = {}
  const name = form.name.trim()
  if (!name) errors.name = 'Enter a name.'
  const url = normalizeUrl(form.url)
  if (!url) errors.url = 'Enter a web address like example.com, or an app link like spotify:.'
  const fallbackUrl = form.fallbackUrl.trim() ? normalizeUrl(form.fallbackUrl) : undefined
  if (fallbackUrl === null || (fallbackUrl && classifyUrl(fallbackUrl) !== 'web')) errors.fallbackUrl = 'Enter a website address.'
  const appStoreUrl = form.appStoreUrl.trim() ? normalizeUrl(form.appStoreUrl) : undefined
  if (appStoreUrl === null || (appStoreUrl && !isAppStoreUrl(appStoreUrl))) errors.appStoreUrl = 'Enter an apps.apple.com link.'
  if (Object.keys(errors).length > 0) return { errors }
  return {
    errors,
    draft: {
      name,
      url: url!,
      fallbackUrl: fallbackUrl ?? undefined,
      appStoreUrl: appStoreUrl ?? undefined,
      description: form.description.trim() || undefined,
      glyph: form.glyph || undefined,
      color: form.color,
      folderId: form.folderId || null,
      favorite: form.favorite,
    },
  }
}
