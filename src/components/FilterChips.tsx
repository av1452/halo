import styles from './FilterChips.module.css'

interface FilterChipsProps {
  label: string
  options: readonly { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}

/** A horizontally scrolling row of single-select filter chips. */
export function FilterChips({ label, options, value, onChange }: FilterChipsProps) {
  return (
    <div className={styles.row} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          className={o.value === value ? `${styles.chip} ${styles.active}` : `glass-thin ${styles.chip}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
