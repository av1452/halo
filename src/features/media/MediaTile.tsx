import { Star } from 'lucide-react'
import { AppIcon } from '../../components/AppIcon'
import { linkProps } from '../apps/useLaunch'
import { preferencesStore } from '../settings/preferencesStore'
import { mediaStore, recordMediaOpen, toggleMediaFavorite } from './mediaStore'
import type { MediaService } from './services'
import styles from './media.module.css'

export function MediaTile({ service }: { service: MediaService }) {
  const { openLinksInNewTab } = preferencesStore.use()
  const { favorites } = mediaStore.use()
  const favorite = favorites.includes(service.id)
  return (
    <li className={`glass-thin ${styles.service}`}>
      <a {...linkProps(service.url, openLinksInNewTab)} className={styles.serviceLink} onClick={() => recordMediaOpen(service.id)}>
        <AppIcon name={service.name} color={service.color} glyph={service.glyph} size={44} />
        <span className={styles.serviceName}>{service.name}</span>
      </a>
      <button
        type="button"
        className={styles.star}
        aria-pressed={favorite}
        aria-label={`Favorite ${service.name}`}
        onClick={() => toggleMediaFavorite(service.id)}
      >
        <Star size={18} fill={favorite ? 'currentColor' : 'none'} />
      </button>
    </li>
  )
}
