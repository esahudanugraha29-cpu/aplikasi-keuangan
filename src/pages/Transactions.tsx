import { ArrowLeftRight, ArrowLeftRightIcon, Plus, Search, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import { CategoryIcon } from '../components/CategoryIcon'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { Money } from '../components/Money'
import { PageHeader } from '../components/PageHeader'
import { cn } from '../lib/cn'
import { currentMonth, formatDayLabel, formatMonth, shiftMonth } from '../lib/dates'
import { getIcon } from '../lib/icons'
import { useFinance } from '../store/finance'
import { useToast, useUI } from '../store/ui'
import type { Transaction, TxType } from '../types'

type TypeFilter = 'all' | TxType

const TYPE_OPTIONS: Array<{ value: TypeFilter; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'expense', label: 'Pengeluaran' },
  { value: 'income', label: 'Pemasukan' },
  { value: 'transfer', label: 'Transfer' },
]

export function Transactions() {
  const transactions = useFinance((s) => s.transactions)
  const categories = useFinance((s) => s.categories)
  const wallets = useFinance((s) => s.wallets)
  const deleteTransaction = useFinance((s) => s.deleteTransaction)
  const openTx = useUI((s) => s.openTx)
  const push = useToast((s) => s.push)

  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [type, setType] = useState<TypeFilter>('all')
  const [month, setMonth] = useState<string>(currentMonth())
  const [walletId, setWalletId] = useState('all')
  const [limit, setLimit] = useState(40)
  const [deleting, setDeleting] = useState<Transaction | null>(null)

  const monthOptions = useMemo(() => {
    const list = [{ value: 'all', label: 'Semua waktu' }]
    for (let i = 0; i < 12; i++) {
      const m = shiftMonth(currentMonth(), -i)
      list.push({ value: m, label: formatMonth(m) })
    }
    return list
  }, [])

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    return transactions
      .filter((tx) => {
        if (type !== 'all' && tx.type !== type) return false
        if (month !== 'all' && !tx.date.startsWith(month)) return false
        if (walletId !== 'all' && tx.walletId !== walletId && tx.toWalletId !== walletId) return false
        if (!q) return true
        const category = categories.find((c) => c.id === tx.categoryId)
        const wallet = wallets.find((w) => w.id === tx.walletId)
        return [tx.note, category?.name, wallet?.name].filter(Boolean).some((text) => text!.toLowerCase().includes(q))
      })
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt))
  }, [transactions, categories, wallets, deferredQuery, type, month, walletId])

  const totals = useMemo(() => {
    let income = 0
    let expense = 0
    for (const tx of filtered) {
      if (tx.type === 'income') income += tx.amount
      if (tx.type === 'expense') expense += tx.amount
    }
    return { income, expense }
  }, [filtered])

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const tx of filtered) {
      const list = map.get(tx.date) ?? []
      list.push(tx)
      map.set(tx.date, list)
    }
    return [...map.entries()].map(([date, list]) => ({ date, list }))
  }, [filtered])

  const visibleGroups = useMemo(() => {
    let count = 0
    const result: Array<{ date: string; list: Transaction[] }> = []
    for (const group of groups) {
      if (count >= limit) break
      const remaining = limit - count
      const list = group.list.slice(0, remaining)
      if (list.length) {
        result.push({ date: group.date, list })
        count += list.length
      }
    }
    return result
  }, [groups, limit])

  const hasFilter = query || type !== 'all' || month !== currentMonth() || walletId !== 'all'

  const resetFilters = () => {
    setQuery('')
    setType('all')
    setMonth(currentMonth())
    setWalletId('all')
  }

  return (
    <div>
      <PageHeader
        title="Transaksi"
        subtitle="Semua pemasukan, pengeluaran, dan perpindahan saldo dalam satu tempat."
        actions={
          <button onClick={() => openTx()} className="btn-primary">
            <Plus className="size-4" strokeWidth={2.6} />
            Transaksi baru
          </button>
        }
      />

      <div className="card p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari catatan, kategori, atau dompet…"
              className="input pl-9"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-border/60 hover:text-text"
                aria-label="Hapus pencarian"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="grid w-full grid-cols-4 rounded-xl border border-border bg-surface-2/60 p-0.5 lg:flex lg:w-auto">
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setType(option.value)}
                  className={cn(
                    'flex-1 rounded-[10px] px-1.5 py-1.5 text-[11px] font-semibold transition-colors lg:flex-none lg:px-2.5 lg:text-[11.5px]',
                    type === option.value ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="input h-[38px] w-auto py-0 text-[12.5px]">
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="input h-[38px] w-auto py-0 text-[12.5px]"
            >
              <option value="all">Semua dompet</option>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </option>
              ))}
            </select>
            {hasFilter && (
              <button onClick={resetFilters} className="btn-ghost h-[38px] px-2.5 text-[12px]">
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-border/60 pt-3 text-[11.5px] text-muted">
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal className="size-3.5" />
            {filtered.length} transaksi
          </span>
          <span>
            Masuk <span className="font-semibold text-income"><Money value={totals.income} /></span>
          </span>
          <span>
            Keluar <span className="font-semibold text-expense"><Money value={totals.expense} /></span>
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {visibleGroups.length ? (
          visibleGroups.map((group) => (
            <section key={group.date}>
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {formatDayLabel(group.date)}
                </h3>
                <span className="text-[10.5px] text-muted/70">{group.list.length} catatan</span>
              </div>
              <div className="card divide-y divide-border/50 overflow-hidden">
                {group.list.map((tx) => {
                  const category = categories.find((c) => c.id === tx.categoryId)
                  const wallet = wallets.find((w) => w.id === tx.walletId)
                  const toWallet = wallets.find((w) => w.id === tx.toWalletId)
                  const isTransfer = tx.type === 'transfer'
                  const Icon = isTransfer ? ArrowLeftRight : getIcon(category?.icon)
                  return (
                    <div
                      key={tx.id}
                      className="group flex items-center gap-3 px-3 py-3 transition-colors hover:bg-surface-2/70 sm:px-4"
                    >
                      <button
                        onClick={() => openTx({ editing: tx })}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <CategoryIcon icon={Icon} color={isTransfer ? '#38bdf8' : category?.color ?? '#94a3b8'} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-text">
                            {tx.note || category?.name || (isTransfer ? 'Transfer' : 'Transaksi')}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10.5px] text-muted">
                            {isTransfer ? (
                              <>
                                <span>{wallet?.name}</span>
                                <ArrowLeftRightIcon className="size-2.5" />
                                <span>{toWallet?.name}</span>
                              </>
                            ) : (
                              <>
                                <span>{category?.name}</span>
                                <span className="size-0.5 rounded-full bg-muted/60" />
                                <span>{wallet?.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          {isTransfer ? (
                            <p className="text-[13px] font-semibold text-muted">
                              <Money value={tx.amount} />
                            </p>
                          ) : (
                            <p className={cn('text-[13px] font-semibold', tx.type === 'income' ? 'text-income' : 'text-text')}>
                              <Money value={tx.type === 'income' ? tx.amount : -tx.amount} signed />
                            </p>
                          )}
                        </div>
                      </button>
                      <button
                        onClick={() => setDeleting(tx)}
                        className="grid size-8 shrink-0 place-items-center rounded-lg text-muted opacity-0 transition hover:bg-expense/10 hover:text-expense focus-visible:opacity-100 group-hover:opacity-100"
                        aria-label="Hapus transaksi"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          ))
        ) : (
          <div className="card">
            <EmptyState
              icon={Search}
              title="Tidak ada transaksi"
              description="Coba ubah filter atau catat transaksi pertamamu. Semua data tersimpan di perangkat ini."
              action={
                <button onClick={() => openTx()} className="btn-primary">
                  <Plus className="size-4" /> Tambah transaksi
                </button>
              }
            />
          </div>
        )}

        {filtered.length > limit && (
          <div className="flex justify-center">
            <button onClick={() => setLimit((n) => n + 40)} className="btn-soft">
              Muat lebih banyak
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Hapus transaksi ini?"
        description={
          deleting
            ? `"${deleting.note || 'Tanpa catatan'}" akan dihapus permanen dan saldo dompet menyesuaikan.`
            : undefined
        }
        confirmLabel="Ya, hapus"
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return
          deleteTransaction(deleting.id)
          push('Transaksi dihapus', 'info')
        }}
      />
    </div>
  )
}
