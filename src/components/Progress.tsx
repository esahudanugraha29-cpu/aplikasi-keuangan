import { motion } from 'framer-motion'
import { cn } from '../lib/cn'

interface ProgressProps {
  value: number
  color?: string
  className?: string
  height?: number
  animate?: boolean
}

export function Progress({ value, color = 'var(--brand)', className, height = 8, animate = true }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-surface-2 ring-1 ring-border/50 ring-inset', className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        initial={animate ? { width: 0 } : false}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  )
}
