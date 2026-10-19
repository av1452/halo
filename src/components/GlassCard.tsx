import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import styles from './GlassCard.module.css'

interface GlassCardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType
  variant?: 'regular' | 'thin'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  interactive?: boolean
  children?: ReactNode
}

export function GlassCard({
  as: Tag = 'div',
  variant = 'regular',
  padding = 'md',
  interactive = false,
  className,
  children,
  ...rest
}: GlassCardProps) {
  const classes = [
    variant === 'thin' ? 'glass-thin' : 'glass',
    styles.card,
    styles[`pad-${padding}`],
    interactive ? styles.interactive : '',
    className ?? '',
  ]
  return (
    <Tag className={classes.filter(Boolean).join(' ')} {...rest}>
      {children}
    </Tag>
  )
}
