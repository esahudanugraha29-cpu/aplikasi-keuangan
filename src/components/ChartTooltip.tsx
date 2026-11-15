import { formatIDR } from '../lib/format'

interface TooltipEntry {
  name?: string
  value?: number | string
  color?: string
  dataKey?: string | number
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string | number
  labels?: Record<string, string>
}

const fallbackLabels: Record<string, string> = {
  income: 'Pemasukan',
  expense: 'Pengeluaran',
  net: 'Arus kas',
  total: 'Total',
}

export function ChartTooltip({ active, payload, label, labels }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-[150px] rounded-xl border border-border bg-surface/95 px-3 py-2.5 shadow-pop backdrop-blur">
      {label !== undefined && <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const key = String(entry.dataKey ?? entry.name ?? index)
          const name = labels?.[key] ?? entry.name ?? fallbackLabels[key] ?? key
          const value = typeof entry.value === 'number' ? entry.value : Number(entry.value ?? 0)
          return (
            <div key={key} className="flex items-center justify-between gap-4 text-[12px]">
              <span className="flex items-center gap-1.5 text-muted">
                <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {name}
              </span>
              <span className="font-semibold text-text">{formatIDR(value)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
