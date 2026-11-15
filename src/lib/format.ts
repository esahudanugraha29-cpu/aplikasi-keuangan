const idr = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const number = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })

let moneyMasked = false

/** When privacy mode is enabled, every formatted amount is masked app-wide. */
export function setMoneyMasked(masked: boolean) {
  moneyMasked = masked
}

export function formatIDR(value: number): string {
  if (moneyMasked) return 'Rp ••••••'
  return idr.format(Math.round(value)).replace(/\u00a0/g, ' ')
}

export function formatNumber(value: number): string {
  return number.format(Math.round(value))
}

/** Compact rupiah for chart axes: 1.2 jt, 850 rb */
export function formatShort(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}${trim(abs / 1_000_000_000)} M`
  if (abs >= 1_000_000) return `${sign}${trim(abs / 1_000_000)} jt`
  if (abs >= 1_000) return `${sign}${trim(abs / 1_000)} rb`
  return `${sign}${Math.round(abs)}`
}

function trim(n: number) {
  return n.toFixed(n >= 100 ? 0 : 1).replace('.', ',')
}

export function parseAmount(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '')
  return digits ? parseInt(digits, 10) : 0
}

export function formatAmountInput(value: number): string {
  if (!value) return ''
  return number.format(value).replace(/\./g, '.')
}

export function percent(part: number, total: number): number {
  if (!total) return 0
  return Math.min(100, Math.max(0, (part / total) * 100))
}
