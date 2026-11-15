import type { Budget, Category, Transaction, Wallet } from '../types'

export function walletBalances(wallets: Wallet[], transactions: Transaction[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const wallet of wallets) map[wallet.id] = wallet.initialBalance
  for (const tx of transactions) {
    if (tx.type === 'income') map[tx.walletId] = (map[tx.walletId] ?? 0) + tx.amount
    if (tx.type === 'expense') map[tx.walletId] = (map[tx.walletId] ?? 0) - tx.amount
    if (tx.type === 'transfer') {
      map[tx.walletId] = (map[tx.walletId] ?? 0) - tx.amount
      if (tx.toWalletId) map[tx.toWalletId] = (map[tx.toWalletId] ?? 0) + tx.amount
    }
  }
  return map
}

export function totalBalance(wallets: Wallet[], transactions: Transaction[]): number {
  return Object.values(walletBalances(wallets, transactions)).reduce((sum, n) => sum + n, 0)
}

export function monthOf(iso: string): string {
  return iso.slice(0, 7)
}

export function inMonth(transactions: Transaction[], month: string): Transaction[] {
  return transactions.filter((tx) => monthOf(tx.date) === month)
}

export interface MonthStats {
  income: number
  expense: number
  net: number
  count: number
}

export function monthStats(transactions: Transaction[], month: string): MonthStats {
  const list = inMonth(transactions, month)
  let income = 0
  let expense = 0
  for (const tx of list) {
    if (tx.type === 'income') income += tx.amount
    if (tx.type === 'expense') expense += tx.amount
  }
  return { income, expense, net: income - expense, count: list.length }
}

export interface CategorySpend {
  category: Category
  total: number
  count: number
}

export function spendingByCategory(
  transactions: Transaction[],
  categories: Category[],
  month: string,
): CategorySpend[] {
  const map = new Map<string, { total: number; count: number }>()
  for (const tx of inMonth(transactions, month)) {
    if (tx.type !== 'expense') continue
    const key = tx.categoryId ?? 'unknown'
    const prev = map.get(key) ?? { total: 0, count: 0 }
    map.set(key, { total: prev.total + tx.amount, count: prev.count + 1 })
  }
  return [...map.entries()]
    .map(([id, value]) => ({
      category: categories.find((c) => c.id === id) ?? {
        id,
        name: 'Tanpa kategori',
        color: '#94a3b8',
        icon: 'Shapes',
        type: 'expense' as const,
      },
      ...value,
    }))
    .sort((a, b) => b.total - a.total)
}

export interface MonthlyPoint {
  month: string
  income: number
  expense: number
  net: number
}

export function monthlySeries(transactions: Transaction[], months: string[]): MonthlyPoint[] {
  return months.map((month) => {
    const stats = monthStats(transactions, month)
    return { month, income: stats.income, expense: stats.expense, net: stats.net }
  })
}

export interface BudgetUsage {
  budget: Budget
  category: Category | undefined
  used: number
  remaining: number
  ratio: number
}

export function budgetUsage(
  budgets: Budget[],
  categories: Category[],
  transactions: Transaction[],
  month: string,
): BudgetUsage[] {
  return budgets
    .filter((b) => b.month === month)
    .map((budget) => {
      const category = categories.find((c) => c.id === budget.categoryId)
      const used = inMonth(transactions, month)
        .filter((tx) => tx.type === 'expense' && tx.categoryId === budget.categoryId)
        .reduce((sum, tx) => sum + tx.amount, 0)
      const ratio = budget.limit > 0 ? used / budget.limit : 0
      return { budget, category, used, remaining: budget.limit - used, ratio }
    })
    .sort((a, b) => b.ratio - a.ratio)
}

export function savingsRate(income: number, expense: number): number {
  if (income <= 0) return 0
  return Math.max(-999, Math.round(((income - expense) / income) * 100))
}

export function trend(current: number, previous: number): number | null {
  if (!previous) return null
  return Math.round(((current - previous) / previous) * 100)
}
