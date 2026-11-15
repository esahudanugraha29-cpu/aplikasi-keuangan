import type { ReactNode } from 'react'
import { Modal } from './Modal'
import { cn } from '../lib/cn'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'brand'
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  tone = 'danger',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      width="max-w-sm"
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-soft" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            className={cn(tone === 'danger' ? 'btn bg-expense text-white hover:bg-expense/90' : 'btn-primary')}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <h2 className="text-lg font-bold text-text">{title}</h2>
      {description && <div className="mt-2 text-sm leading-relaxed text-muted">{description}</div>}
    </Modal>
  )
}
