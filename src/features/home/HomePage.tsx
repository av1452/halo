import { useState } from 'react'
import { ArrowDown, ArrowUp, Minus, Plus, RectangleHorizontal, Square } from 'lucide-react'
import { Button, IconButton } from '../../components/Button'
import { EmptyState, Page } from '../../components/Page'
import { greetingFor, useNow } from '../../hooks/useNow'
import { preferencesStore } from '../settings/preferencesStore'
import { dashboardStore, moveWidget, removeWidget, toggleWidgetSize } from './dashboardStore'
import { WidgetGallery } from './WidgetGallery'
import { WIDGETS } from './widgets/registry'
import styles from './home.module.css'

export default function HomePage() {
  const layout = dashboardStore.use()
  const { displayName } = preferencesStore.use()
  const now = useNow()
  const [editing, setEditing] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const greeting = `${greetingFor(now)}${displayName.trim() ? `, ${displayName.trim()}` : ''}`

  return (
    <Page
      title={greeting}
      subtitle={now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      actions={
        <>
          {editing && <IconButton label="Add widget" icon={<Plus />} onClick={() => setGalleryOpen(true)} />}
          <Button variant={editing ? 'primary' : 'secondary'} className={editing ? '' : 'glass-thin'} aria-pressed={editing} onClick={() => setEditing((e) => !e)}>
            {editing ? 'Done' : 'Edit'}
          </Button>
        </>
      }
    >
      {layout.length === 0 ? (
        <EmptyState icon={<Plus />} title="Your dashboard is empty" action={<Button variant="primary" onClick={() => setGalleryOpen(true)}>Add Widget</Button>}>
          Add widgets for weather, apps, devices and more.
        </EmptyState>
      ) : (
        <div className={styles.grid}>
          {layout.map((w, i) => {
            const { component: Widget, title } = WIDGETS[w.type]
            return (
              <div key={w.id} className={`${styles.cell} ${w.size === 'wide' ? styles.wide : ''} ${editing ? styles.editingCell : ''}`}>
                {editing && (
                  <div className={`glass-thin ${styles.editBar}`} role="toolbar" aria-label={`${title} widget options`}>
                    <span className={styles.editTitle}>{title}</span>
                    <IconButton label={`Move ${title} earlier`} icon={<ArrowUp />} variant="plain" size="sm" disabled={i === 0} onClick={() => moveWidget(w.id, -1)} />
                    <IconButton label={`Move ${title} later`} icon={<ArrowDown />} variant="plain" size="sm" disabled={i === layout.length - 1} onClick={() => moveWidget(w.id, 1)} />
                    <IconButton
                      label={w.size === 'wide' ? `Make ${title} regular width` : `Make ${title} wide`}
                      icon={w.size === 'wide' ? <Square /> : <RectangleHorizontal />}
                      variant="plain"
                      size="sm"
                      onClick={() => toggleWidgetSize(w.id)}
                    />
                    <IconButton label={`Remove ${title}`} icon={<Minus />} variant="plain" size="sm" onClick={() => removeWidget(w.id)} />
                  </div>
                )}
                <div className={editing ? styles.inert : undefined} inert={editing || undefined}>
                  <Widget />
                </div>
              </div>
            )
          })}
        </div>
      )}
      <WidgetGallery open={galleryOpen} onClose={() => setGalleryOpen(false)} />
    </Page>
  )
}
