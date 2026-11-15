import { format, parseISO } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

export function formatDate(iso: string): string {
  return format(parseISO(iso), 'd MMM yyyy', { locale: localeID })
}

export function formatDateLong(date: Date): string {
  return format(date, "EEEE, d MMMM yyyy", { locale: localeID })
}

export function formatDayLabel(iso: string): string {
  const d = parseISO(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  if (same(d, today)) return 'Hari ini'
  if (same(d, yesterday)) return 'Kemarin'
  return format(d, 'EEEE, d MMMM yyyy', { locale: localeID })
}

export function formatMonth(month: string): string {
  return format(parseISO(`${month}-01`), 'MMMM yyyy', { locale: localeID })
}

export function formatMonthShort(month: string): string {
  return format(parseISO(`${month}-01`), 'MMM', { locale: localeID })
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function currentMonth(): string {
  return format(new Date(), 'yyyy-MM')
}

export function shiftMonth(month: string, delta: number): string {
  const d = parseISO(`${month}-01`)
  d.setMonth(d.getMonth() + delta)
  return format(d, 'yyyy-MM')
}

export function daysInMonth(month: string): number {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Date(year, monthNumber, 0).getDate()
}

export function shiftDay(iso: string, delta: number): string {
  const d = parseISO(iso)
  d.setDate(d.getDate() + delta)
  return format(d, 'yyyy-MM-dd')
}

export function lastMonths(count: number): string[] {
  const result: string[] = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push(format(d, 'yyyy-MM'))
  }
  return result
}

export function greeting(): string {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 19) return 'Selamat sore'
  return 'Selamat malam'
}
