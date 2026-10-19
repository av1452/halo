import type { ReactNode } from 'react'
import { Button } from './Button'
import { Sheet } from './Sheet'

interface ConfirmDialogProps {
  open: boolean
  title: string
  children?: ReactNode
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, children, confirmLabel, destructive, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Sheet
      open={open}
      kind="alert"
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button onClick={onCancel} data-autofocus>Cancel</Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      {children}
    </Sheet>
  )
}
