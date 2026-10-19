import type { CSSProperties, ReactNode } from 'react'
import styles from './Slider.module.css'

interface SliderProps {
  value: number
  min?: number
  max?: number
  step?: number
  label: string
  onChange: (value: number) => void
  /** Formats the value for screen readers, e.g. "70%" */
  formatValue?: (value: number) => string
  icon?: ReactNode
  disabled?: boolean
}

export function Slider({ value, min = 0, max = 100, step = 1, label, onChange, formatValue, icon, disabled }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className={styles.slider} style={{ '--fill': `${pct}%` } as CSSProperties}>
      {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      <input
        type="range"
        className={styles.input}
        aria-label={label}
        aria-valuetext={formatValue?.(value)}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}
