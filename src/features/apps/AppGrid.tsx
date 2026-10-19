import type { Shortcut } from './model'
import { AppTile } from './AppTile'
import styles from './apps.module.css'

interface AppGridProps {
  shortcuts: Shortcut[]
  label: string
  editing: boolean
  onShowDetails: (s: Shortcut) => void
  onEdit: (s: Shortcut) => void
  onRemove: (s: Shortcut) => void
  onMove?: (s: Shortcut, direction: -1 | 1) => void
}

export function AppGrid({ shortcuts, label, onMove, ...rest }: AppGridProps) {
  return (
    <ul className={styles.grid} aria-label={label}>
      {shortcuts.map((s, i) => (
        <AppTile
          key={s.id}
          shortcut={s}
          onMove={onMove}
          canMoveBack={i > 0}
          canMoveForward={i < shortcuts.length - 1}
          {...rest}
        />
      ))}
    </ul>
  )
}
