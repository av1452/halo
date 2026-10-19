import { Plus } from 'lucide-react'
import { Button } from '../../components/Button'
import { Sheet } from '../../components/Sheet'
import { addWidget, dashboardStore, WIDGET_TYPES } from './dashboardStore'
import { WIDGETS } from './widgets/registry'
import styles from './home.module.css'

export function WidgetGallery({ open, onClose }: { open: boolean; onClose: () => void }) {
  const layout = dashboardStore.use()
  const available = WIDGET_TYPES.filter((t) => !layout.some((w) => w.type === t))
  return (
    <Sheet open={open} title="Add Widget" onClose={onClose}>
      {available.length === 0 ? (
        <p className={styles.muted}>Every widget is already on your dashboard.</p>
      ) : (
        <ul className={styles.gallery}>
          {available.map((type) => {
            const { title, description, icon: Icon } = WIDGETS[type]
            return (
              <li key={type}>
                <span className={styles.galleryIcon} aria-hidden="true"><Icon size={20} /></span>
                <span className={styles.galleryText}>
                  <strong>{title}</strong>
                  <span className={styles.muted}>{description}</span>
                </span>
                <Button size="sm" variant="primary" icon={<Plus size={16} />} aria-label={`Add ${title}`} onClick={() => addWidget(type)}>
                  Add
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </Sheet>
  )
}
