import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { useToast } from '../store/ui'
import { cn } from '../lib/cn'

export function Toaster() {
  const toasts = useToast((s) => s.toasts)
  const dismiss = useToast((s) => s.dismiss)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:items-end">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.button
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            onClick={() => dismiss(toast.id)}
            className="pointer-events-auto flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-text shadow-pop"
          >
            {toast.tone === 'success' && <CheckCircle2 className="size-4 text-income" />}
            {toast.tone === 'error' && <AlertTriangle className="size-4 text-expense" />}
            {toast.tone === 'info' && <Info className="size-4 text-brand-2" />}
            <span className={cn(toast.tone === 'error' && 'text-expense')}>{toast.message}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
