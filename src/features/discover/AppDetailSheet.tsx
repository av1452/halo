import { useEffect, useState } from 'react'
import { ExternalLink, Globe, Plus, Star } from 'lucide-react'
import { Button } from '../../components/Button'
import { buttonClassName } from '../../components/buttonClassName'
import { DemoBadge } from '../../components/DemoBadge'
import { Sheet } from '../../components/Sheet'
import { AppStoreError, lookupApp, type AppStoreApp } from '../../services/appStore'
import { ShortcutEditor } from '../apps/ShortcutEditor'
import { appStoreUrl } from './catalog'
import { discoverStore, toggleDiscoverFavorite, type SavedApp } from './discoverStore'
import { ListingIcon } from './ListingIcon'
import styles from './discover.module.css'

export interface Selection extends SavedApp {
  summary?: string
  website?: string
  /** True for Halo's curated list, false for live search results */
  curated: boolean
}

type LookupResult = { id: number; app: AppStoreApp | null; error: string | null }

export function AppDetailSheet({ selection, onClose }: { selection: Selection; onClose: () => void }) {
  const [result, setResult] = useState<LookupResult | null>(null)
  const [adding, setAdding] = useState(false)
  const { favorites } = discoverStore.use()
  const favorite = favorites.some((f) => f.id === selection.id)

  useEffect(() => {
    let cancelled = false
    lookupApp(selection.id)
      .then((app) => !cancelled && setResult({ id: selection.id, app, error: app ? null : 'This app isn’t available in your region’s App Store.' }))
      .catch((e: unknown) => !cancelled && setResult({ id: selection.id, app: null, error: e instanceof AppStoreError ? e.message : 'Couldn’t load App Store details.' }))
    return () => {
      cancelled = true
    }
  }, [selection.id])

  const current = result?.id === selection.id ? result : null
  const live = current?.app ?? null
  const saved: SavedApp = { id: selection.id, name: selection.name, developer: selection.developer, iconUrl: live?.iconUrl || selection.iconUrl }
  const storeUrl = live?.url ?? appStoreUrl(selection.id)

  return (
    <>
      <Sheet open={!adding} title={selection.name} onClose={onClose}>
        <div className={styles.detail}>
          <div className={styles.detailHead}>
            <ListingIcon name={selection.name} iconUrl={saved.iconUrl} size={88} />
            <div className={styles.detailMeta}>
              <p className={styles.detailDev}>{live?.developer || selection.developer}</p>
              {live && (
                <p className={styles.cardMeta}>
                  {[live.genre, live.price, live.rating && live.ratingCount ? `★ ${live.rating.toFixed(1)} (${live.ratingCount.toLocaleString()})` : null].filter(Boolean).join(' · ')}
                </p>
              )}
              {selection.curated && <DemoBadge label="Curated" />}
            </div>
          </div>

          <div className={styles.detailActions}>
            <a href={storeUrl} target="_blank" rel="noopener noreferrer" className={buttonClassName('primary')}>
              <ExternalLink size={18} aria-hidden="true" /> View in App Store
            </a>
            {selection.website && (
              <a href={selection.website} target="_blank" rel="noopener noreferrer" className={buttonClassName()}>
                <Globe size={18} aria-hidden="true" /> Website
              </a>
            )}
            <Button icon={<Star size={18} fill={favorite ? 'currentColor' : 'none'} />} aria-pressed={favorite} onClick={() => toggleDiscoverFavorite(saved)}>
              {favorite ? 'Favorited' : 'Favorite'}
            </Button>
            <Button icon={<Plus size={18} />} onClick={() => setAdding(true)}>Add to Apps</Button>
          </div>
          <p className={styles.fineprint}>Installing happens in the App Store. Halo can’t install apps or check whether one is installed.</p>

          {selection.summary && <p>{selection.summary}</p>}

          {!current && <p className={styles.cardMeta} role="status">Loading App Store details…</p>}
          {current?.error && <p className={styles.error} role="alert">{current.error}</p>}
          {live && live.screenshots.length > 0 && (
            <div className={styles.screenshots} aria-label="Screenshots from the App Store" role="group">
              {live.screenshots.map((src, i) => (
                <img key={src} src={src} alt={`${selection.name} screenshot ${i + 1}`} loading="lazy" referrerPolicy="no-referrer" />
              ))}
            </div>
          )}
          {live?.description && (
            <details className={styles.description}>
              <summary>Description from the App Store</summary>
              <p>{live.description}</p>
            </details>
          )}
          {live && <p className={styles.fineprint}>Icon, screenshots, rating and description provided by Apple’s App Store.</p>}
        </div>
      </Sheet>
      {adding && (
        <ShortcutEditor
          open
          initial={{
            name: selection.name,
            url: selection.website ?? storeUrl,
            fallbackUrl: selection.website,
            appStoreUrl: storeUrl,
            description: selection.summary,
            glyph: 'globe',
          }}
          onClose={() => setAdding(false)}
        />
      )}
    </>
  )
}
