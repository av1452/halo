import type { ReactNode } from 'react'
import { GlassCard } from '../../components/GlassCard'
import styles from './settings.module.css'

interface GroupProps {
  id?: string
  title: string
  footer?: ReactNode
  children: ReactNode
}

/** An iOS-style grouped list section. */
export function SettingsGroup({ id, title, footer, children }: GroupProps) {
  return (
    <section id={id} className={styles.group} aria-labelledby={id ? `${id}-title` : undefined} aria-label={id ? undefined : title}>
      <h2 id={id ? `${id}-title` : undefined} className={styles.groupTitle}>{title}</h2>
      <GlassCard padding="none" className={styles.groupCard}>{children}</GlassCard>
      {footer && <p className={styles.groupFooter}>{footer}</p>}
    </section>
  )
}

interface RowProps {
  label: ReactNode
  description?: ReactNode
  control?: ReactNode
  /** Stack the control below the label (for wide controls) */
  stacked?: boolean
}

export function SettingsRow({ label, description, control, stacked }: RowProps) {
  return (
    <div className={stacked ? `${styles.row} ${styles.stacked}` : styles.row}>
      <div className={styles.rowText}>
        <div className={styles.rowLabel}>{label}</div>
        {description && <div className={styles.rowDescription}>{description}</div>}
      </div>
      {control && <div className={styles.rowControl}>{control}</div>}
    </div>
  )
}
