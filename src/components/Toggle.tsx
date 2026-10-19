import styles from './Toggle.module.css'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  /** Hide the label visually while keeping it for assistive tech */
  hideLabel?: boolean
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, hideLabel = true, disabled }: ToggleProps) {
  return (
    <label className={styles.wrapper}>
      <span className={hideLabel ? 'visually-hidden' : styles.label}>{label}</span>
      <input
        type="checkbox"
        role="switch"
        className={styles.input}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
    </label>
  )
}
