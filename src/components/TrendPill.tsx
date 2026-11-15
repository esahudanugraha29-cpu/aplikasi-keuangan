import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '../lib/cn'

interface TrendPillProps {
  value: number | null
  invert?: boolean
  suffix?: string
}

export function TrendPill({ value, invert = false, suffix = '%' }: TrendPillProps) {
  if (value === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold text-muted">
        <Minus className="size-3" />
        baru
      </span>
    )
  }
  const positive = value >= 0
  const good = invert ? !positive : positive
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular',
        good ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense',
      )}
    >
      {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
      {Math.abs(value)}
      {suffix}
    </span>
  )
}
