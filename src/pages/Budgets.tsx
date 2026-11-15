import { CalendarRange, ChevronLeft, ChevronRight, Copy, Gauge, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { Money } from '../components/Money'
import { PageHeader } from '../components/PageHeader'
import { Progress } from '../components/Progress'
import { cn } from '../lib/cn'
import { currentMonth, formatMonth, shiftMonth } from '../lib/dates'
import { budgetUsage } from '../lib/finance'
import { formatIDR, parseAmount } from '../lib/format'
import { getIcon } from '../lib/icons'
import { useFinance } from '../store/finance'
import { useToast } from '../store/ui'
import type { Budget } from '../types'

export function Budgets() {
  const budgets = useFinance((s) => s.budgets)
  const categories = useFinance((s) => s.categories)
  const transactions = useFinance((s) => s.transactions)
  const addBudget = useFinance((s) => s.addBudget)
  const updateBudget = useFinance((s) => s.updateBudget)
  const deleteBudget = useFinance((s) => s.deleteBudget)
  const push = useToast((s) => s.push)

  const [month, setMonth] = useState(currentMonth())
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Budget | null>(null)
  const [categoryId, setCategoryId] = useState('')
  const [limit, setLimit] = useState(0)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<Budget | null>(null)

  const usage = useMemo(() => budgetUsage(budgets, categories, transactions, month), [budgets, categories, transactions, month])
  const totalLimit = usage.reduce((sum, item) => sum + item.budget.limit, 0)
  const totalUsed = usage.reduce((sum, item) => sum + item.used, 0)
  const remaining = totalLimit - totalUsed
  const overall = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0

  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const usedCategoryIds = new Set(usage.map((item) => item.budget.categoryId))
  const availableCategories = expenseCategories.filter((c) => !usedCategoryIds.has(c.id))

  const previousMonth = shiftMonth(month, -1)
  const prevBudgets = budgets.filter((b) => b.month === previousMonth)
  const canCopy = prevBudgets.length > 0 && usage.length === 0

  useEffect(() => {
    if (!open) return
    setError('')
    if (editing) {
      setCategoryId(editing.categoryId)
      setLimit(editing.limit)
    } else {
      setCategoryId(availableCategories[0]?.id ?? '')
      setLimit(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing])

  const submit = () => {
    if (!categoryId) return setError('Pilih kategori pengeluaran.')
    if (!limit || limit <= 0) return setError('Masukkan batas anggaran.')
    if (editing) {
      updateBudget(editing.id, { categoryId, limit })
      push('Anggaran diperbarui')
    } else {
      addBudget({ categoryId, limit, month })
      push('Anggaran ditambahkan')
    }
    setOpen(false)
    setEditing(null)
  }

  const copyPrevious = () => {
    prevBudgets.forEach((budget) => addBudget({ categoryId: budget.categoryId, limit: budget.limit, month }))
    push('Anggaran disalin dari bulan lalu')
  }

  return (
    <div>
      <PageHeader
        title="Anggaran"
        subtitle="Tetapkan batas pengeluaran per kategori. Indikator berubah warna saat mendekati limit."
        actions={
          <button
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
            className="btn-primary"
            disabled={!availableCategories.length}
          >
            <Plus className="size-4" strokeWidth={2.6} />
            Anggaran baru
          </button>
        }
      />

      <div className="card mb-5 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            className="grid size-8 place-items-center rounded-lg border border-border text-muted transition hover:bg-surface-2 hover:text-text"
            aria-label="Bulan sebelum"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex min-w-[140px] items-center justify-center gap-1.5 text-sm font-semibold text-text">
            <CalendarRange className="size-4 text-brand" />
            {formatMonth(month)}
          </div>
          <button
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            className="grid size-8 place-items-center rounded-lg border border-border text-muted transition hover:bg-surface-2 hover:text-text"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="size-4" />
          </button>
          {month !== currentMonth() && (
            <button onClick={() => setMonth(currentMonth())} className="ml-1 text-[11px] font-semibold text-brand hover:underline">
              Bulan ini
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11.5px]">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted">Total anggaran</p>
            <p className="mt-0.5 font-semibold text-text">
              <Money value={totalLimit} />
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted">Terpakai</p>
            <p className="mt-0.5 font-semibold text-expense">
              <Money value={totalUsed} />
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted">Sisa</p>
            <p className={cn('mt-0.5 font-semibold', remaining < 0 ? 'text-expense' : 'text-income')}>
              <Money value={remaining} />
            </p>
          </div>
        </div>
      </div>

      {usage.length > 0 && (
        <div className="card mb-5 p-5">
          <div className="mb-2 flex items-center justify-between text-[12px]">
            <span className="font-semibold text-text">Pemakaian keseluruhan</span>
            <span className={cn('font-semibold tabular', overall > 100 ? 'text-expense' : 'text-muted')}>
              {Math.round(overall)}%
            </span>
          </div>
          <Progress value={overall} color={overall > 100 ? '#f43f5e' : 'linear-gradient(90deg,#10b981,#0ea5e9)'} height={10} />
          <p className="mt-2 text-[11px] text-muted">
            {remaining >= 0
              ? `Kamu masih punya ${formatIDR(remaining)} untuk dibelanjakan bulan ini.`
              : `Pengeluaran melebihi anggaran sebesar ${formatIDR(Math.abs(remaining))}.`}
          </p>
        </div>
      )}

      {usage.length ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {usage.map((item) => {
            const Icon = getIcon(item.category?.icon)
            const pct = Math.round(item.ratio * 100)
            const color = item.ratio >= 1 ? '#f43f5e' : item.ratio >= 0.8 ? '#f59e0b' : item.category?.color ?? '#10b981'
            return (
              <div key={item.budget.id} className="card card-hover p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-xl"
                    style={{ backgroundColor: `${item.category?.color ?? '#94a3b8'}1f`, color: item.category?.color ?? '#94a3b8' }}
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[13.5px] font-bold text-text">{item.category?.name ?? 'Kategori'}</p>
                      <span
                        className={cn(
                          'shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold',
                          item.ratio >= 1
                            ? 'bg-expense/10 text-expense'
                            : item.ratio >= 0.8
                              ? 'bg-warn/10 text-warn'
                              : 'bg-income/10 text-income',
                        )}
                      >
                        {pct}%
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted">
                      <Money value={item.used} /> dari <Money value={item.budget.limit} />
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      onClick={() => {
                        setEditing(item.budget)
                        setOpen(true)
                      }}
                      className="grid size-7 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-text"
                      aria-label="Ubah anggaran"
                    >
                      <Pencil className="size-3" />
                    </button>
                    <button
                      onClick={() => setDeleting(item.budget)}
                      className="grid size-7 place-items-center rounded-lg text-muted transition hover:bg-expense/10 hover:text-expense"
                      aria-label="Hapus anggaran"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
                <Progress value={item.ratio * 100} color={color} height={7} className="mt-3.5" />
                <p className="mt-1.5 text-[10.5px] text-muted">
                  {item.remaining >= 0 ? (
                    <>
                      Sisa <span className="font-semibold text-text"><Money value={item.remaining} /></span>
                    </>
                  ) : (
                    <span className="font-semibold text-expense">Lewat <Money value={Math.abs(item.remaining)} /></span>
                  )}
                </p>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={Gauge}
            title="Belum ada anggaran bulan ini"
            description="Tentukan batas pengeluaran per kategori agar keuangan tetap terkendali."
            action={
              canCopy ? (
                <button onClick={copyPrevious} className="btn-primary">
                  <Copy className="size-4" /> Salin dari bulan lalu
                </button>
              ) : (
                <button onClick={() => setOpen(true)} className="btn-primary">
                  <Plus className="size-4" /> Buat anggaran
                </button>
              )
            }
          />
        </div>
      )}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Ubah anggaran' : 'Anggaran baru'}
        subtitle={formatMonth(month)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="btn-soft"
              onClick={() => {
                setOpen(false)
                setEditing(null)
              }}
            >
              Batal
            </button>
            <button className="btn-primary" onClick={submit}>
              Simpan
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Kategori</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input">
              {(editing ? expenseCategories : availableCategories).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {!editing && !availableCategories.length && (
              <p className="mt-2 text-[11px] text-muted">Semua kategori sudah punya anggaran bulan ini.</p>
            )}
          </div>
          <div>
            <label className="label">Batas bulanan</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">Rp</span>
              <input
                inputMode="numeric"
                autoFocus
                value={limit ? new Intl.NumberFormat('id-ID').format(limit) : ''}
                onChange={(e) => setLimit(parseAmount(e.target.value))}
                placeholder="1.000.000"
                className="input pl-9"
              />
            </div>
            <div className="mt-2 flex gap-1.5">
              {[500_000, 1_000_000, 2_000_000, 5_000_000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setLimit(preset)}
                  className="chip transition hover:text-text"
                >
                  {formatIDR(preset).replace('Rp', '').trim()}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="rounded-xl bg-expense/10 px-3 py-2.5 text-xs font-medium text-expense">{error}</p>}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Hapus anggaran ini?"
        description="Batas pengeluaran untuk kategori ini akan dihapus dari bulan tersebut."
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return
          deleteBudget(deleting.id)
          push('Anggaran dihapus', 'info')
        }}
      />
    </div>
  )
}
