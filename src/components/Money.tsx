import { useFinance } from '../store/finance'
import { cn } from '../lib/cn'
import { formatIDR } from '../lib/format'

interface MoneyProps {
  value: number
  className?: string
  signed?: boolean
}

export function Money({ value, className, signed = false }: MoneyProps) {
  const hidden = useFinance((s) => s.profile.hideBalances)
  if (hidden) return <span className={cn('tabular tracking-wider', className)}>Rp ••••••</span>
  const sign = signed ? (value >= 0 ? '+' : '−') : value < 0 ? '−' : ''
  return (
    <span className={cn('tabular', className)}>
      {sign}
      {formatIDR(Math.abs(value))}
    </span>
  )
}
