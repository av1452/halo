import { ChevronLeft, ChevronRight, Minus, Star } from 'lucide-react'
import { AppIcon } from '../../components/AppIcon'
import type { Shortcut } from './model'
import { linkProps, useLaunch } from './useLaunch'
import { useLongPress } from './useLongPress'
import styles from './apps.module.css'

interface AppTileProps {
  shortcut: Shortcut
  editing: boolean
  onShowDetails: (s: Shortcut) => void
  onEdit: (s: Shortcut) => void
  onRemove: (s: Shortcut) => void
  onMove?: (s: Shortcut, direction: -1 | 1) => void
  canMoveBack?: boolean
  canMoveForward?: boolean
}

export function AppTile({ shortcut, editing, onShowDetails, onEdit, onRemove, onMove, canMoveBack, canMoveForward }: AppTileProps) {
  const { onOpen, newTab } = useLaunch()
  const { consumeLongPress, ...pressHandlers } = useLongPress(() => onShowDetails(shortcut))
  const icon = <AppIcon name={shortcut.name} color={shortcut.color} glyph={shortcut.glyph} />

  if (editing) {
    return (
      <li className={`${styles.tile} ${styles.editing}`}>
        <button type="button" className={styles.tileButton} onClick={() => onEdit(shortcut)} aria-label={`Edit ${shortcut.name}`}>
          {icon}
          <span className={styles.tileName}>{shortcut.name}</span>
        </button>
        <button type="button" className={styles.remove} aria-label={`Remove ${shortcut.name}`} onClick={() => onRemove(shortcut)}>
          <Minus size={14} strokeWidth={3.5} />
        </button>
        {onMove && (
          <div className={styles.moveRow}>
            <button type="button" aria-label={`Move ${shortcut.name} earlier`} disabled={!canMoveBack} onClick={() => onMove(shortcut, -1)}>
              <ChevronLeft size={16} />
            </button>
            <button type="button" aria-label={`Move ${shortcut.name} later`} disabled={!canMoveForward} onClick={() => onMove(shortcut, 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </li>
    )
  }

  return (
    <li className={styles.tile}>
      <a
        {...linkProps(shortcut.url, newTab)}
        {...pressHandlers}
        className={styles.tileButton}
        draggable={false}
        onClick={(e) => {
          if (consumeLongPress()) {
            e.preventDefault()
            return
          }
          onOpen(shortcut)
        }}
      >
        {icon}
        <span className={styles.tileName}>
          {shortcut.name}
          {shortcut.favorite && (
            <>
              <Star className={styles.favMark} aria-hidden="true" />
              <span className="visually-hidden">, favorite</span>
            </>
          )}
        </span>
      </a>
    </li>
  )
}
