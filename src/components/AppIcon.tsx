import type { CSSProperties } from 'react'
import { GLYPHS } from './glyphs'
import styles from './AppIcon.module.css'

interface AppIconProps {
  name: string
  color: string
  glyph?: string
  size?: number
}

/** A rounded-square tile with a glyph, or the first letter of the name. */
export function AppIcon({ name, color, glyph, size = 60 }: AppIconProps) {
  const Icon = glyph ? GLYPHS[glyph]?.icon : undefined
  return (
    <span
      className={styles.icon}
      style={{ '--tile': color, '--size': `${size}px` } as CSSProperties}
      aria-hidden="true"
    >
      {Icon ? <Icon className={styles.glyph} strokeWidth={2} /> : <span className={styles.letter}>{name.trim().charAt(0).toUpperCase() || '?'}</span>}
    </span>
  )
}
