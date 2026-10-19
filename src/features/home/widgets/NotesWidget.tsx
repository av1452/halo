import { StickyNote } from 'lucide-react'
import { notesStore } from '../widgetStores'
import { WidgetFrame } from './WidgetFrame'
import styles from '../home.module.css'

export function NotesWidget() {
  const note = notesStore.use()
  return (
    <WidgetFrame title="Notes" icon={StickyNote}>
      <textarea
        className={styles.notes}
        aria-label="Notes"
        placeholder="Jot something down… Saved on this device."
        value={note}
        maxLength={5000}
        onChange={(e) => notesStore.set(e.target.value)}
      />
    </WidgetFrame>
  )
}
