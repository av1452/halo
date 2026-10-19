import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'plain' | 'danger'

/** Lets links and other elements share the button appearance. */
export function buttonClassName(variant: ButtonVariant = 'secondary', size: 'sm' | 'md' = 'md') {
  return [styles.button, styles[variant], styles[size]].join(' ')
}
