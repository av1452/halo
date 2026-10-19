import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { GlassCard } from '../../../components/GlassCard'
import styles from '../home.module.css'

interface WidgetFrameProps {
  title: string
  icon: LucideIcon
  action?: ReactNode
  badge?: ReactNode
  children: ReactNode
}

export function WidgetFrame({ title, icon: Icon, action, badge, children }: WidgetFrameProps) {
  return (
    <GlassCard as="section" aria-label={title} className={styles.widget} padding="none">
      <header className={styles.widgetHeader}>
        <h2 className={styles.widgetTitle}>
          <Icon size={16} aria-hidden="true" />
          {title}
        </h2>
        {badge}
        {action && <div className={styles.widgetAction}>{action}</div>}
      </header>
      <div className={styles.widgetBody}>{children}</div>
    </GlassCard>
  )
}
