import type { Category, FinanceData, Transaction, Wallet } from '../types'

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportBackup(data: FinanceData) {
  const snapshot = {
    version: 1,
    app: 'Dompetku',
    exportedAt: new Date().toISOString(),
    data,
  }
  const stamp = new Date().toISOString().slice(0, 10)
  download(`dompetku-backup-${stamp}.json`, JSON.stringify(snapshot, null, 2), 'application/json')
}

export function exportCSV(
  transactions: Transaction[],
  wallets: Wallet[],
  categories: Category[],
  label: string,
) {
  const rows = [
    ['Tanggal', 'Jenis', 'Kategori', 'Dompet', 'Dompet Tujuan', 'Catatan', 'Nominal'],
    ...transactions.map((tx) => {
      const category = categories.find((c) => c.id === tx.categoryId)
      const wallet = wallets.find((w) => w.id === tx.walletId)
      const toWallet = wallets.find((w) => w.id === tx.toWalletId)
      return [
        tx.date,
        tx.type === 'income' ? 'Pemasukan' : tx.type === 'expense' ? 'Pengeluaran' : 'Transfer',
        category?.name ?? '',
        wallet?.name ?? '',
        toWallet?.name ?? '',
        tx.note,
        String(tx.amount),
      ]
    }),
  ]
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n')
  download(`dompetku-${label}.csv`, `\uFEFF${csv}`, 'text/csv;charset=utf-8')
}

export function parseBackup(text: string): FinanceData {
  const parsed = JSON.parse(text) as unknown
  if (!parsed || typeof parsed !== 'object') throw new Error('Isi file tidak dikenali.')
  const raw = parsed as Record<string, unknown>
  const data = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as Record<string, unknown>
  if (!Array.isArray(data.wallets) || !Array.isArray(data.categories) || !Array.isArray(data.transactions)) {
    throw new Error('File backup tidak memiliki data dompet, kategori, atau transaksi.')
  }
  return {
    wallets: data.wallets as Wallet[],
    categories: data.categories as Category[],
    transactions: data.transactions as Transaction[],
    budgets: Array.isArray(data.budgets) ? (data.budgets as FinanceData['budgets']) : [],
    goals: Array.isArray(data.goals) ? (data.goals as FinanceData['goals']) : [],
    profile:
      data.profile && typeof data.profile === 'object'
        ? (data.profile as FinanceData['profile'])
        : { name: 'Sahabat', hideBalances: false },
  }
}
