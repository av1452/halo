import { useCallback } from 'react'
import { showToast, type ToastAction } from '../../components/toastStore'
import { watchHandoff } from '../../services/handoff'
import { classifyUrl } from '../../utils/url'
import { preferencesStore } from '../settings/preferencesStore'
import { recordOpen } from './launcherStore'

export interface Destination {
  id?: string
  name: string
  url: string
  fallbackUrl?: string
  appStoreUrl?: string
}

/** Props for an <a> that opens a destination the way the user prefers. */
export function linkProps(url: string, newTab: boolean) {
  const external = classifyUrl(url) === 'web' && newTab
  return {
    href: url,
    target: external ? '_blank' : undefined,
    rel: external ? 'noopener noreferrer' : undefined,
  }
}

function openUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Click handler for launcher links. Records the open and, for app URL
 * schemes, tells the user honestly when Halo cannot confirm the app opened.
 */
export function useLaunch() {
  const prefs = preferencesStore.use()
  const onOpen = useCallback((dest: Destination) => {
    if (dest.id) recordOpen(dest.id)
    if (classifyUrl(dest.url) !== 'app-scheme') return
    void watchHandoff().then((confirmed) => {
      if (confirmed) return
      const actions: ToastAction[] = []
      if (dest.fallbackUrl) actions.push({ label: 'Open website', onSelect: () => openUrl(dest.fallbackUrl!) })
      if (dest.appStoreUrl) actions.push({ label: 'App Store', onSelect: () => openUrl(dest.appStoreUrl!) })
      showToast({
        tone: 'warning',
        message: `Halo couldn’t confirm that ${dest.name} opened. It may not be installed on this device.`,
        actions,
      })
    })
  }, [])
  return { onOpen, newTab: prefs.openLinksInNewTab }
}
