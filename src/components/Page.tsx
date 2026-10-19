import type { ReactNode } from 'react'
import styles from './Page.module.css'

interface PageProps {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
}

export function Page({ title, subtitle, actions, children }: PageProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titles}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>
      {children}
    </div>
  )
}

interface SectionProps {
  title: string
  action?: ReactNode
  children: ReactNode
}

export function PageSection({ title, action, children }: SectionProps) {
  return (
    <section className={styles.section} aria-label={title}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

interface EmptyStateProps {
  icon: ReactNode
  title: string
  children?: ReactNode
  action?: ReactNode
}

export function EmptyState({ icon, title, children, action }: EmptyStateProps) {
  return (
    <div className={`glass-thin ${styles.empty}`}>
      <span className={styles.emptyIcon} aria-hidden="true">{icon}</span>
      <h3 className={styles.emptyTitle}>{title}</h3>
      {children && <p className={styles.emptyText}>{children}</p>}
      {action}
    </div>
  )
}
