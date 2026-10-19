import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { buttonClassName, type ButtonVariant } from './buttonClassName'
import styles from './Button.module.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  icon?: ReactNode
}

export function Button({ variant = 'secondary', size = 'md', icon, className, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={[buttonClassName(variant, size), className ?? ''].join(' ')}
      {...rest}
    >
      {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      {children}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  icon: ReactNode
  variant?: 'glass' | 'plain' | 'filled'
  size?: 'sm' | 'md' | 'lg'
}

export function IconButton({ label, icon, variant = 'glass', size = 'md', className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={[
        styles.iconButton,
        styles[`icon-${variant}`],
        styles[`icon-${size}`],
        variant === 'glass' ? 'glass-thin' : '',
        className ?? '',
      ].join(' ')}
      {...rest}
    >
      {icon}
    </button>
  )
}
