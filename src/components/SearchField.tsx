import { forwardRef, type InputHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'
import styles from './SearchField.module.css'

interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string
  onChange: (value: string) => void
  label: string
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { value, onChange, label, placeholder = 'Search', className, ...rest },
  ref,
) {
  return (
    <div className={`glass-thin ${styles.field} ${className ?? ''}`}>
      <Search className={styles.icon} aria-hidden="true" />
      <input
        ref={ref}
        type="search"
        className={styles.input}
        aria-label={label}
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
      {value && (
        <button type="button" className={styles.clear} aria-label="Clear search" onClick={() => onChange('')}>
          <X size={14} strokeWidth={3} />
        </button>
      )}
    </div>
  )
})
