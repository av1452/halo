import { ExternalLink, Pencil, ShoppingBag, Star, Trash2 } from 'lucide-react'
import { AppIcon } from '../../components/AppIcon'
import { Button } from '../../components/Button'
import { buttonClassName } from '../../components/buttonClassName'
import { Sheet } from '../../components/Sheet'
import { classifyUrl, displayHost } from '../../utils/url'
import { launcherStore, toggleFavorite } from './launcherStore'
import type { Shortcut } from './model'
import { linkProps, useLaunch } from './useLaunch'
import styles from './apps.module.css'

interface ShortcutDetailsProps {
  shortcut: Shortcut | null
  onClose: () => void
  onEdit: (s: Shortcut) => void
  onRemove: (s: Shortcut) => void
}

const KIND_LABEL = {
  web: 'Website or Universal Link',
  contact: 'Contact link',
  'app-scheme': 'App URL scheme — requires the app to be installed',
} as const

export function ShortcutDetails({ shortcut, onClose, onEdit, onRemove }: ShortcutDetailsProps) {
  const { onOpen, newTab } = useLaunch()
  const { folders, shortcuts } = launcherStore.use()
  // Read the live copy so the favorite toggle reflects immediately
  const current = shortcut ? shortcuts.find((s) => s.id === shortcut.id) ?? shortcut : null
  if (!current) return null
  const folder = folders.find((f) => f.id === current.folderId)

  return (
    <Sheet open title={current.name} onClose={onClose}>
      <div className={styles.details}>
        <div className={styles.detailsHead}>
          <AppIcon name={current.name} color={current.color} glyph={current.glyph} size={72} />
          <div>
            <p className={styles.detailsHost}>{displayHost(current.url)}</p>
            <p className={styles.detailsMeta}>{KIND_LABEL[classifyUrl(current.url)]}</p>
            {folder && <p className={styles.detailsMeta}>Folder: {folder.name}</p>}
          </div>
        </div>
        {current.description && <p className={styles.detailsText}>{current.description}</p>}
        <div className={styles.detailsActions}>
          <a {...linkProps(current.url, newTab)} className={buttonClassName('primary')} onClick={() => onOpen(current)}>
            <ExternalLink size={18} aria-hidden="true" /> Open
          </a>
          {current.fallbackUrl && (
            <a {...linkProps(current.fallbackUrl, true)} className={buttonClassName()}>
              Website
            </a>
          )}
          {current.appStoreUrl && (
            <a {...linkProps(current.appStoreUrl, true)} className={buttonClassName()}>
              <ShoppingBag size={18} aria-hidden="true" /> App Store
            </a>
          )}
        </div>
        <div className={styles.detailsActions}>
          <Button icon={<Star size={18} fill={current.favorite ? 'currentColor' : 'none'} />} aria-pressed={current.favorite} onClick={() => toggleFavorite(current.id)}>
            {current.favorite ? 'Favorited' : 'Favorite'}
          </Button>
          <Button icon={<Pencil size={18} />} onClick={() => onEdit(current)}>Edit</Button>
          <Button variant="danger" icon={<Trash2 size={18} />} onClick={() => onRemove(current)}>Remove</Button>
        </div>
      </div>
    </Sheet>
  )
}
