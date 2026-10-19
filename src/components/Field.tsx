import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import styles from './Field.module.css'

interface FieldShellProps {
  label: string
  hint?: ReactNode
  error?: string
  children: (ids: { inputId: string; describedBy?: string }) => ReactNode
}

function FieldShell({ label, hint, error, children }: FieldShellProps) {
  const inputId = useId()
  const hintId = useId()
  const describedBy = error || hint ? hintId : undefined
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>{label}</label>
      {children({ inputId, describedBy })}
      {(error || hint) && (
        <p id={hintId} className={error ? styles.error : styles.hint} role={error ? 'alert' : undefined}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string
  hint?: ReactNode
  error?: string
  onChange: (value: string) => void
}

export function TextField({ label, hint, error, onChange, ...rest }: TextFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ inputId, describedBy }) => (
        <input
          id={inputId}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          {...rest}
        />
      )}
    </FieldShell>
  )
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string
  hint?: ReactNode
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
}

export function SelectField({ label, hint, options, onChange, ...rest }: SelectFieldProps) {
  return (
    <FieldShell label={label} hint={hint}>
      {({ inputId, describedBy }) => (
        <select id={inputId} className={styles.input} aria-describedby={describedBy} onChange={(e) => onChange(e.target.value)} {...rest}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}
    </FieldShell>
  )
}
