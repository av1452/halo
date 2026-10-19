import { FlaskConical } from 'lucide-react'
import styles from './DemoBadge.module.css'

/** Marks simulated or sample content so it is never mistaken for live data. */
export function DemoBadge({ label = 'Demo' }: { label?: string }) {
  return (
    <span className={styles.badge}>
      <FlaskConical size={12} aria-hidden="true" />
      {label}
    </span>
  )
}
