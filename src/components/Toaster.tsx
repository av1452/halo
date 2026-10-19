import { X } from 'lucide-react'
import { dismissToast, useToasts } from './toastStore'
import styles from './Toaster.module.css'

export function Toaster() {
  const toasts = useToasts()
  return (
    <div className={styles.region} role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`glass ${styles.toast} ${t.tone ? styles[t.tone] : ''}`}>
          <p className={styles.message}>{t.message}</p>
          {t.actions && (
            <div className={styles.actions}>
              {t.actions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    a.onSelect()
                    dismissToast(t.id)
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
          <button type="button" className={styles.close} aria-label="Dismiss" onClick={() => dismissToast(t.id)}>
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
